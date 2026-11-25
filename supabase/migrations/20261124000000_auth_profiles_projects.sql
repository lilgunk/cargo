-- NaStyk — users, roles and saved projects (Supabase / PostgreSQL).
-- Run once in the Supabase SQL editor (or `supabase db push`).
--
-- Security model:
--   * Accounts live in auth.users (Supabase Auth: hashed passwords, e-mail confirmation).
--   * public.profiles has one row per account, created by a trigger. A new account is
--     always 'user'; 'admin' can only be granted by an admin or from the SQL editor.
--   * Row Level Security: a user sees only their own profile and projects;
--     admins can list profiles, change roles and delete accounts.

-- ── profiles ────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  name       text        not null default '',
  email      text        not null,
  role       text        not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Admin check used by the policies. SECURITY DEFINER avoids RLS recursion.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- New account → profile (name from the sign-up form metadata, role always 'user').
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email)
  values (new.id, coalesce(left(new.raw_user_meta_data ->> 'name', 80), ''), new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- A user may rename themselves, but only an admin may change role or e-mail.
-- (auth.uid() is null in the SQL editor, so the project owner can grant the first admin.)
create or replace function public.protect_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    if new.role is distinct from old.role then
      raise exception 'only an admin can change roles';
    end if;
    if new.email is distinct from old.email or new.id is distinct from old.id then
      raise exception 'e-mail and id cannot be changed';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile on public.profiles;
create trigger protect_profile
  before update on public.profiles
  for each row execute function public.protect_profile();

drop policy if exists "profiles: read own or admin" on public.profiles;
create policy "profiles: read own or admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles: update own or admin" on public.profiles;
create policy "profiles: update own or admin" on public.profiles
  for update using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- Deleting an account (auth.users) cascades to its profile and projects.
create or replace function public.admin_delete_user(target uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;
  if target = auth.uid() then
    raise exception 'an admin cannot delete their own account here';
  end if;
  delete from auth.users where id = target;
end;
$$;

revoke all on function public.admin_delete_user(uuid) from public, anon;
grant execute on function public.admin_delete_user(uuid) to authenticated;

-- ── projects (saved loading plans, Z7) ──────────────────────────────────────
create table if not exists public.projects (
  id       uuid        primary key,
  user_id  uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  name     text        not null check (char_length(name) between 1 and 120),
  data     jsonb       not null,   -- vehicle snapshot, cargo list, plan (see projectService.ts)
  saved_at timestamptz not null default now()
);

create index if not exists projects_user_saved_idx on public.projects (user_id, saved_at desc);

alter table public.projects enable row level security;

drop policy if exists "projects: owner only" on public.projects;
create policy "projects: owner only" on public.projects
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ── first admin (run separately after registering, with your own e-mail) ────
-- update public.profiles set role = 'admin' where email = 'YOUR_EMAIL';
