import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, Users, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import { eventApi } from '../api';
import { useAuth } from '@clerk/react';
import { Toast } from '../components/Toast';

export default function EditEventPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { getToken } = useAuth();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    start_datetime: '',
    end_datetime: '',
    capacity: 0,
    registration_mode: 'open' as 'open' | 'shortlist',
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEvent() {
      if (!id) return;
      try {
        const token = await getToken();
        if (!token) return;
        const event = await eventApi.getById(id, token);
        
        // Format dates for datetime-local input
        const start = new Date(event.start_datetime).toISOString().slice(0, 16);
        const end = new Date(event.end_datetime).toISOString().slice(0, 16);
        
        setFormData({
          title: event.title,
          description: event.description || '',
          location: event.location,
          start_datetime: start,
          end_datetime: end,
          capacity: event.capacity,
          registration_mode: event.registration_mode,
        });
      } catch (err) {
        setToast('Failed to load event details');
      } finally {
        setLoading(false);
      }
    }
    fetchEvent();
  }, [id, getToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    
    setSaving(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');
      
      await eventApi.update(id, formData, token);
      setToast('Event updated successfully');
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Failed to update event');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-gray-100 border-t-[#FF1313] rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-8 py-6 flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-medium text-gray-900">Edit Event</h1>
            <p className="text-gray-500 font-normal mt-1">Refine your event details and settings</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-12">
        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="space-y-10"
        >
          {/* Section 1: Core Details */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-[#FF1313] mb-2">
              <Info className="w-4 h-4" />
              <span className="text-[11px] font-medium uppercase tracking-widest">Basic Information</span>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Event Title</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:bg-white focus:ring-1 focus:ring-[#FF1313]/20 focus:border-[#FF1313] transition-all outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Description</label>
              <textarea
                required
                rows={5}
                value={formData.description}
                onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:bg-white focus:ring-1 focus:ring-[#FF1313]/20 focus:border-[#FF1313] transition-all outline-none resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Location</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData(p => ({ ...p, location: e.target.value }))}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-12 pr-4 py-3 text-gray-900 placeholder-gray-400 focus:bg-white focus:ring-1 focus:ring-[#FF1313]/20 focus:border-[#FF1313] transition-all outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Logistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-gray-100">
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-[#FF1313] mb-2">
                <Calendar className="w-4 h-4" />
                <span className="text-[11px] font-medium uppercase tracking-widest">Timing</span>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Starts At</label>
                <input
                  type="datetime-local"
                  required
                  value={formData.start_datetime}
                  onChange={(e) => setFormData(p => ({ ...p, start_datetime: e.target.value }))}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-gray-900 focus:bg-white focus:ring-1 focus:ring-[#FF1313]/20 focus:border-[#FF1313] transition-all outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Ends At</label>
                <input
                  type="datetime-local"
                  required
                  value={formData.end_datetime}
                  onChange={(e) => setFormData(p => ({ ...p, end_datetime: e.target.value }))}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-gray-900 focus:bg-white focus:ring-1 focus:ring-[#FF1313]/20 focus:border-[#FF1313] transition-all outline-none"
                />
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-2 text-[#FF1313] mb-2">
                <Users className="w-4 h-4" />
                <span className="text-[11px] font-medium uppercase tracking-widest">Access</span>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Total Capacity</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={formData.capacity}
                  onChange={(e) => setFormData(p => ({ ...p, capacity: parseInt(e.target.value) }))}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-gray-900 focus:bg-white focus:ring-1 focus:ring-[#FF1313]/20 focus:border-[#FF1313] transition-all outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Registration Mode</label>
                <select
                  value={formData.registration_mode}
                  onChange={(e) => setFormData(p => ({ ...p, registration_mode: e.target.value as any }))}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-gray-900 focus:bg-white focus:ring-1 focus:ring-[#FF1313]/20 focus:border-[#FF1313] transition-all outline-none"
                >
                  <option value="open">Open (First come, first served)</option>
                  <option value="shortlist">Shortlist (Manual selection)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 pt-10 border-t border-gray-100">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-8 py-3.5 rounded-xl text-gray-600 hover:bg-gray-50 transition-all font-medium text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-black text-white py-3.5 rounded-xl font-medium text-sm hover:bg-gray-800 transition-all disabled:opacity-50 shadow-xl shadow-gray-100"
            >
              {saving ? 'Saving Changes...' : 'Save and Update Event'}
            </button>
          </div>
        </motion.form>
      </div>

      <Toast message={toast} onClose={() => setToast(null)} />
    </div>
  );
}
