import React from 'react';

export const Badge = ({ 
  children, 
  variant = 'info', 
  className = '',
  ...props 
}) => {
  const baseStyles = 'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold';
  
  const variants = {
    success: 'bg-[rgba(16,185,129,0.1)] text-[#10B981]',
    warning: 'bg-[rgba(245,158,11,0.1)] text-[#F59E0B]',
    danger: 'bg-[rgba(239,68,68,0.1)] text-[#EF4444]',
    info: 'bg-[rgba(122,0,25,0.1)] text-[#7A0019]',
    accent: 'bg-[rgba(214,169,74,0.18)] text-[#7A0019]',
  };
  
  return (
    <span
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};
