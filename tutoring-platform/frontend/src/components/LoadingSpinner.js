import React from 'react';

function LoadingSpinner({ size = 'md', message = 'Loading...' }) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div className={`${sizeClasses[size]} animate-spin rounded-full border-4 border-gray-300 border-b-blue-600`}></div>
      {message && <p className="mt-4 text-gray-600">{message}</p>}
    </div>
  );
}

export default LoadingSpinner;