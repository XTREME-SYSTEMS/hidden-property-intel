import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import PageErrorBoundary from '@/components/PageErrorBoundary';

const DefaultFallback = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
  </div>
);

// Hard cap so ProtectedRoute never hangs forever on a stalled auth check.
const PROTECTED_TIMEOUT_MS = 5000;

export default function ProtectedRoute({ fallback = <DefaultFallback />, unauthenticatedElement }) {
  const { isAuthenticated, isLoadingAuth, authChecked, authError, checkUserAuth } = useAuth();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!authChecked && !isLoadingAuth) {
      checkUserAuth();
    }
    const t = setTimeout(() => setTimedOut(true), PROTECTED_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [authChecked, isLoadingAuth, checkUserAuth]);

  if (authError?.type === 'user_not_registered') {
    return <UserNotRegisteredError />;
  }

  // Still loading and haven't hit the safety timeout yet — show spinner.
  if ((isLoadingAuth || !authChecked) && !timedOut) {
    return fallback;
  }

  // Auth resolved (or timed out). If not authenticated, redirect.
  if (authError || !isAuthenticated) {
    return unauthenticatedElement;
  }

  return (
    <PageErrorBoundary>
      <Outlet />
    </PageErrorBoundary>
  );
}