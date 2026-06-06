import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { User, AuthContextType } from '@/types/auth';
import { loginUser, registerUser, refreshToken as refreshTokenApi } from '@/services/authApi';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'storyforge_token';
const USER_STORAGE_KEY = 'storyforge_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar usuario del localStorage al montar
  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEY);
    const savedUser = localStorage.getItem(USER_STORAGE_KEY);

    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await loginUser(email, password);
      localStorage.setItem(STORAGE_KEY, response.access_token);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(response.user));
      setUser(response.user);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (email: string, password: string, name: string) => {
    setIsLoading(true);
    try {
      const response = await registerUser(email, password, name);
      localStorage.setItem(STORAGE_KEY, response.access_token);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(response.user));
      setUser(response.user);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    setUser(null);
  }, []);

  const refreshToken = useCallback(async () => {
    const token = localStorage.getItem(STORAGE_KEY);
    if (!token) {
      logout();
      return;
    }

    try {
      const response = await refreshTokenApi(token);
      localStorage.setItem(STORAGE_KEY, response.access_token);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(response.user));
      setUser(response.user);
    } catch (error) {
      // Si no se puede renovar, desloguea
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

export function getAuthToken() {
  return localStorage.getItem(STORAGE_KEY);
}
