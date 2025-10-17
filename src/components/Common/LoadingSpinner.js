import React from 'react';

const LoadingSpinner = ({ message = 'Loading...', size = 'medium', className = '' }) => {
  const sizeClasses = {
    small: 'spinner-border-sm',
    medium: '',
    large: 'spinner-border-lg'
  };

  return (
    <div className={`d-flex flex-column align-items-center justify-content-center gap-2 ${className}`}>
      <div className={`spinner-border text-primary ${sizeClasses[size]}`} role="status" style={{width: size === 'small' ? 24 : size === 'large' ? 48 : 32, height: size === 'small' ? 24 : size === 'large' ? 48 : 32}}>
        <span className="visually-hidden">Loading...</span>
      </div>
      {message && (
        <div className="small text-muted text-center" style={{maxWidth: 320}}>{message}</div>
      )}
    </div>
  );
};

export default LoadingSpinner;