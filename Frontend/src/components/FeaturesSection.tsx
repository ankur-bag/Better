import { Calendar, Users, Bell } from 'lucide-react';

export default function FeaturesSection() {
  const features = [
    {
      icon: <Calendar className="w-8 h-8 text-[var(--color-primary)]" />,
      title: 'Create Events',
      description: 'Easily set up drafts, manage capacity, and publish beautiful event pages.'
    },
    {
      icon: <Users className="w-8 h-8 text-[var(--color-primary)]" />,
      title: 'Manage Registrations',
      description: 'Review applicants, manage shortlists, and track attendance seamlessly.'
    },
    {
      icon: <Bell className="w-8 h-8 text-[var(--color-primary)]" />,
      title: 'Send Notifications',
      description: 'Keep attendees in the loop with automated confirmations and updates.'
    }
  ];

  return (
    <section id="features" className="py-24 bg-[var(--color-surface)] w-full">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <h2 className="text-4xl font-bold text-center text-[var(--color-text)] mb-16">
          Everything you need to run great events
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="p-8 bg-[var(--color-surface)] rounded-xl shadow-md transition-shadow">
              <div className="mb-6 inline-block p-4 bg-[var(--color-bg)] rounded-lg">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-[var(--color-text)] mb-3">{feature.title}</h3>
              <p className="text-[var(--color-muted)] leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
