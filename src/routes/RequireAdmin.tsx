import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface RequireAdminProps {
  children: React.ReactNode;
}

export function RequireAdmin({ children }: RequireAdminProps) {
  const { user } = useAuth();
  const location = useLocation();

  // Check if user exists and has admin privileges
  if (!user || !user.is_admin) {
    // Redirect to unauthorized page or login
    return <Navigate to="/unauthorized" state={{ from: location }} replace />;
  }

  return children;
}
