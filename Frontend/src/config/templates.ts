export const EVENT_TEMPLATES = [
  {
    id: 'tech-meetup',
    label: 'Tech Meetup',
    icon: 'Laptop',
    prefill: {
      title: 'Tech Meetup - ',
      description: 'Join us for an evening of tech talks, demos, and networking...',
      is_online: false,
      registration_mode: 'open',
      capacity: 100,
    }
  },
  {
    id: 'webinar',
    label: 'Webinar',
    icon: 'Mic',
    prefill: {
      title: 'Webinar: ',
      description: 'An interactive online session where our speakers will cover...',
      is_online: true,
      registration_mode: 'shortlist',
      capacity: 500,
    }
  },
  {
    id: 'workshop',
    label: 'Workshop',
    icon: 'Wrench',
    prefill: {
      title: 'Workshop: ',
      description: 'A focused hands-on workshop. You will leave with practical skills in...',
      is_online: false,
      registration_mode: 'shortlist',
      capacity: 30,
    }
  },
  {
    id: 'networking',
    label: 'Networking Event',
    icon: 'Users',
    prefill: {
      title: 'Networking Night - ',
      description: 'Connect with professionals in your field over drinks and conversation...',
      is_online: false,
      registration_mode: 'open',
      capacity: 60,
    }
  }
];
