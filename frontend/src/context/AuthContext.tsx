import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  getMe,
  login as apiLogin,
  logout as apiLogout,
  register as apiRegister,
  resendCode as apiResendCode,
  setAuthToken,
  verifyEmail as apiVerifyEmail,
} from '../lib/api';
import type { AuthUser, VerificationChallenge } from '../types';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  /** No inicia sesión: devuelve el reto de verificación con el código enviado por correo. */
  register: (username: string, email: string, password: string) => Promise<VerificationChallenge>;
  verifyEmail: (email: string, code: string) => Promise<void>;
  resendCode: (email: string) => Promise<VerificationChallenge>;
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

  const startSession = useCallback((nextUser: AuthUser, token: string) => {
    localStorage.setItem(TOKEN_KEY, token);
    setAuthToken(token);
    setUser(nextUser);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { user: u, token } = await apiLogin(email, password);
    startSession(u, token);
  }, [startSession]);

  // El registro ya no abre sesión: la cuenta queda pendiente hasta verificar.
  const register = useCallback(
    (username: string, email: string, password: string) => apiRegister(username, email, password),
    [],
  );

  const verifyEmail = useCallback(async (email: string, code: string) => {
    const { user: u, token } = await apiVerifyEmail(email, code);
    startSession(u, token);
  }, [startSession]);

  const resendCode = useCallback((email: string) => apiResendCode(email), []);

  const updateUser = useCallback((nextUser: AuthUser) => setUser(nextUser), []);
  const refreshUser = useCallback(async () => setUser(await getMe()), []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      login,
      register,
      verifyEmail,
      resendCode,
      logout,
      updateUser,
      refreshUser,
    }),
    [user, login, register, verifyEmail, resendCode, logout, updateUser, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}

export { TOKEN_KEY };
