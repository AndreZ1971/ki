import React from 'react';

interface BackButtonProps {
  onClick: () => void;
  label?: string;
  className?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({ 
  onClick, 
  label = 'Zurück',
  className = ''
}) => {
  return (
    <button 
      className={`back-button floating-back ${className}`} 
      onClick={onClick}
    >
      ← {label}
    </button>
  );
};
