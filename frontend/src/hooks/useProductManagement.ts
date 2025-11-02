import { useNavigate } from 'react-router-dom';
import { useState, useCallback } from 'react';

/**
 * Custom Hook für Product Management
 * Zentralisiert Navigation, Loading States und gemeinsame Logik
 */
export const useProductManagement = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBackToDashboard = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handleNavigation = useCallback((path: string) => {
    navigate(path);
  }, [navigate]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    navigate,
    loading,
    setLoading,
    error,
    setError,
    clearError,
    handleBackToDashboard,
    handleNavigation
  };
};

/**
 * Custom Hook für Fortschritts-Simulation
 * Verwendet in Run* Komponenten
 */
export const useProgress = (stepDuration: number = 500) => {
  const [progress, setProgress] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const startProgress = useCallback((onComplete?: () => void) => {
    setIsRunning(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + 10;
        if (newProgress >= 100) {
          clearInterval(interval);
          setIsRunning(false);
          if (onComplete) {
            setTimeout(onComplete, 300);
          }
          return 100;
        }
        return newProgress;
      });
    }, stepDuration);

    return () => clearInterval(interval);
  }, [stepDuration]);

  const resetProgress = useCallback(() => {
    setProgress(0);
    setIsRunning(false);
  }, []);

  return {
    progress,
    isRunning,
    startProgress,
    resetProgress
  };
};
