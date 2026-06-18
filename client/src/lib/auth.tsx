'use client';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, setToken } from './api';

export type Role = 'client' | 'worker' | 'admin';
export interface User {
  id: number;
  name: string | null;
  email: string;
  role: Role;
  phone?: string | null;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: { name: string; email: string; password: string; phone?: string; marketingOptIn?: boolean }) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<User>('/api/auth/me')
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { token, user } = await api<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    setToken(token);
    setUser(user);
    return user;
  }, []);

  const register = useCallback(
    async (data: { name: string; email: string; password: string; phone?: string; marketingOptIn?: boolean }) => {
      const { token, user } = await api<{ token: string; user: User }>('/api/auth/register', {
        method: 'POST',
        body: data,
      });
      setToken(token);
      setUser(user);
      return user;
    },
    []
  );

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
