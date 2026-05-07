/**
 * API client for Avento backend
 * All Flask API calls go through this module
 */

import type { 
  Event, 
  Registration, 
  CreateEventInput, 
  UpdateEventInput, 
  DashboardStats,
  RegistrationStatus
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
  token?: string;
}

async function apiCall<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }
  
  const response = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'API request failed');
  }
  
  return response.json();
}

/**
 * Event API endpoints
 */
export const eventApi = {
  // List all published upcoming events
  listPublished: (token?: string): Promise<Event[]> =>
    apiCall('/events', { token }),
  
  // Get public event detail
  getById: (eventId: string, token?: string): Promise<Event> =>
    apiCall(`/events/${eventId}`, { token }),
  
  // Create event (organizer only)
  create: (input: CreateEventInput, token: string): Promise<Event> =>
    apiCall('/events', {
      method: 'POST',
      body: input,
      token,
    }),
  
  // Update event (organizer only)
  update: (eventId: string, input: UpdateEventInput, token: string): Promise<Event> =>
    apiCall(`/events/${eventId}`, {
      method: 'PATCH',
      body: input,
      token,
    }),
  
  // Cancel event (organizer only)
  cancel: (eventId: string, token: string): Promise<Event> =>
    apiCall(`/events/${eventId}/cancel`, {
      method: 'POST',
      token,
    }),

  // Delete draft event
  delete: (eventId: string, token: string): Promise<void> =>
    apiCall(`/events/${eventId}`, {
      method: 'DELETE',
      token,
    }),
  
  // List organizer's events
  listOrganizerEvents: (token: string): Promise<Event[]> =>
    apiCall('/events/organizer/events', { token }),
  
  // Get organizer's stats
  getStats: (token: string): Promise<DashboardStats> =>
    apiCall('/events/organizer/stats', { token }),
};

/**
 * Registration API endpoints
 */
export const registrationApi = {
  // Public registration
  registerPublic: (eventId: string, data: { attendee_name: string, attendee_email: string }): Promise<Registration> =>
    apiCall(`/events/${eventId}/register`, {
      method: 'POST',
      body: data,
    }),
  
  // List registrations for event (organizer only)
  listEventRegistrations: (
    eventId: string,
    params: { status?: string, search?: string },
    token: string
  ): Promise<Registration[]> => {
    const searchParams = new URLSearchParams();
    if (params.status && params.status !== 'All') searchParams.append('status', params.status.toLowerCase());
    if (params.search) searchParams.append('search', params.search);
    
    const query = searchParams.toString();
    const endpoint = `/organizer/events/${eventId}/registrations${query ? `?${query}` : ''}`;
    return apiCall(endpoint, { token });
  },
  
  // Update registration status (organizer only)
  updateStatus: (registrationId: string, status: RegistrationStatus, token: string): Promise<Registration> =>
    apiCall(`/organizer/registrations/${registrationId}/status`, {
      method: 'PATCH',
      body: { status },
      token,
    }),
};

/**
 * Event Templates API
 */
export interface Template {
  id: string;
  name: string;
  description: string;
  icon: string;
  title?: string;
  template_description?: string;
  location?: string;
  capacity?: number;
  registration_mode?: 'open' | 'shortlist';
}

export const templatesApi = {
  // List all available templates
  list: (): Promise<{ templates: Template[] }> =>
    apiCall('/templates'),
  
  // Get template details
  get: (templateId: string): Promise<Template> =>
    apiCall(`/templates/${templateId}`),
};
