import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { hashPassword, verifyPassword } from '../utils/password';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: string;
}

// Only a PBKDF2 hash and its salt are stored. `password` is the legacy plain-text
// field of accounts created before hashing; it is replaced on the next login.
interface StoredUser extends User {
  passwordHash?: string;
  salt?: string;
  password?: string;
}

/** User data without any secrets (safe for the session and the UI). */
export function toPublicUser(u: StoredUser): User {
  return { id: u.id, name: u.name, email: u.email, role: u.role, createdAt: u.createdAt };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const ADMIN_EMAIL = 'admin@loadopti.com';
const USERS_KEY = 'lo_users';
const SESSION_KEY = 'lo_session';

export function getStoredUsers(): StoredUser[] {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) ?? '[]'); } catch { return []; }
}
export function saveStoredUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function readSession(): User | null {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as User; } catch { localStorage.removeItem(SESSION_KEY); return null; }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(readSession);
  const loading = false;

  const login = async (email: string, password: string) => {
    const users = getStoredUsers();
    const found = users.find(u => u.email === email);
    const ok = !!found && (found.passwordHash && found.salt
      ? await verifyPassword(password, { passwordHash: found.passwordHash, salt: found.salt })
      : found.password === password);
    if (!found || !ok) throw new Error('Неверный email или пароль');
    if (!found.passwordHash) {
      // migrate a legacy plain-text account to a hash
      const { password: _legacy, ...rest } = found;
      const hashed = { ...rest, ...(await hashPassword(password)) };
      saveStoredUsers(users.map(u => (u.id === found.id ? hashed : u)));
    }
    const session = toPublicUser(found);
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    setUser(session);
  };

  const register = async (name: string, email: string, password: string) => {
    const users = getStoredUsers();
    if (users.find(u => u.email === email)) throw new Error('Email уже зарегистрирован');
    const newUser: StoredUser = {
      id: crypto.randomUUID(),
      name,
      email,
      ...(await hashPassword(password)),
      role: email === ADMIN_EMAIL ? 'admin' : 'user',
      createdAt: new Date().toISOString(),
    };
    saveStoredUsers([...users, newUser]);
    const session = toPublicUser(newUser);
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    setUser(session);
  };

  const logout = () => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
