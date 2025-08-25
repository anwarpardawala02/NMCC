import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface RequireAdminProps {
  children: React.ReactNode;
}

export function RequireAdmin({ children }: RequireAdminProps) {
  const { user } = useAuth();
  const location = useLocation();

  console.log("RequireAdmin: Checking user:", user);

  // Check if user exists and has admin privileges
  if (!user) {
    console.log("RequireAdmin: No user found, redirecting to unauthorized");
    return <Navigate to="/unauthorized" state={{ from: location }} replace />;
  }

  if (!user.is_admin) {
    console.log("RequireAdmin: User is not admin, redirecting to unauthorized");
    return <Navigate to="/unauthorized" state={{ from: location }} replace />;
  }

  console.log("RequireAdmin: User is admin, allowing access");
  return children;
}
