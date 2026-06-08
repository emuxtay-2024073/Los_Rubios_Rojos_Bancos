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
    info: 'bg-[rgba(37,99,235,0.1)] text-[#2563EB]',
    accent: 'bg-[rgba(6,182,212,0.1)] text-[#06B6D4]',
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
