/**
 * Custom hook for authentication
 * Uses Clerk for auth, derives role from publicMetadata
 */

import { useUser } from '@clerk/react';

interface AuthUser {
  id: string;
  email: string;
  role: 'organizer' | 'attendee' | null;
}

export function useAuth() {
  const { user, isLoaded, isSignedIn } = useUser();
  
  const authUser: AuthUser | null = user
    ? {
        id: user.id,
        email: user.emailAddresses[0]?.emailAddress || '',
        role: (user.publicMetadata?.role as 'organizer' | 'attendee') || null,
      }
    : null;
  
  return {
    user: authUser,
    isLoaded,
    isSignedIn: isSignedIn || false,
  };
}
