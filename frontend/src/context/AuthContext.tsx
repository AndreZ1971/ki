// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface SessionContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  needsPasswordSetup: boolean;
  
  // Setup Flow (First-Login)
  setPassword: (password: string, passwordConfirm: string) => Promise<void>;
  
  // Login Flow (Normal)
  login: (password: string) => Promise<void>;
  logout: () => Promise<void>;
  
  // Status Check
  checkSession: () => Promise<void>;
  
  error: string | null;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within SessionProvider');
  }
  return context;
};

interface SessionProviderProps {
  children: ReactNode;
}

export const SessionProvider: React.FC<SessionProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [needsPasswordSetup, setNeedsPasswordSetup] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Prüfe ob Passwort bereits gesetzt wurde
   * Bestimmt welcher Flow angezeigt wird (Setup vs Login)
   */
  const checkSession = async () => {
    try {
      setError(null);
      
      // 1. Prüfe ob Password überhaupt gesetzt wurde
      const checkResponse = await fetch('/api/auth/check', {
        method: 'POST',
        credentials: 'include', // Wichtig: Cookies senden
      });

      if (!checkResponse.ok) {
        throw new Error('Failed to check auth status');
      }

      const checkData = await checkResponse.json();

      if (checkData.status === 'first_login_required') {
        setNeedsPasswordSetup(true);
        setIsAuthenticated(false);
      } else {
        // Password ist gesetzt - prüfe ob Session aktiv ist
        try {
          const sessionResponse = await fetch('/api/auth/session', {
            credentials: 'include',
          });

          if (sessionResponse.ok) {
            const sessionData = await sessionResponse.json();
            setIsAuthenticated(sessionData.authenticated);
            setNeedsPasswordSetup(false);
          } else {
            setIsAuthenticated(false);
            setNeedsPasswordSetup(false);
          }
        } catch {
          // Session-Check fehlgeschlagen = nicht authentifiziert
          setIsAuthenticated(false);
          setNeedsPasswordSetup(false);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Session check failed');
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Setup Flow: Setze initiales Passwort beim ersten Login
   */
  const setPassword = async (password: string, passwordConfirm: string) => {
    try {
      setError(null);

      if (password !== passwordConfirm) {
        throw new Error('Passwords do not match');
      }

      const response = await fetch('/api/auth/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Session-Cookie
        body: JSON.stringify({ password, passwordConfirm }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to set password');
      }

      setIsAuthenticated(true);
      setNeedsPasswordSetup(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Password setup failed';
      setError(message);
      throw err;
    }
  };

  /**
   * Login Flow: Mit Passwort anmelden (nach Setup)
   */
  const login = async (password: string) => {
    try {
      setError(null);

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Session-Cookie
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const data = await response.json();
        
        // Spezial-Handling für first_login_required
        if (data.status === 'first_login_required') {
          setNeedsPasswordSetup(true);
          throw new Error('Password not yet set. Please use setup flow.');
        }
        
        throw new Error(data.error || 'Login failed');
      }

      setIsAuthenticated(true);
      setNeedsPasswordSetup(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      throw err;
    }
  };

  /**
   * Logout: Zerstöre Session
   * Session wird auch automatisch zerstört wenn Browser geschlossen wird
   */
  const logout = async () => {
    try {
      setError(null);

      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      }).catch(() => {
        // Logout-Request kann fehlschlagen, aber Session wird trotzdem gelöscht
      });

      setIsAuthenticated(false);
      setNeedsPasswordSetup(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Logout failed';
      setError(message);
      throw err;
    }
  };

  /**
   * Beim Mount: Prüfe Session-Status
   */
  useEffect(() => {
    checkSession();
  }, []);

  const value = {
    isAuthenticated,
    isLoading,
    needsPasswordSetup,
    setPassword,
    login,
    logout,
    checkSession,
    error,
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
};
