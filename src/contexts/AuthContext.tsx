import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../lib/supabase';

// Accounts are Supabase Auth users (hashed passwords, e-mail confirmation);
// name and role come from public.profiles (see supabase/migrations).

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: string;
}

/** Error codes shown to the user in their language (translations: auth_err_*). */
export type AuthErrorCode =
  | 'invalid_credentials'
  | 'email_not_confirmed'
  | 'weak_password'
  | 'rate_limited'
  | 'network'
  | 'unknown';

export class AuthFailure extends Error {
  readonly code: AuthErrorCode;
  constructor(code: AuthErrorCode, message?: string) {
    super(message ?? code);
    this.code = code;
  }
}

function toFailure(error: { code?: string; message?: string; status?: number } | null): AuthFailure {
  const code = error?.code ?? '';
  const msg = error?.message ?? '';
  if (code === 'invalid_credentials' || msg === 'Invalid login credentials') return new AuthFailure('invalid_credentials');
  if (code === 'email_not_confirmed' || /not confirmed/i.test(msg)) return new AuthFailure('email_not_confirmed');
  if (code === 'weak_password' || /password should/i.test(msg)) return new AuthFailure('weak_password', msg);
  if (code.startsWith('over_') || error?.status === 429) return new AuthFailure('rate_limited');
  if (/fetch|network/i.test(msg)) return new AuthFailure('network');
  return new AuthFailure('unknown', msg);
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  /** true after the user opened a password-reset link (show the new-password form) */
  passwordRecovery: boolean;
  /** true when the app was opened from an e-mail link that is expired or already used */
  linkError: boolean;
  login: (email: string, password: string) => Promise<void>;
  /** Returns true when the account still has to be confirmed by e-mail. */
  register: (name: string, email: string, password: string) => Promise<boolean>;
  resendConfirmation: (email: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

/** Where links from e-mails lead back to (the current site, works on any domain). */
const siteUrl = (path: string) => `${window.location.origin}${path}`;

/** Supabase reports a bad e-mail link as #error_code=… in the URL it redirects to. */
const hasLinkError = () => new URLSearchParams(window.location.hash.slice(1)).has('error_code');

async function fetchProfile(id: string, fallbackEmail: string): Promise<User> {
  const { data } = await supabase
    .from('profiles')
    .select('id, name, email, role, created_at')
    .eq('id', id)
    .maybeSingle();
  if (!data) return { id, name: '', email: fallbackEmail, role: 'user', createdAt: new Date().toISOString() };
  return { id: data.id, name: data.name, email: data.email, role: data.role === 'admin' ? 'admin' : 'user', createdAt: data.created_at };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [passwordRecovery, setPasswordRecovery] = useState(false);
  const [linkError] = useState(hasLinkError);

  useEffect(() => {
    let active = true;
    // Also picks up the session from a confirmation / reset link in the URL.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') setPasswordRecovery(true);
      // Never await Supabase calls inside this callback (it can deadlock the client).
      setTimeout(async () => {
        const next = session?.user ? await fetchProfile(session.user.id, session.user.email ?? '') : null;
        if (!active) return;
        setUser(next);
        setLoading(false);
      }, 0);
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw toFailure(error);
  };

  const register = async (name: string, email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name: name.trim() }, emailRedirectTo: siteUrl('/app') },
    });
    if (error) throw toFailure(error);
    return !data.session; // no session yet → the confirmation e-mail was sent
  };

  const resendConfirmation = async (email: string) => {
    const { error } = await supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo: siteUrl('/app') } });
    if (error) throw toFailure(error);
  };

  const requestPasswordReset = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: siteUrl('/reset-password') });
    if (error) throw toFailure(error);
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw toFailure(error);
    setPasswordRecovery(false);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, passwordRecovery, linkError, login, register, resendConfirmation, requestPasswordReset, updatePassword, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
