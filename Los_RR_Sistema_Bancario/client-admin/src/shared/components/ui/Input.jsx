import React from 'react';

export const Input = ({ 
  label,
  error,
  className = '',
  ...props 
}) => {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-[#0A2472]">
          {label}
        </label>
      )}
      <input
        className={`w-full h-12 rounded-xl border border-[#E5E0D8] px-4 text-sm transition-all duration-250 focus:outline-none focus:border-[#0A2472] focus:shadow-[0_0_0_4px_rgba(10,36,114,0.1)] ${error ? 'border-[#1E3A8A]' : ''}`}
        {...props}
      />
      {error && (
        <span className="text-xs text-[#1E3A8A]">
          {error}
        </span>
      )}
    </div>
  );
};

export const Select = ({ 
  label,
  error,
  options = [],
  className = '',
  ...props 
}) => {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-[#0A2472]">
          {label}
        </label>
      )}
      <select
        className={`w-full h-12 rounded-xl border border-[#E5E0D8] px-4 text-sm transition-all duration-250 focus:outline-none focus:border-[#0A2472] focus:shadow-[0_0_0_4px_rgba(10,36,114,0.1)] bg-white ${error ? 'border-[#1E3A8A]' : ''}`}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <span className="text-xs text-[#1E3A8A]">
          {error}
        </span>
      )}
    </div>
  );
};

export const Textarea = ({ 
  label,
  error,
  className = '',
  ...props 
}) => {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-[#0A2472]">
          {label}
        </label>
      )}
      <textarea
        className={`w-full rounded-xl border border-[#E5E0D8] px-4 py-3 text-sm transition-all duration-250 focus:outline-none focus:border-[#0A2472] focus:shadow-[0_0_0_4px_rgba(10,36,114,0.1)] resize-none ${error ? 'border-[#1E3A8A]' : ''}`}
        {...props}
      />
      {error && (
        <span className="text-xs text-[#1E3A8A]">
          {error}
        </span>
      )}
    </div>
  );
};
