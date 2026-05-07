import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';

interface EventCardProps {
  id: string;
  title: string;
  date: string;
  status: 'Open' | 'Full' | 'Closed' | 'Cancelled';
}

export default function EventCard({ id, title, date, status }: EventCardProps) {
  return (
    <div className="border border-[var(--color-muted)] p-6 rounded bg-[var(--color-bg)] hover:border-[var(--color-primary)] transition-colors">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-semibold text-[var(--color-surface)]">{title}</h3>
        <StatusBadge status={status} />
      </div>
      <p className="text-[var(--color-muted)] mb-4">{new Date(date).toLocaleDateString()}</p>
      <Link to={`/events/${id}`} className="text-[var(--color-primary)] hover:underline">
        View Details
      </Link>
    </div>
  );
}
