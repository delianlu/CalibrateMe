// =============================================================================
// Progress Bar Component
// =============================================================================

import React from 'react';

interface ProgressBarProps {
  progress: number;
  message?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress, message }) => {
  return (
    <div style={{ width: '100%' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '0.5rem',
        fontSize: '0.875rem',
        color: '#4a5568',
      }}>
        <span>{message || 'Processing...'}</span>
        <span>{progress.toFixed(0)}%</span>
      </div>
      <div style={{
        width: '100%',
        height: '8px',
        background: '#e2e8f0',
        borderRadius: '4px',
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${progress}%`,
          height: '100%',
          background: 'linear-gradient(90deg, #4299e1, #38b2ac)',
          borderRadius: '4px',
          transition: 'width 0.3s ease',
        }} />
      </div>
    </div>
  );
};

export default ProgressBar;
