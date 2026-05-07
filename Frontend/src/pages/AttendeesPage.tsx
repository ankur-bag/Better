import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Search, Mail, User as UserIcon, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { registrationApi, eventApi } from '../api';
import { useAuth } from '@clerk/react';
import { Badge } from '../components/Badge';
import { Toast } from '../components/Toast';
import type { Registration, RegistrationStatus } from '../types';

export default function AttendeesPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [eventTitle, setEventTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Action state
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEventInfo() {
      if (!id) return;
      try {
        const token = await getToken();
        const event = await eventApi.getById(id, token || undefined);
        setEventTitle(event.title);
      } catch (err) {
        console.error('Failed to fetch event info:', err);
        setEventTitle('Event Details');
      }
    }
    fetchEventInfo();
  }, [id, getToken]);

  const fetchRegistrations = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) {
        setError('Authentication required');
        return;
      }
      
      const regs = await registrationApi.listEventRegistrations(id, { 
        search: searchTerm || undefined 
      }, token);
      
      setRegistrations(regs);
    } catch (err) {
      console.error('Failed to fetch registrations:', err);
      setError('Failed to load attendees list');
      setToast('Could not load attendees');
    } finally {
      setLoading(false);
    }
  }, [id, searchTerm, getToken]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchRegistrations();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [fetchRegistrations]);

  const handleUpdateStatus = async (regId: string, action: RegistrationStatus) => {
    setProcessingId(regId);
    try {
      const token = await getToken();
      if (!token) throw new Error('Auth failed');
      
      await registrationApi.updateStatus(regId, action, token);
      setToast(`Attendee ${action} successfully`);
      fetchRegistrations();
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <div className="border-b border-gray-100 sticky top-0 bg-white/80 backdrop-blur-md z-10">
        <div className="max-w-6xl mx-auto px-8 py-6">
          <div className="flex items-center gap-4 mb-2">
            <button
              onClick={() => navigate(`/dashboard/events/${id}`)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-3xl font-medium text-gray-900 truncate max-w-xl">
              {eventTitle || 'Loading...'}
            </h1>
          </div>
          <p className="text-gray-500 font-normal pl-14">Guest list & registration management</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-10">
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-[#FF1313]">
            <AlertCircle className="w-5 h-5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Search */}
        <div className="relative mb-10">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-xl pl-12 pr-4 py-3 text-gray-900 placeholder-gray-400 focus:ring-1 focus:ring-[#FF1313]/20 focus:border-[#FF1313] transition-all outline-none"
          />
        </div>

        {/* List */}
        {loading && registrations.length === 0 ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-50 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : registrations.length > 0 ? (
          <div className="grid gap-4">
            <AnimatePresence mode="popLayout">
              {registrations.map((reg) => (
                <motion.div
                  key={reg.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white border border-gray-100 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-400">
                      <UserIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{reg.attendee_name}</h3>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-1">
                        <div className="flex items-center gap-1.5 text-sm text-[#83868F]">
                          <Mail className="w-3.5 h-3.5" />
                          {reg.attendee_email}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <Badge status={reg.status} />
                    
                    <div className="flex items-center gap-3 border-l border-gray-100 pl-6">
                      {processingId === reg.id ? (
                        <Loader2 className="w-5 h-5 text-gray-400 animate-spin mx-8" />
                      ) : reg.status === 'pending' ? (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(reg.id, 'approved')}
                            className="px-6 py-2 bg-green-50 text-green-600 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(reg.id, 'rejected')}
                            className="px-6 py-2 bg-red-50 text-[#FF1313] rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
                          >
                            Reject
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleUpdateStatus(
                            reg.id, 
                            (reg.status === 'approved' || reg.status === 'registered') ? 'rejected' : 'approved'
                          )}
                          className={`px-8 py-2 rounded-lg text-sm font-medium transition-colors ${
                            (reg.status === 'approved' || reg.status === 'registered')
                              ? 'bg-red-50 text-[#FF1313] hover:bg-red-100'
                              : 'bg-green-50 text-green-600 hover:bg-green-100'
                          }`}
                        >
                          {(reg.status === 'approved' || reg.status === 'registered') ? 'Revoke' : 'Approve'}
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="bg-[#FEF5F8] rounded-2xl border border-red-50 p-20 text-center">
            <Search className="w-12 h-12 text-red-200 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No attendees found</h3>
            <p className="text-gray-500 font-normal">Try adjusting your search</p>
          </div>
        )}
      </div>

      <Toast message={toast} onClose={() => setToast(null)} />
    </div>
  );
}
