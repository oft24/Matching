import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { getMe, login as apiLogin, logout as apiLogout, register as apiRegister, setAuthToken } from '../lib/api';
import type { AuthUser } from '../types';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: AuthUser) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = 'matching_token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;
    setAuthToken(token);
    getMe().then(setUser).catch(() => {
      localStorage.removeItem(TOKEN_KEY);
      setAuthToken(null);
    });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setAuthToken(null);
    setUser(null);
    apiLogout().catch(() => {});
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { user: u, token } = await apiLogin(email, password);
    localStorage.setItem(TOKEN_KEY, token);
    setAuthToken(token);
    setUser(u);
  }, []);

  const register = useCallback(async (username: string, email: string, password: string) => {
    const { user: u, token } = await apiRegister(username, email, password);
    localStorage.setItem(TOKEN_KEY, token);
    setAuthToken(token);
    setUser(u);
  }, []);

  const updateUser = useCallback((nextUser: AuthUser) => setUser(nextUser), []);
  const refreshUser = useCallback(async () => setUser(await getMe()), []);

  const value = useMemo(
    () => ({ user, isAuthenticated: !!user, login, register, logout, updateUser, refreshUser }),
    [user, login, register, logout, updateUser, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}

export { TOKEN_KEY };
