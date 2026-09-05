import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { TOKEN_STORAGE_KEY, USER_STORAGE_KEY, registerUnauthorizedHandler } from '../api/client';
import { loginUser, getCurrentUser } from '../api/endpoints';
import type { UserResponse } from '../api/types';

interface AuthContextType {
  user: UserResponse | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode; onRequireLogin?: () => void }> = ({
  children,
  onRequireLogin,
}) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_STORAGE_KEY));
  const [user, setUser] = useState<UserResponse | null>(() => {
    const saved = localStorage.getItem(USER_STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    setToken(null);
    setUser(null);
    setError(null);
    if (onRequireLogin) {
      onRequireLogin();
    }
  }, [onRequireLogin]);

  useEffect(() => {
    registerUnauthorizedHandler(() => {
      logout();
    });
  }, [logout]);

  // Validate existing token on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (storedToken) {
        try {
          const userProfile = await getCurrentUser();
          setUser(userProfile);
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userProfile));
        } catch {
          // Token invalid or backend unreachable
          localStorage.removeItem(TOKEN_STORAGE_KEY);
          localStorage.removeItem(USER_STORAGE_KEY);
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await loginUser({ username, password });
      localStorage.setItem(TOKEN_STORAGE_KEY, res.access_token);
      setToken(res.access_token);

      const userProfile = await getCurrentUser();
      setUser(userProfile);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userProfile));
    } catch (err: any) {
      setError(err?.message || 'Invalid official credentials. Please verify username and password.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout,
        error,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
