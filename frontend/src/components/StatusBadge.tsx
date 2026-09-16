import React from 'react';
import { BookingStatus } from '../types';

interface StatusBadgeProps {
  status: BookingStatus;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const getStyle = () => {
    switch (status) {
      case 'BOOKED':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'ACCEPTED':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'PREPARING':
        return 'bg-purple-50 text-purple-700 border-purple-200 animate-pulse';
      case 'READY':
        return 'bg-emerald-50 text-emerald-700 border-emerald-300 font-bold';
      case 'COLLECTED':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'REJECTED':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'CANCELLED':
        return 'bg-gray-50 text-gray-500 border-gray-200';
      case 'EXPIRED':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getLabel = () => {
    switch (status) {
      case 'BOOKED':
        return 'Booked';
      case 'ACCEPTED':
        return 'Accepted';
      case 'PREPARING':
        return 'Preparing Now';
      case 'READY':
        return 'Ready for Pickup';
      case 'COLLECTED':
        return 'Collected';
      case 'REJECTED':
        return 'Declined';
      case 'CANCELLED':
        return 'Cancelled';
      case 'EXPIRED':
        return 'Expired';
      default:
        return status;
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getStyle()} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current" />
      {getLabel()}
    </span>
  );
};
