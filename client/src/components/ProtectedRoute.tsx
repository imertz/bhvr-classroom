import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, checkAuth, user } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    // Check authentication status when component mounts
    if (!isAuthenticated && !isLoading) {
      checkAuth();
    }
  }, [isAuthenticated, isLoading, checkAuth]);

  // Verifying the session: a sweeping rule, in keeping with the system
  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-6 sm:px-8 lg:px-12">
        <div className="w-full max-w-sm">
          <span className="micro micro-signal">Verifying session</span>
          <div className="relative mt-5 h-px w-full overflow-hidden bg-rule">
            <span className="anim-sweep absolute inset-y-0 left-0 w-1/4 bg-signal" />
          </div>
          <p className="mt-5 text-[0.8125rem] leading-relaxed text-muted-foreground">
            Confirming your credentials against the school record.
          </p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If specific roles are required, verify user's role
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  // Render protected content if authenticated
  return <>{children}</>;
}
