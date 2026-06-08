import React from 'react';

export const Card = ({ 
  children, 
  className = '', 
  hover = true,
  ...props 
}) => {
  const baseStyles = 'bg-white border border-[rgba(226,232,240,0.8)] rounded-2xl p-6 shadow-[0_4px_20px_rgba(15,23,42,0.05)]';
  const hoverStyles = hover ? 'hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(15,23,42,0.1)] transition-all duration-250' : '';
  
  return (
    <div 
      className={`${baseStyles} ${hoverStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '' }) => (
  <div className={`mb-4 ${className}`}>
    {children}
  </div>
);

export const CardTitle = ({ children, className = '' }) => (
  <h3 className={`text-xl font-bold text-[#1E293B] ${className}`}>
    {children}
  </h3>
);

export const CardDescription = ({ children, className = '' }) => (
  <p className={`text-sm text-[#64748B] mt-1 ${className}`}>
    {children}
  </p>
);

export const CardContent = ({ children, className = '' }) => (
  <div className={className}>
    {children}
  </div>
);

export const CardFooter = ({ children, className = '' }) => (
  <div className={`mt-4 pt-4 border-t border-[rgba(226,232,240,0.6)] ${className}`}>
    {children}
  </div>
);
