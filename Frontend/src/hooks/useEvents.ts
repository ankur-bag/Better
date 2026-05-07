/**
 * Custom hook for managing events
 */

import { useState, useCallback } from 'react';
import { useAuth as useClerkAuth } from '@clerk/react';
import type { CreateEventInput, UpdateEventInput } from '../types';
import { eventApi } from '../api';
import { useAuth } from './useAuth';

export function useEvents() {
  const { user } = useAuth();
  const { getToken } = useClerkAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const getPublishedEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = user?.id ? await getToken() : undefined;
      return await eventApi.listPublished(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load events');
      return [];
    } finally {
      setLoading(false);
    }
  }, [user?.id, getToken]);
  
  const getEvent = useCallback(async (eventId: string) => {
    try {
      setLoading(true);
      setError(null);
      const token = user?.id ? await getToken() : undefined;
      return await eventApi.getById(eventId, token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load event');
      return null;
    } finally {
      setLoading(false);
    }
  }, [user?.id, getToken]);
  
  const createEvent = useCallback(
    async (input: CreateEventInput) => {
      try {
        setLoading(true);
        setError(null);
        const token = await getToken();
        if (!token) throw new Error('Not authenticated');
        return await eventApi.create(input, token);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create event');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [getToken]
  );
  
  const updateEvent = useCallback(
    async (eventId: string, input: UpdateEventInput) => {
      try {
        setLoading(true);
        setError(null);
        const token = await getToken();
        if (!token) throw new Error('Not authenticated');
        return await eventApi.update(eventId, input, token);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update event');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [getToken]
  );
  
  const cancelEvent = useCallback(
    async (eventId: string) => {
      try {
        setLoading(true);
        setError(null);
        const token = await getToken();
        if (!token) throw new Error('Not authenticated');
        return await eventApi.cancel(eventId, token);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to cancel event');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [getToken]
  );
  
  const getOrganizerEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');
      return await eventApi.listOrganizerEvents(token);
    } catch (err) {
      console.error('getOrganizerEvents error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load events');
      return [];
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  const getStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');
      return await eventApi.getStats(token);
    } catch (err) {
      console.error('getStats error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load stats');
      return { total_events: 0, total_attendees: 0, active_events: 0 };
    } finally {
      setLoading(false);
    }
  }, [getToken]);
  
  return {
    loading,
    error,
    getPublishedEvents,
    getEvent,
    createEvent,
    updateEvent,
    cancelEvent,
    getOrganizerEvents,
    getStats,
  };
}
