import React from 'react';
import { Card, CardContent } from './Card.jsx';

export const StatCard = ({ 
  title, 
  value, 
  change, 
  changeType = 'positive',
  icon: Icon,
  className = '',
}) => {
  return (
    <Card hover className={className}>
      <CardContent>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-[#64748B]">
              {title}
            </p>
            <p className="text-3xl font-bold text-[#1E293B] mt-2">
              {value}
            </p>
            {change && (
              <div className={`flex items-center gap-1 mt-2 text-sm font-semibold ${
                changeType === 'positive' ? 'text-[#10B981]' : 'text-[#EF4444]'
              }`}>
                <span>{changeType === 'positive' ? '↑' : '↓'}</span>
                <span>{change}</span>
              </div>
            )}
          </div>
          {Icon && (
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(37,99,235,0.1)]">
              <Icon className="h-7 w-7 text-[#2563EB]" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
