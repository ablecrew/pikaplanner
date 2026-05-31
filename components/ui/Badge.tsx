'use client'

import React from 'react';
interface BadgeProps {
  status: string;
  className?: string;
}
const statusStyles: Record<string, string> = {
  Active: 'bg-emerald-50 text-emerald-700',
  Available: 'bg-emerald-50 text-emerald-700',
  Completed: 'bg-emerald-50 text-emerald-700',
  Successful: 'bg-emerald-50 text-emerald-700',
  Inactive: 'bg-gray-100 text-gray-600',
  Pending: 'bg-amber-50 text-amber-700',
  Processing: 'bg-blue-50 text-blue-700',
  Suspended: 'bg-red-50 text-red-700',
  Archived: 'bg-gray-100 text-gray-500',
  Unavailable: 'bg-orange-50 text-orange-700',
  Cancelled: 'bg-red-50 text-red-700',
  Failed: 'bg-red-50 text-red-700',
  Refunded: 'bg-purple-50 text-purple-700',
};
export const Badge: React.FC<BadgeProps> = ({ status, className = '' }) => {
  const style = statusStyles[status] || 'bg-gray-100 text-gray-600';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style} ${className}`}>
      {status}
    </span>
  );
};
