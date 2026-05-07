/**
 * Custom hook for managing registrations
 */

import { useState, useCallback } from 'react';
import { registrationApi } from '../api';

export function useRegistrations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const registerForEvent = useCallback(async (eventId: string) => {
    try {
      setLoading(true);
      setError(null);
      const token = await (window as any).clerk.session?.getToken();
      if (!token) throw new Error('Not authenticated');
      return await registrationApi.register(eventId, token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);
  
  const cancelRegistration = useCallback(async (eventId: string) => {
    try {
      setLoading(true);
      setError(null);
      const token = await (window as any).clerk.session?.getToken();
      if (!token) throw new Error('Not authenticated');
      return await registrationApi.cancel(eventId, token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel registration');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);
  
  const getAttendeeRegistrations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await (window as any).clerk.session?.getToken();
      if (!token) throw new Error('Not authenticated');
      return await registrationApi.listAttendeeRegistrations(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load registrations');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);
  
  const getEventRegistrations = useCallback(
    async (eventId: string, status?: string) => {
      try {
        setLoading(true);
        setError(null);
        const token = await (window as any).clerk.session?.getToken();
        if (!token) throw new Error('Not authenticated');
        return await registrationApi.listEventRegistrations(eventId, status, token);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load registrations');
        return [];
      } finally {
        setLoading(false);
      }
    },
    []
  );
  
  const approveRegistration = useCallback(async (registrationId: string) => {
    try {
      setLoading(true);
      setError(null);
      const token = await (window as any).clerk.session?.getToken();
      if (!token) throw new Error('Not authenticated');
      return await registrationApi.approve(registrationId, token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);
  
  const rejectRegistration = useCallback(async (registrationId: string) => {
    try {
      setLoading(true);
      setError(null);
      const token = await (window as any).clerk.session?.getToken();
      if (!token) throw new Error('Not authenticated');
      return await registrationApi.reject(registrationId, token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);
  
  const revokeRegistration = useCallback(async (registrationId: string) => {
    try {
      setLoading(true);
      setError(null);
      const token = await (window as any).clerk.session?.getToken();
      if (!token) throw new Error('Not authenticated');
      return await registrationApi.revoke(registrationId, token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);
  
  return {
    loading,
    error,
    registerForEvent,
    cancelRegistration,
    getAttendeeRegistrations,
    getEventRegistrations,
    approveRegistration,
    rejectRegistration,
    revokeRegistration,
  };
}
