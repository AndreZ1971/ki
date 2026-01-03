// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async () => {
    console.log('🔐 checkAuth called');
    try {
      const token = localStorage.getItem('authToken');
      console.log('🔐 token from localStorage:', token ? 'exists' : 'null');
      
      if (!token) {
        console.log('🔐 No token, setting isLoading to false');
        setUser(null);
        setIsLoading(false);
        return;
      }

      console.log('🔐 Token exists, fetching /api/auth/me');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log('🔐 Timeout reached, aborting fetch');
        controller.abort();
      }, 5000);

      const response = await fetch('http://localhost:3000/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log('🔐 /api/auth/me response:', response.status);

      if (response.ok) {
        const userData = await response.json();
        console.log('🔐 Auth successful, user:', userData.user.username);
        setUser(userData.user);
      } else {
        console.log('🔐 Auth failed, removing token');
        localStorage.removeItem('authToken');
        setUser(null);
      }
    } catch (error) {
      console.error('🔐 Auth check failed:', error);
      localStorage.removeItem('authToken');
      setUser(null);
    } finally {
      console.log('🔐 Setting isLoading to false');
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    try {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }

      const data = await response.json();
      localStorage.setItem('authToken', data.token);
      setUser(data.user);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setUser(null);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
