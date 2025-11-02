import React from 'react';

interface ProgressBarProps {
  progress: number;
  steps?: string[];
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ 
  progress, 
  steps = [],
  className = '' 
}) => {
  const getStepProgress = (index: number) => {
    const stepSize = 100 / steps.length;
    return progress >= stepSize * (index + 1);
  };

  return (
    <div className={`progress-section ${className}`}>
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      {steps.length > 0 && (
        <div className="progress-steps">
          {steps.map((step, index) => (
            <div 
              key={index} 
              className={`step ${getStepProgress(index) ? 'completed' : ''}`}
            >
              {step}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
