/**
 * Custom hook for managing registrations
 */

import { useState, useCallback } from 'react';
import { useAuth } from '@clerk/react';
import { registrationApi } from '../api';

export function useRegistrations() {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const getEventRegistrations = useCallback(
    async (eventId: string, status?: string) => {
      try {
        setLoading(true);
        setError(null);
        const token = await getToken();
        if (!token) throw new Error('Not authenticated');
        return await registrationApi.listEventRegistrations(eventId, { status }, token);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load registrations');
        return [];
      } finally {
        setLoading(false);
      }
    },
    [getToken]
  );
  
  const approveRegistration = useCallback(async (registrationId: string) => {
    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');
      return await registrationApi.updateStatus(registrationId, 'approved', token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getToken]);
  
  const rejectRegistration = useCallback(async (registrationId: string) => {
    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');
      return await registrationApi.updateStatus(registrationId, 'rejected', token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getToken]);
  
  const revokeRegistration = useCallback(async (registrationId: string) => {
    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');
      return await registrationApi.updateStatus(registrationId, 'revoked', token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getToken]);
  
  return {
    loading,
    error,
    getEventRegistrations,
    approveRegistration,
    rejectRegistration,
    revokeRegistration,
  };
}
