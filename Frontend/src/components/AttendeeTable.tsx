export interface Attendee {
  id: string;
  attendee_name: string;
  attendee_email: string;
  status: 'pending' | 'registered' | 'approved' | 'rejected' | 'revoked';
}

interface AttendeeTableProps {
  attendees: Attendee[];
  onUpdateStatus: (id: string, newStatus: string) => void;
}

export default function AttendeeTable({ attendees, onUpdateStatus }: AttendeeTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-[var(--color-muted)]">
            <th className="p-3 text-[var(--color-muted)] font-normal">Name</th>
            <th className="p-3 text-[var(--color-muted)] font-normal">Email</th>
            <th className="p-3 text-[var(--color-muted)] font-normal">Status</th>
            <th className="p-3 text-[var(--color-muted)] font-normal">Actions</th>
          </tr>
        </thead>
        <tbody>
          {attendees.map(attendee => (
            <tr key={attendee.id} className="border-b border-[var(--color-muted)]/30 hover:bg-white/5 transition-colors">
              <td className="p-3">{attendee.attendee_name}</td>
              <td className="p-3 text-[var(--color-muted)]">{attendee.attendee_email}</td>
              <td className="p-3">
                <span className="capitalize">{attendee.status}</span>
              </td>
              <td className="p-3 space-x-2">
                {attendee.status === 'pending' && (
                  <>
                    <button onClick={() => onUpdateStatus(attendee.id, 'approved')} className="text-green-500 hover:underline">Approve</button>
                    <button onClick={() => onUpdateStatus(attendee.id, 'rejected')} className="text-red-500 hover:underline">Reject</button>
                  </>
                )}
                {(attendee.status === 'registered' || attendee.status === 'approved') && (
                  <button onClick={() => onUpdateStatus(attendee.id, 'revoked')} className="text-orange-500 hover:underline">Revoke</button>
                )}
              </td>
            </tr>
          ))}
          {attendees.length === 0 && (
            <tr>
              <td colSpan={4} className="p-6 text-center text-[var(--color-muted)]">No attendees found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
