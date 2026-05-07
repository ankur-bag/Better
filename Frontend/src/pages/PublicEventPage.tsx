import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, MapPin, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { eventApi, registrationApi } from '../api';
import type { Event } from '../types';

export default function PublicEventPage() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    attendee_name: '',
    attendee_email: '',
  });

  useEffect(() => {
    async function fetchEvent() {
      if (!id) return;
      try {
        const data = await eventApi.getById(id);
        setEvent(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Event not found');
      } finally {
        setLoading(false);
      }
    }
    fetchEvent();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !event) return;
    
    setSubmitting(true);
    setError(null);
    try {
      await registrationApi.registerPublic(id, formData);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-12 h-12 border-2 border-gray-100 border-t-[#FF1313] rounded-full animate-spin" />
    </div>
  );

  if (!event || error === 'Event not found') return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center">
      <AlertCircle className="w-16 h-16 text-gray-200 mb-4" />
      <h1 className="text-3xl font-medium text-gray-900 mb-2">Event Not Found</h1>
      <p className="text-gray-500 mb-8 max-w-md">The event you are looking for doesn't exist or has been removed.</p>
      <Link to="/" className="text-[#FF1313] hover:underline font-medium">Back to Home</Link>
    </div>
  );

  const isClosed = event.public_status !== 'Open';
  const progress = event.capacity > 0 ? (event.active_count || 0) / event.capacity * 100 : 0;

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <div className="border-b border-gray-100 sticky top-0 bg-white/80 backdrop-blur-md z-10">
        <div className="max-w-6xl mx-auto px-8 py-4 flex items-center justify-between">
          <Link to="/" className="text-gray-900 font-medium flex items-center gap-2 hover:text-[#FF1313] transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" />
            Back to events
          </Link>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-medium text-gray-500 uppercase tracking-widest">Live Registration</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-16 grid grid-cols-1 lg:grid-cols-3 gap-16">
        {/* Left: Info */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="mb-8">
              <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-medium uppercase tracking-wider mb-4 border ${
                event.public_status === 'Open' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-gray-100 text-gray-400 border-gray-200'
              }`}>
                {event.public_status}
              </span>
              <h1 className="text-5xl font-medium text-gray-900 tracking-tight leading-tight mb-6">
                {event.title}
              </h1>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-12 border-t border-gray-100 pt-10">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#FEF5F8] flex items-center justify-center shrink-0">
                  <Calendar className="w-6 h-6 text-[#FF1313]" />
                </div>
                <div>
                  <p className="text-xs text-[#83868F] uppercase tracking-wider mb-1 font-medium">Date & Time</p>
                  <p className="text-gray-900 font-normal">
                    {new Date(event.start_datetime).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                  </p>
                  <p className="text-gray-500 font-normal text-sm">
                    {new Date(event.start_datetime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#FEF5F8] flex items-center justify-center shrink-0">
                  <MapPin className="w-6 h-6 text-[#FF1313]" />
                </div>
                <div>
                  <p className="text-xs text-[#83868F] uppercase tracking-wider mb-1 font-medium">Location</p>
                  <p className="text-gray-900 font-normal">{event.location}</p>
                </div>
              </div>
            </div>

            <div className="prose prose-gray max-w-none">
              <h3 className="text-xl font-medium text-gray-900 mb-4">About this event</h3>
              <p className="text-gray-600 leading-relaxed font-normal whitespace-pre-wrap">
                {event.description || "No description provided."}
              </p>
            </div>
          </motion.div>
        </div>

        {/* Right: Card */}
        <div className="lg:col-span-1">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="sticky top-24 bg-white border border-gray-100 rounded-3xl p-8 shadow-2xl shadow-gray-100"
          >
            {success ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-2xl font-medium text-gray-900 mb-3">You're on the list!</h3>
                <p className="text-gray-500 font-normal mb-8 leading-relaxed">
                  {event.registration_mode === 'open' 
                    ? "Confirmation has been sent to your email. See you there!"
                    : "Your application is being reviewed. We'll notify you soon."}
                </p>
              </motion.div>
            ) : (
              <>
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-medium text-[#83868F] uppercase tracking-wider">Capacity</p>
                    <p className="text-sm font-medium text-gray-900">
                      {event.active_count} / {event.capacity}
                    </p>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden border border-gray-50">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      className="h-full bg-[#FF1313]" 
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-2 font-normal">
                    {event.remaining_spots} spots remaining
                  </p>
                </div>

                {isClosed && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100 flex gap-3">
                    <AlertCircle className="w-5 h-5 text-gray-400 shrink-0" />
                    <p className="text-sm text-gray-500 font-normal leading-snug">
                      Registration is currently {event.public_status?.toLowerCase()}.
                    </p>
                  </div>
                )}

                {error && (
                  <div className="mb-6 p-4 bg-red-50 rounded-xl border border-red-100 flex gap-3">
                    <AlertCircle className="w-5 h-5 text-[#FF1313] shrink-0" />
                    <p className="text-sm text-[#FF1313] font-normal leading-snug">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-[#83868F] uppercase tracking-widest pl-1">Full Name</label>
                    <input
                      type="text"
                      required
                      disabled={isClosed || submitting}
                      value={formData.attendee_name}
                      onChange={(e) => setFormData(p => ({ ...p, attendee_name: e.target.value }))}
                      placeholder="Jane Doe"
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3.5 text-gray-900 placeholder-gray-400 focus:bg-white focus:ring-1 focus:ring-[#FF1313]/20 focus:border-[#FF1313] transition-all outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-[#83868F] uppercase tracking-widest pl-1">Email Address</label>
                    <input
                      type="email"
                      required
                      disabled={isClosed || submitting}
                      value={formData.attendee_email}
                      onChange={(e) => setFormData(p => ({ ...p, attendee_email: e.target.value }))}
                      placeholder="jane@example.com"
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3.5 text-gray-900 placeholder-gray-400 focus:bg-white focus:ring-1 focus:ring-[#FF1313]/20 focus:border-[#FF1313] transition-all outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isClosed || submitting}
                    className="w-full bg-[#FF1313] hover:bg-[#E61111] disabled:bg-gray-200 disabled:text-gray-400 text-white py-4 rounded-2xl font-medium transition-all duration-300 shadow-xl shadow-red-100 mt-4"
                  >
                    {submitting ? "Processing..." : isClosed ? "Registration Closed" : "Reserve My Spot"}
                  </button>
                </form>

                <p className="text-[11px] text-gray-400 text-center mt-6 font-normal">
                  By registering, you agree to receive event updates via email.
                </p>
              </>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
