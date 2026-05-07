import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, Users, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth as useClerkAuth } from '@clerk/react';
import { eventApi } from '../api';
import type { CreateEventInput } from '../types';

export default function CreateEventPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { getToken } = useClerkAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    start_datetime: '',
    end_datetime: '',
    capacity: '',
    registration_mode: 'open',
  });

  useEffect(() => {
    const templateData: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      if (key in formData) {
        templateData[key] = value;
      }
    });

    if (Object.keys(templateData).length > 0) {
      setFormData(prev => ({
        ...prev,
        ...templateData
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated. Please sign in again.');

      // Build a properly-typed payload
      const payload: CreateEventInput = {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        // datetime-local gives "YYYY-MM-DDTHH:MM"; append seconds for ISO 8601
        start_datetime: formData.start_datetime.length === 16
          ? formData.start_datetime + ':00'
          : formData.start_datetime,
        end_datetime: formData.end_datetime.length === 16
          ? formData.end_datetime + ':00'
          : formData.end_datetime,
        capacity: Number(formData.capacity),
        registration_mode: formData.registration_mode as 'open' | 'shortlist',
      };

      await eventApi.create(payload, token);
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Failed to create event:', err);
      setError(err?.message || 'Failed to create event. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-8 py-6 flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-900 cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-light text-gray-900">Create Event</h1>
            <p className="text-gray-500 text-sm mt-1 font-light">Set up a new event and start accepting registrations</p>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-4xl mx-auto px-8 py-12">
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          onSubmit={handleSubmit}
          className="space-y-8"
        >
          {/* Error Banner */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {/* Event Title */}
          <div>
            <label className="block text-gray-900 font-light mb-3">Event Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Name your event"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#FF1313] focus:ring-1 focus:ring-[#FF1313]/20 transition-all"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-gray-900 font-light mb-3">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Tell attendees about your event"
              rows={4}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#FF1313] focus:ring-1 focus:ring-[#FF1313]/20 transition-all resize-none"
              required
            />
          </div>

          {/* Location */}
          <div>
            <label className="flex items-center gap-2 text-gray-900 font-light mb-3">
              <MapPin className="w-4 h-4 text-gray-400" />
              Location
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="City, venue, or online"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#FF1313] focus:ring-1 focus:ring-[#FF1313]/20 transition-all"
              required
            />
          </div>

          {/* Date and Time Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center gap-2 text-gray-900 font-light mb-3">
                <Calendar className="w-4 h-4 text-gray-400" />
                Start Date &amp; Time
              </label>
              <input
                type="datetime-local"
                name="start_datetime"
                value={formData.start_datetime}
                onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-[#FF1313] focus:ring-1 focus:ring-[#FF1313]/20 transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-gray-900 font-light mb-3">End Date &amp; Time</label>
              <input
                type="datetime-local"
                name="end_datetime"
                value={formData.end_datetime}
                onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-[#FF1313] focus:ring-1 focus:ring-[#FF1313]/20 transition-all"
                required
              />
            </div>
          </div>

          {/* Capacity and Registration Mode */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center gap-2 text-gray-900 font-light mb-3">
                <Users className="w-4 h-4 text-gray-400" />
                Capacity
              </label>
              <input
                type="number"
                name="capacity"
                value={formData.capacity}
                onChange={handleChange}
                placeholder="Max attendees"
                min="1"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#FF1313] focus:ring-1 focus:ring-[#FF1313]/20 transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-gray-900 font-light mb-3">Registration Mode</label>
              <select
                name="registration_mode"
                value={formData.registration_mode}
                onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-[#FF1313] focus:ring-1 focus:ring-[#FF1313]/20 transition-all"
              >
                <option value="open">Open (Auto-approved)</option>
                <option value="shortlist">Shortlist (Manual approval)</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-8 border-t border-gray-100">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="flex-1 px-6 py-3 rounded-xl border border-gray-200 text-gray-900 hover:bg-gray-50 transition-all font-light cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-3 rounded-xl bg-[#FF1313] hover:bg-[#E61111] text-white font-light transition-all duration-200 hover:shadow-lg hover:shadow-red-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Event'
              )}
            </button>
          </div>
        </motion.form>
      </div>
    </div>
  );
}
