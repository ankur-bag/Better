import { useUser } from '@clerk/react';
import { Plus, Calendar, Users, ArrowRight, Copy, Trash2, MapPin, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useEffect, useState, useCallback } from 'react';
import { useEvents } from '../hooks/useEvents';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { Toast } from '../components/Toast';
import { eventApi } from '../api';
import { useAuth } from '@clerk/react';

export default function DashboardPage() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const { getStats, getOrganizerEvents } = useEvents();
  
  const [dashboardStats, setDashboardStats] = useState({ total_events: 0 });
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  
  // Modals
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; eventId: string | null }>({ isOpen: false, eventId: null });
  const [cancelModal, setCancelModal] = useState<{ isOpen: boolean; eventId: string | null }>({ isOpen: false, eventId: null });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [statsData, eventsData] = await Promise.all([
      getStats(),
      getOrganizerEvents()
    ]);
    setDashboardStats(statsData);
    setEvents(eventsData);
    setLoading(false);
  }, [getStats, getOrganizerEvents]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCopyLink = (eventId: string) => {
    const url = `${window.location.origin}/events/${eventId}`;
    navigator.clipboard.writeText(url);
    setToast('Link copied to clipboard!');
  };

  const handleDeleteEvent = async () => {
    if (!deleteModal.eventId) return;
    setActionLoading(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');
      await eventApi.delete(deleteModal.eventId, token);
      setEvents(prev => prev.filter(e => e.id !== deleteModal.eventId));
      setDeleteModal({ isOpen: false, eventId: null });
      setToast('Event deleted successfully');
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Failed to delete event');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelEvent = async () => {
    if (!cancelModal.eventId) return;
    setActionLoading(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');
      const updated = await eventApi.cancel(cancelModal.eventId, token);
      setEvents(prev => prev.map(e => e.id === cancelModal.eventId ? updated : e));
      setCancelModal({ isOpen: false, eventId: null });
      setToast('Event cancelled and attendees notified');
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Failed to cancel event');
    } finally {
      setActionLoading(false);
    }
  };

  const activeEvents = events.filter(e => e.status !== 'cancelled');
  const cancelledEvents = events.filter(e => e.status === 'cancelled');

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl font-light text-gray-900 mb-2">Welcome back, {user?.firstName || 'there'}</h1>
            <p className="text-gray-500 font-light">Manage your events and track registrations</p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-12">
        {/* Stat & CTA Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="bg-white border border-gray-100 rounded-xl p-5 min-w-[200px]">
            <p className="text-xs text-[#83868F] uppercase tracking-wider mb-1 font-medium">Total Events</p>
            <p className="text-3xl font-light tracking-tight text-[#020605]">{dashboardStats.total_events}</p>
          </div>

          <button
            onClick={() => navigate('/dashboard/events/templates')}
            className="flex items-center gap-2 px-6 py-3.5 bg-[#FF1313] text-white rounded-xl hover:bg-[#E61111] transition-all duration-200 font-medium"
          >
            <Plus className="w-5 h-5" />
            Create New Event
          </button>
        </div>

        {/* Your Events */}
        <section className="mb-16">
          <h2 className="text-2xl font-medium text-gray-900 mb-8">Your Events</h2>
          
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(n => (
                <div key={n} className="h-56 bg-gray-50 animate-pulse rounded-2xl border border-gray-100" />
              ))}
            </div>
          ) : activeEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeEvents.map((event) => (
                <EventCard 
                  key={event.id}
                  event={event}
                  onCopy={() => handleCopyLink(event.id)}
                  onDelete={() => setDeleteModal({ isOpen: true, eventId: event.id })}
                  onCancel={() => setCancelModal({ isOpen: true, eventId: event.id })}
                  onClick={() => navigate(`/dashboard/events/${event.id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-[#FEF5F8] rounded-2xl border border-red-50 p-12 text-center">
              <Calendar className="w-10 h-10 text-red-200 mx-auto mb-4" />
              <p className="text-gray-500 font-light mb-6">No active events found.</p>
              <button
                onClick={() => navigate('/dashboard/events/templates')}
                className="text-[#FF1313] hover:underline font-medium inline-flex items-center gap-1"
              >
                Create your first event <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </section>

        {/* Cancelled Events */}
        {cancelledEvents.length > 0 && (
          <section>
            <h2 className="text-2xl font-medium text-gray-400 mb-8">Cancelled Events</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-60 grayscale">
              {cancelledEvents.map((event) => (
                <EventCard 
                  key={event.id}
                  event={event}
                  onCopy={() => handleCopyLink(event.id)}
                  onDelete={() => setDeleteModal({ isOpen: true, eventId: event.id })}
                  onClick={() => navigate(`/dashboard/events/${event.id}`)}
                  isCancelled
                />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Modals */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, eventId: null })}
        title="Delete Event?"
        confirmLabel="Delete"
        onConfirm={handleDeleteEvent}
        confirmLoading={actionLoading}
        type="danger"
      >
        This action cannot be undone. All registrations for this event will be permanently deleted.
      </Modal>

      <Modal
        isOpen={cancelModal.isOpen}
        onClose={() => setCancelModal({ isOpen: false, eventId: null })}
        title="Cancel Event?"
        confirmLabel="Cancel Event"
        onConfirm={handleCancelEvent}
        confirmLoading={actionLoading}
        type="danger"
      >
        Are you sure you want to cancel this event? This will notify all registered attendees by email.
      </Modal>

      <Toast message={toast} onClose={() => setToast(null)} />
    </div>
  );
}

function EventCard({ event, onCopy, onDelete, onCancel, onClick, isCancelled }: any) {
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="group bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 flex flex-col h-full"
    >
      <div className="flex-1 cursor-pointer" onClick={onClick}>
        <div className="flex items-center justify-between mb-4">
          <Badge status={event.status} />
          {event.status !== 'cancelled' && (
            <span className="bg-green-50 text-green-600 px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-tight">
              {event.confirmed_count || 0} approved
            </span>
          )}
        </div>
        
        <h3 className="text-xl font-medium text-gray-900 mb-4 group-hover:text-[#FF1313] transition-colors line-clamp-2">
          {event.title}
        </h3>

        <div className="space-y-2 mb-6">
          <div className="flex items-center gap-2 text-[#83868F] text-sm font-normal">
            <Clock className="w-4 h-4" />
            {new Date(event.start_datetime).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
          <div className="flex items-center gap-2 text-[#83868F] text-sm font-normal">
            <MapPin className="w-4 h-4" />
            <span className="line-clamp-1">{event.location}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-50">
        <div className="flex gap-1">
        <button 
          onClick={(e) => { e.stopPropagation(); onCopy(); }}
          className="flex items-center gap-2 px-3 py-1.5 hover:bg-[#FEF5F8] text-[#83868F] hover:text-[#FF1313] rounded-lg transition-all text-xs font-medium"
        >
          <Copy className="w-3.5 h-3.5" />
          Copy link
        </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-2 hover:bg-red-50 text-gray-400 hover:text-[#FF1313] rounded-lg transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {!isCancelled && (
          <button 
            onClick={(e) => { e.stopPropagation(); onCancel(); }}
            className="text-xs font-medium text-[#83868F] hover:text-[#FF1313] transition-colors uppercase tracking-wider"
          >
            Cancel Event
          </button>
        )}
      </div>
    </motion.div>
  );
}
