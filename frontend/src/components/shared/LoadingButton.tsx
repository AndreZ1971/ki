import React from 'react';

interface LoadingButtonProps {
  onClick: () => void;
  loading: boolean;
  disabled?: boolean;
  loadingText?: string;
  children: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary';
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  onClick,
  loading,
  disabled = false,
  loadingText = 'Lädt...',
  children,
  className = '',
  variant = 'primary'
}) => {
  return (
    <button 
      className={`action-button ${variant} ${loading ? 'loading' : ''} ${className}`}
      onClick={onClick}
      disabled={loading || disabled}
    >
      {loading ? loadingText : children}
    </button>
  );
};
