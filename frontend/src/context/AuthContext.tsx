import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  getMe,
  deleteAccount as apiDeleteAccount,
  login as apiLogin,
  loginWithGoogle as apiLoginWithGoogle,
  logout as apiLogout,
  register as apiRegister,
  setAuthToken,
} from '../lib/api';
import type { AuthUser } from '../types';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, acceptTerms: boolean, termsVersion: string) => Promise<void>;
  /** Cambia el ID token de Google por una sesión. Vale para entrar y registrarse. */
  loginWithGoogle: (credential: string, acceptTerms?: boolean, termsVersion?: string) => Promise<void>;
  logout: () => void;
  deleteAccount: () => Promise<void>;
  updateUser: (user: AuthUser) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = 'q2play_token';

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

  const startSession = useCallback((nextUser: AuthUser, token: string) => {
    localStorage.setItem(TOKEN_KEY, token);
    setAuthToken(token);
    setUser(nextUser);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { user: u, token } = await apiLogin(email, password);
    startSession(u, token);
  }, [startSession]);

  const register = useCallback(async (username: string, email: string, password: string, acceptTerms: boolean, termsVersion: string) => {
    const { user: u, token } = await apiRegister(username, email, password, acceptTerms, termsVersion);
    startSession(u, token);
  }, [startSession]);

  const loginWithGoogle = useCallback(async (credential: string, acceptTerms = false, termsVersion?: string) => {
    const { user: u, token } = await apiLoginWithGoogle(credential, acceptTerms, termsVersion);
    startSession(u, token);
  }, [startSession]);

  const updateUser = useCallback((nextUser: AuthUser) => setUser(nextUser), []);
  const refreshUser = useCallback(async () => setUser(await getMe()), []);
  const deleteAccount = useCallback(async () => {
    await apiDeleteAccount();
    localStorage.removeItem(TOKEN_KEY);
    setAuthToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      login,
      register,
      loginWithGoogle,
      logout,
      deleteAccount,
      updateUser,
      refreshUser,
    }),
    [user, login, register, loginWithGoogle, logout, deleteAccount, updateUser, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}

export { TOKEN_KEY };
