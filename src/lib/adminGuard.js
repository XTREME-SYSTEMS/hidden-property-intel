/**
 * AdminRoute decision logic — pure function, single source of truth for the
 * /admin/* redirect behavior. Mirrored inline in the backend regression harness
 * (base44/functions/adminIsolationRegression) which proves it deterministically
 * across all role scenarios. Backend functions cannot import from src/, so the
 * harness carries an identical copy and tests it.
 *
 *   unauthenticated        → 'login'
 *   authenticated non-admin → 'portal'
 *   authenticated admin     → 'render'
 */
export function adminRouteDecision({ isAuthenticated, user }) {
  if (!isAuthenticated || !user) return 'login';
  if (user.role !== 'admin') return 'portal';
  return 'render';
}