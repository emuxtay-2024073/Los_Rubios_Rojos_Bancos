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
            <p className="text-sm font-medium text-[#6B7280]">
              {title}
            </p>
            <p className="text-3xl font-bold text-[#2B1117] mt-2">
              {value}
            </p>
            {change && (
              <div className={`flex items-center gap-1 mt-2 text-sm font-semibold ${
                changeType === 'positive' ? 'text-[#10B981]' : 'text-[#1E3A8A]'
              }`}>
                <span>{changeType === 'positive' ? '↑' : '↓'}</span>
                <span>{change}</span>
              </div>
            )}
          </div>
          {Icon && (
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(10,36,114,0.1)]">
              <Icon className="h-7 w-7 text-[#0A2472]" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
