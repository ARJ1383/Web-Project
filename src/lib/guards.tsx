import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useCurrentUser } from '@/stores/authStore';
import type { Role } from '@/types/models';

/** Blocks unauthenticated access; redirects to /login, preserving the target. */
export function RequireAuth() {
  const user = useCurrentUser();
  const location = useLocation();
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <Outlet />;
}

/** Restricts a route subtree to specific roles; others are sent home. */
export function RequireRole({ roles }: { roles: Role[] }) {
  const user = useCurrentUser();
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to="/" replace />;
  return <Outlet />;
}
