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
        <label className="text-sm font-medium text-[#2B1117]">
          {label}
        </label>
      )}
      <input
        className={`w-full h-12 rounded-xl border border-[#E5E0D8] px-4 text-sm transition-all duration-250 focus:outline-none focus:border-[#7A0019] focus:shadow-[0_0_0_4px_rgba(122,0,25,0.1)] ${error ? 'border-[#EF4444]' : ''}`}
        {...props}
      />
      {error && (
        <span className="text-xs text-[#EF4444]">
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
        <label className="text-sm font-medium text-[#2B1117]">
          {label}
        </label>
      )}
      <select
        className={`w-full h-12 rounded-xl border border-[#E5E0D8] px-4 text-sm transition-all duration-250 focus:outline-none focus:border-[#7A0019] focus:shadow-[0_0_0_4px_rgba(122,0,25,0.1)] bg-white ${error ? 'border-[#EF4444]' : ''}`}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <span className="text-xs text-[#EF4444]">
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
        <label className="text-sm font-medium text-[#2B1117]">
          {label}
        </label>
      )}
      <textarea
        className={`w-full rounded-xl border border-[#E5E0D8] px-4 py-3 text-sm transition-all duration-250 focus:outline-none focus:border-[#7A0019] focus:shadow-[0_0_0_4px_rgba(122,0,25,0.1)] resize-none ${error ? 'border-[#EF4444]' : ''}`}
        {...props}
      />
      {error && (
        <span className="text-xs text-[#EF4444]">
          {error}
        </span>
      )}
    </div>
  );
};
