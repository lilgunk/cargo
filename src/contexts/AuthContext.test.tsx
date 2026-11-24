// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { AuthProvider, getStoredUsers, saveStoredUsers, useAuth } from './AuthContext';
import { hashPassword, verifyPassword } from '../utils/password';

const wrapper = ({ children }: { children: ReactNode }) => <AuthProvider>{children}</AuthProvider>;

beforeEach(() => localStorage.clear());

describe('password hashing', () => {
  it('verifies the right password only, with a random salt', async () => {
    const a = await hashPassword('tajne-haslo');
    const b = await hashPassword('tajne-haslo');
    expect(a.salt).not.toBe(b.salt);
    expect(a.passwordHash).not.toBe(b.passwordHash);
    expect(await verifyPassword('tajne-haslo', a)).toBe(true);
    expect(await verifyPassword('zle-haslo', a)).toBe(false);
  });
});

describe('AuthProvider', () => {
  it('never stores the plain password and logs in with it', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(() => result.current.register('Jan', 'jan@test.local', 'abc12345'));
    const raw = localStorage.getItem('lo_users')!;
    expect(raw).not.toContain('abc12345');
    expect(getStoredUsers()[0]).toMatchObject({ email: 'jan@test.local' });
    expect(getStoredUsers()[0].passwordHash).toHaveLength(64);
    expect(localStorage.getItem('lo_session')).not.toContain('passwordHash');

    act(() => result.current.logout());
    await expect(result.current.login('jan@test.local', 'zle')).rejects.toThrow();
    await act(() => result.current.login('jan@test.local', 'abc12345'));
    expect(result.current.user?.email).toBe('jan@test.local');
  });

  it('migrates a legacy plain-text account to a hash on login', async () => {
    saveStoredUsers([{ id: '1', name: 'Old', email: 'old@test.local', role: 'user', createdAt: '2026-01-01', password: 'stare123' }]);
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(() => result.current.login('old@test.local', 'stare123'));
    const stored = getStoredUsers()[0];
    expect(stored.password).toBeUndefined();
    expect(stored.passwordHash).toHaveLength(64);
    expect(localStorage.getItem('lo_users')).not.toContain('stare123');
  });
});
