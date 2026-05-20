import React from 'react';

function Alert({ type = 'info', message, onClose }) {
  const bgClasses = {
    success: 'bg-green-100 border-green-400 text-green-700',
    error: 'bg-red-100 border-red-400 text-red-700',
    warning: 'bg-yellow-100 border-yellow-400 text-yellow-700',
    info: 'bg-blue-100 border-blue-400 text-blue-700'
  };

  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };

  return (
    <div className={`border px-4 py-3 rounded flex items-start justify-between gap-2 ${bgClasses[type]}`}>
      <div className="flex items-start gap-2">
        <span>{icons[type]}</span>
        <p>{message}</p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="font-bold text-lg hover:opacity-70"
        >
          ×
        </button>
      )}
    </div>
  );
}

export default Alert;