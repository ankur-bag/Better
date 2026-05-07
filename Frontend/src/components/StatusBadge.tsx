interface StatusBadgeProps {
  status: 'Open' | 'Full' | 'Closed' | 'Cancelled' | string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  let bgColor = 'bg-[var(--color-muted)]';
  
  if (status === 'Open') bgColor = 'bg-green-600';
  if (status === 'Full') bgColor = 'bg-orange-600';
  if (status === 'Closed') bgColor = 'bg-gray-600';
  if (status === 'Cancelled') bgColor = 'bg-red-600';

  return (
    <span className={`px-2 py-1 rounded text-xs text-white font-bold ${bgColor}`}>
      {status}
    </span>
  );
}
