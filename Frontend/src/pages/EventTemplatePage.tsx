import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Code, Users, Coffee, Presentation, Plus } from 'lucide-react';

const templates = [
  {
    id: 'scratch',
    title: 'Build from scratch',
    description: 'Start with a blank canvas and customize every detail.',
    icon: Plus,
    color: 'bg-gray-50',
    textColor: 'text-gray-900',
    data: {}
  },
  {
    id: 'tech-meetup',
    title: 'Tech Meetup',
    description: 'Perfect for networking, lightning talks, and developer gatherings.',
    icon: Code,
    color: 'bg-blue-50',
    textColor: 'text-blue-600',
    data: {
      title: 'Tech Meetup: ',
      description: 'Join us for an evening of networking and tech talks. We will cover the latest trends in software development and share insights from industry experts.',
      location: 'Tech Hub / Online',
      capacity: '50',
      registration_mode: 'open'
    }
  },
  {
    id: 'workshop',
    title: 'Workshop',
    description: 'Hands-on learning sessions with limited capacity and focused topics.',
    icon: Users,
    color: 'bg-green-50',
    textColor: 'text-green-600',
    data: {
      title: 'Interactive Workshop: ',
      description: 'A deep-dive workshop where you will learn practical skills through hands-on exercises. All materials will be provided.',
      location: 'Learning Center / Zoom',
      capacity: '20',
      registration_mode: 'shortlist'
    }
  },
  {
    id: 'social',
    title: 'Social Gathering',
    description: 'Informal events designed for community building and relaxed interaction.',
    icon: Coffee,
    color: 'bg-orange-50',
    textColor: 'text-orange-600',
    data: {
      title: 'Social Mixer: ',
      description: 'Unwind and connect with fellow community members in a relaxed atmosphere. Food and drinks will be served.',
      location: 'Community Lounge',
      capacity: '100',
      registration_mode: 'open'
    }
  },
  {
    id: 'conference',
    title: 'Conference',
    description: 'Large-scale events with multiple speakers, sessions, and wide reach.',
    icon: Presentation,
    color: 'bg-purple-50',
    textColor: 'text-purple-600',
    data: {
      title: 'Annual Conference 2024',
      description: 'Our flagship event featuring keynote speakers, breakout sessions, and extensive networking opportunities across various tracks.',
      location: 'Convention Center',
      capacity: '500',
      registration_mode: 'shortlist'
    }
  }
];

export default function EventTemplatePage() {
  const navigate = useNavigate();

  const handleSelectTemplate = (template: typeof templates[0]) => {
    if (template.id === 'scratch') {
      navigate('/dashboard/events/new');
    } else {
      const params = new URLSearchParams();
      Object.entries(template.data).forEach(([key, value]) => {
        params.append(key, value as string);
      });
      navigate(`/dashboard/events/new?${params.toString()}`);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex items-center gap-6"
          >
            <button
              onClick={() => navigate('/dashboard')}
              className="p-3 hover:bg-gray-100 rounded-xl transition-colors text-gray-500 hover:text-gray-900"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-4xl font-light text-gray-900 mb-2">Choose a Template</h1>
              <p className="text-gray-500 font-light">Select a starting point for your event or start from scratch</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="max-w-6xl mx-auto px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template, idx) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              whileHover={{ y: -4 }}
              onClick={() => handleSelectTemplate(template)}
              className="group cursor-pointer bg-white border border-gray-100 rounded-3xl p-8 hover:shadow-xl hover:shadow-gray-100 transition-all duration-300"
            >
              <div className={`${template.color} w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110`}>
                <template.icon className={`w-7 h-7 ${template.textColor}`} />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-3 group-hover:text-[#FF1313] transition-colors">
                {template.title}
              </h3>
              <p className="text-gray-500 font-light leading-relaxed">
                {template.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
