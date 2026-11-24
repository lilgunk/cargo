// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthFailure, AuthProvider, useAuth } from './AuthContext';

type Listener = (event: string, session: { user: { id: string; email: string } } | null) => void;
const auth = vi.hoisted(() => ({
  listener: null as Listener | null,
  signUp: vi.fn(),
  signInWithPassword: vi.fn(),
  signOut: vi.fn(async () => ({ error: null })),
}));

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      onAuthStateChange: (cb: Listener) => {
        auth.listener = cb;
        setTimeout(() => cb('INITIAL_SESSION', null), 0);
        return { data: { subscription: { unsubscribe: () => {} } } };
      },
      signUp: auth.signUp,
      signInWithPassword: auth.signInWithPassword,
      signOut: auth.signOut,
    },
    from: () => ({
      select: () => ({
        eq: (_: string, id: string) => ({
          maybeSingle: async () => ({
            data: { id, name: 'Jan', email: 'jan@test.local', role: 'admin', created_at: '2026-11-24T10:00:00Z' },
            error: null,
          }),
        }),
      }),
    }),
  },
}));

const wrapper = ({ children }: { children: ReactNode }) => <AuthProvider>{children}</AuthProvider>;

async function renderAuth() {
  const hook = renderHook(() => useAuth(), { wrapper });
  await waitFor(() => expect(hook.result.current.loading).toBe(false));
  return hook;
}

beforeEach(() => vi.clearAllMocks());

describe('AuthProvider (Supabase)', () => {
  it('reports that a new account must be confirmed by e-mail', async () => {
    auth.signUp.mockResolvedValue({ data: { user: { id: 'u1' }, session: null }, error: null });
    const { result } = await renderAuth();
    await expect(result.current.register(' Jan ', 'jan@test.local', 'abc12345')).resolves.toBe(true);
    expect(auth.signUp).toHaveBeenCalledWith(expect.objectContaining({
      email: 'jan@test.local',
      options: expect.objectContaining({ data: { name: 'Jan' } }),
    }));
    expect(result.current.user).toBeNull();
  });

  it('maps Supabase errors to codes the UI can translate', async () => {
    const { result } = await renderAuth();
    auth.signInWithPassword.mockResolvedValueOnce({ error: { code: 'invalid_credentials', message: 'Invalid login credentials', status: 400 } });
    await expect(result.current.login('a@b.pl', 'x')).rejects.toMatchObject({ code: 'invalid_credentials' });
    auth.signInWithPassword.mockResolvedValueOnce({ error: { code: 'email_not_confirmed', message: 'Email not confirmed', status: 400 } });
    await expect(result.current.login('a@b.pl', 'x')).rejects.toMatchObject({ code: 'email_not_confirmed' });
    auth.signInWithPassword.mockResolvedValueOnce({ error: { code: 'over_request_rate_limit', message: 'Too many', status: 429 } });
    await expect(result.current.login('a@b.pl', 'x')).rejects.toBeInstanceOf(AuthFailure);
  });

  it('loads name and role from the profile when a session appears, clears them on logout', async () => {
    const { result } = await renderAuth();
    act(() => auth.listener!('SIGNED_IN', { user: { id: 'u1', email: 'jan@test.local' } }));
    await waitFor(() => expect(result.current.user).toMatchObject({ id: 'u1', name: 'Jan', role: 'admin' }));
    await act(() => result.current.logout());
    expect(auth.signOut).toHaveBeenCalled();
    expect(result.current.user).toBeNull();
  });

  it('switches to the new-password form after a reset link', async () => {
    const { result } = await renderAuth();
    act(() => auth.listener!('PASSWORD_RECOVERY', { user: { id: 'u1', email: 'jan@test.local' } }));
    expect(result.current.passwordRecovery).toBe(true);
  });
});
