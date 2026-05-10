import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, Users, Loader2, Sparkles, Clock, CalendarDays } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth as useClerkAuth } from '@clerk/react';
import { eventApi, aiApi } from '../api';
import type { CreateEventInput } from '../types';

export default function CreateEventPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { getToken } = useClerkAuth();
  const [submitting, setSubmitting] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [showAiOptions, setShowAiOptions] = useState(false);
  const [originalDescription, setOriginalDescription] = useState('');
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

  const handleEnhanceDescription = async () => {
    if (!formData.description.trim()) {
      setError('Please write a basic description first to enhance it.');
      return;
    }
    
    setOriginalDescription(formData.description);
    setEnhancing(true);
    setShowAiOptions(false);
    setError('');
    
    try {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated.');
      
      const res = await aiApi.enhanceDescription(formData.description, formData.title, token);
      setFormData(prev => ({
        ...prev,
        description: res.enhanced_description
      }));
      setShowAiOptions(true);
    } catch (err: any) {
      console.error('Failed to enhance description:', err);
      setError(err?.message || 'Failed to enhance description. AI might be unavailable.');
    } finally {
      setEnhancing(false);
    }
  };

  const handleAcceptAi = () => {
    setShowAiOptions(false);
  };

  const handleDiscardAi = () => {
    setFormData(prev => ({
      ...prev,
      description: originalDescription
    }));
    setShowAiOptions(false);
  };

  const setQuickDate = (type: 'today' | 'tomorrow' | 'weekend') => {
    const now = new Date();
    let start = new Date(now);
    let end = new Date(now);
    
    if (type === 'today') {
      start.setHours(18, 0, 0, 0);
      end.setHours(20, 0, 0, 0);
    } else if (type === 'tomorrow') {
      start.setDate(start.getDate() + 1);
      start.setHours(18, 0, 0, 0);
      end.setDate(end.getDate() + 1);
      end.setHours(20, 0, 0, 0);
    } else if (type === 'weekend') {
      // Find next Saturday
      const daysUntilSaturday = (6 - start.getDay() + 7) % 7 || 7;
      start.setDate(start.getDate() + daysUntilSaturday);
      start.setHours(10, 0, 0, 0);
      end.setDate(end.getDate() + daysUntilSaturday);
      end.setHours(14, 0, 0, 0);
    }

    // Format to YYYY-MM-DDTHH:mm
    const formatDateTime = (d: Date) => {
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    setFormData(prev => ({
      ...prev,
      start_datetime: formatDateTime(start),
      end_datetime: formatDateTime(end)
    }));
  };

  const handleDateTimeChange = (field: 'start' | 'end', type: 'date' | 'time', value: string) => {
    setFormData(prev => {
      const current = prev[`${field}_datetime` as keyof typeof prev] as string;
      const [cDate, cTime] = current ? current.split('T') : ['', ''];
      
      let newDate = type === 'date' ? value : cDate;
      let newTime = type === 'time' ? value : cTime;
      
      if (newDate && !newTime) newTime = '12:00';
      if (!newDate && newTime) newDate = new Date().toISOString().split('T')[0];
      
      return {
        ...prev,
        [`${field}_datetime`]: (newDate || newTime) ? `${newDate || ''}T${newTime || ''}` : ''
      };
    });
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
            <div className="flex items-center justify-between mb-3">
              <label className="block text-gray-900 font-light">Description</label>
              <button
                type="button"
                onClick={handleEnhanceDescription}
                disabled={enhancing || !formData.description.trim()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {enhancing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                {enhancing ? 'Enhancing...' : 'Magic Enhance'}
              </button>
            </div>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Tell attendees about your event. Write a draft and click Magic Enhance to let AI perfect it!"
              rows={4}
              className={`w-full bg-gray-50 border rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 transition-all resize-none ${
                enhancing ? 'border-purple-300 ring-purple-300 bg-purple-50/30' : 
                showAiOptions ? 'border-purple-400 ring-purple-400 bg-purple-50/10' :
                'border-gray-200 focus:border-[#FF1313] focus:ring-[#FF1313]/20'
              }`}
              required
              disabled={enhancing}
            />
            {showAiOptions && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 mt-3"
              >
                <button
                  type="button"
                  onClick={handleAcceptAi}
                  className="px-4 py-1.5 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                >
                  Accept
                </button>
                <button
                  type="button"
                  onClick={handleDiscardAi}
                  className="px-4 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Discard
                </button>
                <span className="text-xs text-gray-500">Enhanced by AI</span>
              </motion.div>
            )}
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
          <div className="bg-gray-50/50 border border-gray-100 rounded-2xl p-6 mb-2 mt-2 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
              <label className="flex items-center gap-2 text-gray-900 font-medium text-lg">
                <Calendar className="w-5 h-5 text-purple-500" />
                Event Schedule
              </label>
              
              {/* Quick Selects */}
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setQuickDate('today')} className="px-3 py-1.5 text-xs font-medium bg-white border border-gray-200 text-gray-700 rounded-full hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 transition-colors shadow-sm">
                  Today
                </button>
                <button type="button" onClick={() => setQuickDate('tomorrow')} className="px-3 py-1.5 text-xs font-medium bg-white border border-gray-200 text-gray-700 rounded-full hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 transition-colors shadow-sm">
                  Tomorrow
                </button>
                <button type="button" onClick={() => setQuickDate('weekend')} className="px-3 py-1.5 text-xs font-medium bg-white border border-gray-200 text-gray-700 rounded-full hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 transition-colors shadow-sm">
                  This Weekend
                </button>
              </div>
            </div>

            <div className="space-y-6">
              {/* Start Date & Time */}
              <div className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm">
                <label className="block text-gray-500 text-xs uppercase tracking-wider font-semibold mb-3">Event Starts</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <CalendarDays className="h-4 w-4 text-purple-400" />
                    </div>
                    <input
                      type="date"
                      value={formData.start_datetime ? formData.start_datetime.split('T')[0] : ''}
                      onChange={(e) => handleDateTimeChange('start', 'date', e.target.value)}
                      className="w-full bg-gray-50/50 border border-gray-200 rounded-lg pl-10 pr-4 py-2.5 text-gray-900 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400/20 transition-all"
                      required
                    />
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Clock className="h-4 w-4 text-purple-400" />
                    </div>
                    <input
                      type="time"
                      value={formData.start_datetime ? formData.start_datetime.split('T')[1] : ''}
                      onChange={(e) => handleDateTimeChange('start', 'time', e.target.value)}
                      className="w-full bg-gray-50/50 border border-gray-200 rounded-lg pl-10 pr-4 py-2.5 text-gray-900 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400/20 transition-all"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* End Date & Time */}
              <div className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm">
                <label className="block text-gray-500 text-xs uppercase tracking-wider font-semibold mb-3">Event Ends</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <CalendarDays className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="date"
                      value={formData.end_datetime ? formData.end_datetime.split('T')[0] : ''}
                      onChange={(e) => handleDateTimeChange('end', 'date', e.target.value)}
                      className="w-full bg-gray-50/50 border border-gray-200 rounded-lg pl-10 pr-4 py-2.5 text-gray-900 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400/20 transition-all"
                      required
                    />
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Clock className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="time"
                      value={formData.end_datetime ? formData.end_datetime.split('T')[1] : ''}
                      onChange={(e) => handleDateTimeChange('end', 'time', e.target.value)}
                      className="w-full bg-gray-50/50 border border-gray-200 rounded-lg pl-10 pr-4 py-2.5 text-gray-900 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400/20 transition-all"
                      required
                    />
                  </div>
                </div>
              </div>
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
