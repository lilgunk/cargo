import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: string;
}

interface StoredUser extends User {
  password: string;
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

function getUsers(): StoredUser[] {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) ?? '[]'); } catch { return []; }
}
function saveUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) {
      try { setUser(JSON.parse(raw)); } catch { localStorage.removeItem(SESSION_KEY); }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const users = getUsers();
    const found = users.find(u => u.email === email);
    if (!found || found.password !== password) {
      throw new Error('Неверный email или пароль');
    }
    const { password: _, ...session } = found;
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    setUser(session);
  };

  const register = async (name: string, email: string, password: string) => {
    const users = getUsers();
    if (users.find(u => u.email === email)) {
      throw new Error('Email уже зарегистрирован');
    }
    const newUser: StoredUser = {
      id: crypto.randomUUID(),
      name,
      email,
      password,
      role: email === ADMIN_EMAIL ? 'admin' : 'user',
      createdAt: new Date().toISOString(),
    };
    saveUsers([...users, newUser]);
    const { password: _, ...session } = newUser;
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
