import { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { authService } from '../services/auth.service';
import type { User, LoginRequest } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkAuth = useCallback(async () => {
    const storedToken = authService.getToken();
    if (!storedToken) {
      setLoading(false);
      return;
    }

    setToken(storedToken);
    
    try {
      const userData = await authService.getMe();
      setUser(userData);
      setError(null);
    } catch {
      authService.logout();
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (credentials: LoginRequest) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authService.login(credentials);
      setToken(response.access_token);
      setUser(response.user);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur de connexion';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setToken(null);
    setError(null);
  };

  const value: AuthContextType = {
    user,
    token,
    loading,
    error,
    login,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
