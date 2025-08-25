import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Box, Spinner } from '@chakra-ui/react';

interface RequireAdminProps {
  children: React.ReactNode;
}

export function RequireAdmin({ children }: RequireAdminProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  console.log("RequireAdmin: Checking user:", user);

  // Wait for auth to finish initializing
  if (isLoading) {
    return (
      <Box py={8} textAlign="center">
        <Spinner />
      </Box>
    );
  }

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
