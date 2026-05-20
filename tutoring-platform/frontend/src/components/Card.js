import React from 'react';

function Card({ children, className = '', hoverable = false }) {
  const baseClasses = 'bg-white rounded-lg shadow-md p-6';
  const hoverClasses = hoverable ? 'hover:shadow-lg transition-shadow cursor-pointer' : '';
  
  return (
    <div className={`${baseClasses} ${hoverClasses} ${className}`}>
      {children}
    </div>
  );
}

export default Card;