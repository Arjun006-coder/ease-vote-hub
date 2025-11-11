import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface AdminRouteProps {
  children: React.ReactNode;
}

/**
 * AdminRoute component protects admin-only routes
 * - Checks if user is authenticated
 * - Checks if user has admin or moderator role
 * - Redirects non-admins to dashboard
 * - Shows loading state while checking
 */
export const AdminRoute = ({ children }: AdminRouteProps) => {
  const { user, userProfile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Wait for auth to load
    if (loading) {
      return;
    }

    // Redirect to home if not authenticated
    if (!user) {
      navigate('/', { replace: true });
      return;
    }

    // Wait for userProfile to load (it includes the role)
    if (!userProfile) {
      // Give it a moment to load
      return;
    }

    // Check if user has admin or moderator role
    const isAdmin = userProfile.role === 'admin' || userProfile.role === 'moderator';
    
    if (!isAdmin) {
      // User is not an admin, redirect to dashboard
      navigate('/dashboard', { replace: true });
      return;
    }
  }, [user, userProfile, loading, navigate]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-background/80">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-white/70">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render until we know the user's role
  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-background/80">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-white/70">Checking permissions...</p>
        </div>
      </div>
    );
  }

  // Check if user is authenticated and is admin
  if (!user) {
    return null; // Will redirect
  }

  const isAdmin = userProfile.role === 'admin' || userProfile.role === 'moderator';
  
  if (!isAdmin) {
    return null; // Will redirect
  }

  // User is authenticated and is admin/moderator, render children
  return <>{children}</>;
};
