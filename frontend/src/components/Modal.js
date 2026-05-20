import React from 'react';

function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl'
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className={`bg-white rounded-lg shadow-xl p-6 ${sizeClasses[size]} w-full mx-4`}>
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">{title}</h2>
          <button
            onClick={onClose}
            className="text-2xl font-bold text-gray-600 hover:text-gray-800"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="mb-6">
          {children}
        </div>
      </div>
    </div>
  );
}

export default Modal;