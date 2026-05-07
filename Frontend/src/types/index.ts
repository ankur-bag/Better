/**
 * TypeScript types for Avento event management platform
 */

export interface User {
  id: string;
  email: string;
  role: 'organizer' | 'attendee';
  created_at: string;
}

export type EventStatus = 'draft' | 'published' | 'cancelled';
export type PublicStatus = 'Open' | 'Full' | 'Closed' | 'Cancelled';

export interface Event {
  id: string;
  organizer_id: string;
  title: string;
  description: string | null;
  location: string;
  start_datetime: string;
  end_datetime: string;
  capacity: number;
  registration_mode: 'open' | 'shortlist';
  status: EventStatus;
  slug: string;
  created_at: string;
  active_count?: number;
  remaining_spots?: number;
  public_status?: PublicStatus;
  // Dashboard fields
  confirmed_count?: number;
  remaining_capacity?: number;
}

export type RegistrationStatus = 'pending' | 'registered' | 'approved' | 'rejected' | 'revoked';

export interface Registration {
  id: string;
  event_id: string;
  attendee_id: string | null;
  attendee_name: string;
  attendee_email: string;
  status: RegistrationStatus;
  created_at: string;
  updated_at?: string;
}

export interface DashboardStats {
  total_events: number;
  total_attendees: number;
  active_events: number;
}

export interface CreateEventInput {
  title: string;
  description?: string;
  location: string;
  start_datetime: string;
  end_datetime: string;
  capacity: number;
  registration_mode: 'open' | 'shortlist';
}

export interface UpdateEventInput {
  title?: string;
  description?: string;
  location?: string;
  capacity?: number;
}

export interface ApiError {
  error: string;
}
