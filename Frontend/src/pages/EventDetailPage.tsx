import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Users, Edit, Settings, ExternalLink, Calendar, MapPin, Trash2, ShieldOff, Rocket } from 'lucide-react';
import { motion } from 'framer-motion';
import { eventApi } from '../api';
import { useAuth } from '@clerk/react';
import { Badge } from '../components/Badge';
import { Toast } from '../components/Toast';
import { Modal } from '../components/Modal';
import type { Event } from '../types';

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  
  const [cancelModal, setCancelModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [launchModal, setLaunchModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    async function fetchEvent() {
      if (!id) return;
      try {
        const token = await getToken();
        if (!token) return;
        const data = await eventApi.getById(id, token);
        setEvent(data);
      } catch (err) {
        setToast('Failed to load event');
      } finally {
        setLoading(false);
      }
    }
    fetchEvent();
  }, [id, getToken]);

  const handleLaunch = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');
      await eventApi.publish(id, token);
      setToast('Event launched successfully!');
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Launch failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');
      const updated = await eventApi.cancel(id, token);
      setEvent(updated);
      setToast('Event cancelled and attendees notified');
      setCancelModal(false);
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');
      await eventApi.delete(id, token);
      navigate('/dashboard');
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-gray-100 border-t-[#FF1313] rounded-full animate-spin" />
    </div>
  );

  if (!event) return null;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-8 py-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-3xl font-medium text-gray-900">{event.title}</h1>
                <Badge status={event.status} />
              </div>
              <p className="text-gray-500 font-normal">Event Dashboard & Controls</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a 
              href={`/events/${event.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-xl border border-gray-100 transition-all"
            >
              <ExternalLink className="w-4 h-4" />
              Public Page
            </a>
            <button
              onClick={() => navigate(`/dashboard/events/${event.id}/edit`)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-xl border border-gray-100 transition-all"
            >
              <Edit className="w-4 h-4" />
              Edit Event
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Controls */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">
              <h2 className="text-xl font-medium text-gray-900 mb-8">Manage Event</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => navigate(`/dashboard/events/${event.id}/attendees`)}
                  className="group p-6 bg-[#FEF5F8] border border-red-50 rounded-2xl text-left hover:shadow-lg hover:shadow-red-50 transition-all"
                >
                  <Users className="w-8 h-8 text-[#FF1313] mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1 group-hover:text-[#FF1313] transition-colors">Manage Guests</h3>
                  <p className="text-sm text-gray-500 font-normal">Approve, reject, or revoke registrations</p>
                </button>

                <button
                  onClick={() => setCancelModal(true)}
                  disabled={event.status === 'cancelled' || event.status === 'draft'}
                  className="group p-6 bg-gray-50 border border-gray-100 rounded-2xl text-left hover:bg-red-50 hover:border-red-100 transition-all disabled:opacity-50 disabled:grayscale"
                >
                  <ShieldOff className="w-8 h-8 text-gray-400 group-hover:text-[#FF1313] mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1 group-hover:text-[#FF1313] transition-colors">Cancel Event</h3>
                  <p className="text-sm text-gray-500 font-normal">Halt registrations and notify all guests</p>
                </button>

                {event.status === 'draft' && (
                  <button
                    onClick={() => setLaunchModal(true)}
                    className="group p-6 bg-[#FEF5F8] border border-[#FF1313]/20 rounded-2xl text-left hover:shadow-lg hover:shadow-red-50 transition-all"
                  >
                    <Rocket className="w-8 h-8 text-[#FF1313] mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1 group-hover:text-[#FF1313] transition-colors text-[#FF1313]">Launch Event</h3>
                    <p className="text-sm text-gray-500 font-normal">Make this event public and start accepting guests</p>
                  </button>
                )}
              </div>
            </div>

            {/* Event Info Card */}
            <div className="bg-gray-50 rounded-3xl p-8">
              <h3 className="text-lg font-medium text-gray-900 mb-6">Quick Overview</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="flex gap-3">
                  <Calendar className="w-5 h-5 text-gray-400 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-1">Schedule</p>
                    <p className="text-sm text-gray-700">{new Date(event.start_datetime).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-1">Location</p>
                    <p className="text-sm text-gray-700">{event.location}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Users className="w-5 h-5 text-gray-400 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-1">Registration</p>
                    <p className="text-sm text-gray-700">{event.registration_mode === 'open' ? 'Auto-approved' : 'Manual Shortlist'}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Settings className="w-5 h-5 text-gray-400 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-1">Status</p>
                    <p className="text-sm text-gray-700 capitalize">{event.status}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats / Dangerous Zone */}
          <div className="space-y-8">
            <div className="bg-white border border-gray-100 rounded-3xl p-8 text-center shadow-sm">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-2">Approved Guests</p>
              <p className="text-6xl font-light text-gray-900 mb-4">{event.confirmed_count || 0}</p>
              <p className="text-sm text-gray-500 font-normal">out of {event.capacity} total capacity</p>
            </div>

            <div className="bg-white border border-red-50 rounded-3xl p-8">
              <h3 className="text-sm font-medium text-[#FF1313] uppercase tracking-widest mb-4">Danger Zone</h3>
              <p className="text-xs text-gray-500 mb-6 font-normal leading-relaxed">
                Permanently delete this event and all associated data. This action is irreversible.
              </p>
              <button
                onClick={() => setDeleteModal(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-red-100 text-[#FF1313] rounded-xl hover:bg-red-50 transition-all font-medium text-sm"
              >
                <Trash2 className="w-4 h-4" />
                Delete Event
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <Modal
        isOpen={cancelModal}
        onClose={() => setCancelModal(false)}
        title="Cancel Event?"
        confirmLabel="Cancel Event"
        onConfirm={handleCancel}
        confirmLoading={actionLoading}
        type="danger"
      >
        All registered attendees will be notified by email. This action will halt all further registrations.
      </Modal>

      <Modal
        isOpen={deleteModal}
        onClose={() => setDeleteModal(false)}
        title="Permanently Delete?"
        confirmLabel="Delete Everything"
        onConfirm={handleDelete}
        confirmLoading={actionLoading}
        type="danger"
      >
        You are about to delete this event and all its registrations. This cannot be undone.
      </Modal>

      <Modal
        isOpen={launchModal}
        onClose={() => setLaunchModal(false)}
        title="Launch Event?"
        confirmLabel="Launch Now"
        onConfirm={handleLaunch}
        confirmLoading={actionLoading}
        type="success"
      >
        You are about to make this event public. It will be visible to everyone and ready for registrations.
      </Modal>

      <Toast message={toast} onClose={() => setToast(null)} />
    </div>
  );
}
