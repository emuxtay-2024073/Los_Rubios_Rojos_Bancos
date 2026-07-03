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
    danger: 'bg-[rgba(30,58,138,0.1)] text-[#1E3A8A]',
    info: 'bg-[rgba(10,36,114,0.1)] text-[#0A2472]',
    accent: 'bg-[rgba(251,191,36,0.18)] text-[#FBBF24]',
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
