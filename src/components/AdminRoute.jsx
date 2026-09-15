import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

/**
 * Guards admin-only routes. Must be nested inside <ProtectedRoute> so the
 * user is already authenticated by the time we check their role.
 * Non-admins are redirected to the portal router, which sends them to
 * the dashboard matching their role.
 */
export default function AdminRoute() {
  const { user, isAuthenticated, isLoadingAuth, authChecked } = useAuth();

  if (isLoadingAuth || !authChecked) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-black/10 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'admin') {
    return <Navigate to="/portal" replace />;
  }

  return <Outlet />;
}