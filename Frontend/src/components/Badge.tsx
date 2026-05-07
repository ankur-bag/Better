import React from 'react';

interface BadgeProps {
  status: string;
  className?: string;
}

const statusStyles: Record<string, string> = {
  pending:   'bg-yellow-50 text-yellow-600 border-yellow-100',
  approved:  'bg-green-50 text-green-600 border-green-100',
  registered: 'bg-green-50 text-green-600 border-green-100',
  rejected:  'bg-red-50 text-[#FF1313] border-red-100',
  revoked:   'bg-gray-100 text-[#83868F] border-gray-200',
  cancelled: 'bg-gray-100 text-[#83868F] border-gray-200',
  Open:      'bg-green-50 text-green-600 border-green-100',
  Full:      'bg-orange-50 text-orange-500 border-orange-100',
  Closed:    'bg-gray-100 text-[#83868F] border-gray-200',
  published: 'bg-green-50 text-green-600 border-green-100',
  draft:     'bg-gray-50 text-[#83868F] border-gray-100',
};

export const Badge: React.FC<BadgeProps> = ({ status, className = '' }) => {
  const style = statusStyles[status] || 'bg-gray-50 text-gray-600 border-gray-100';
  
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${style} ${className}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};
