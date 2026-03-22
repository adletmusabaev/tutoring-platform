import React from 'react';

function Input({
  label,
  type = 'text',
  placeholder,
  error,
  required = false,
  className = '',
  ...props
}) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-gray-700 font-semibold mb-2">
          {label}
          {required && <span className="text-red-600">*</span>}
        </label>
      )}

      <input
        type={type}
        placeholder={placeholder}
        className={`input-field ${error ? 'border-red-500 focus:border-red-500' : ''} ${className}`}
        {...props}
      />

      {error && <p className="text-error">{error}</p>}
    </div>
  );
}

export default Input;