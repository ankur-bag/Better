import { useUser } from '@clerk/react';
import { Navigate, Outlet } from 'react-router-dom';

export default function ProtectedRoute() {
  const { isLoaded, isSignedIn } = useUser();

  // Show loading while Clerk is initializing
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--color-bg)]">
        <div className="text-center">
          <div className="text-[var(--color-primary)] text-xl font-semibold">Loading...</div>
          <p className="text-[var(--color-muted)] mt-2">Setting up your dashboard</p>
        </div>
      </div>
    );
  }

  // Not signed in - redirect to home
  if (!isSignedIn) {
    return <Navigate to="/" replace />;
  }

  // Signed in - allow access
  return <Outlet />;
}
