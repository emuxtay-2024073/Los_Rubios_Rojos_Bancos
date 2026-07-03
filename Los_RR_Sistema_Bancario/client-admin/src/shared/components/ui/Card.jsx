import React from 'react';

export const Card = ({ 
  children, 
  className = '', 
  hover = true,
  ...props 
}) => {
  const baseStyles = 'bg-white border border-[rgba(214,169,74,0.24)] rounded-2xl p-6 shadow-[0_10px_28px_rgba(74,0,17,0.06)]';
  const hoverStyles = hover ? 'hover:-translate-y-1 hover:border-[rgba(10,36,114,0.28)] hover:shadow-[0_16px_42px_rgba(10,36,114,0.12)] transition-all duration-250' : '';
  
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
  <h3 className={`text-xl font-bold text-[#2B1117] ${className}`}>
    {children}
  </h3>
);

export const CardDescription = ({ children, className = '' }) => (
  <p className={`text-sm text-[#6B7280] mt-1 ${className}`}>
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
