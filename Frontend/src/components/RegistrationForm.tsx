import { useState } from 'react';

interface RegistrationFormProps {
  onSubmit: (name: string, email: string) => Promise<void>;
}

export default function RegistrationForm({ onSubmit }: RegistrationFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(name, email);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <div>
        <label htmlFor="name" className="block text-[var(--color-muted)] mb-1">Name</label>
        <input 
          type="text" 
          id="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-2 rounded bg-transparent border border-[var(--color-muted)] text-[var(--color-surface)] focus:border-[var(--color-primary)] outline-none transition-colors"
        />
      </div>
      <div>
        <label htmlFor="email" className="block text-[var(--color-muted)] mb-1">Email</label>
        <input 
          type="email" 
          id="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 rounded bg-transparent border border-[var(--color-muted)] text-[var(--color-surface)] focus:border-[var(--color-primary)] outline-none transition-colors"
        />
      </div>
      <button 
        type="submit" 
        disabled={isSubmitting}
        className="bg-[var(--color-primary)] text-[var(--color-surface)] px-6 py-2 rounded font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {isSubmitting ? 'Submitting...' : 'Register'}
      </button>
    </form>
  );
}
