import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { User, AuthContextType } from '../types';
import { registerUser, refreshToken as refreshTokenApi } from '../api/authApi';
import {
  getAuthToken,
  setAuthToken,
  clearAuthToken,
  getStoredUser,
  setStoredUser,
  clearStoredUser,
} from '../api/tokenStore';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MOCK_USER: User = {
  id: 'dev-user',
  email: 'dev@storyforge.local',
  name: 'Dev User',
  role: 'DEVELOPER',
  provider: 'local',
};
const MOCK_TOKEN = 'dev-token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getAuthToken();
    const savedUser = getStoredUser<User>();
    if (token && savedUser) setUser(savedUser);
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, _password: string) => {
    setIsLoading(true);
    try {
      const user: User = { ...MOCK_USER, email: email || MOCK_USER.email };
      setAuthToken(MOCK_TOKEN);
      setStoredUser(user);
      setUser(user);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (email: string, password: string, name: string) => {
    setIsLoading(true);
    try {
      // Intenta crear la cuenta en el backend; si no está disponible (DEV),
      // se ignora el error para no bloquear el flujo. No inicia sesión:
      // el usuario debe loguearse después.
      await registerUser(email, password, name).catch(() => {});
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    clearAuthToken();
    clearStoredUser();
    setUser(null);
  }, []);

  const refreshToken = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      logout();
      return;
    }

    try {
      const response = await refreshTokenApi(token);
      setAuthToken(response.access_token);
      setStoredUser(response.user);
      setUser(response.user);
    } catch (error) {
      logout();
      throw error;
    }
  }, [logout]);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}
