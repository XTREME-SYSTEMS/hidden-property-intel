import React, { createContext, useState, useContext, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const AuthContext = createContext();

// Hard cap on how long we'll wait for an auth check before giving up and
// letting the app render. Prevents the white-screen hang that happens when
// the SDK's me() call stalls (e.g. after an OAuth popup freeze).
const AUTH_TIMEOUT_MS = 4000;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  // On mount, fire a single non-blocking auth check. The app renders
  // immediately regardless of the outcome; auth state updates when this
  // resolves or times out.
  useEffect(() => {
    let cancelled = false;

    const timeout = setTimeout(() => {
      if (cancelled) return;
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }, AUTH_TIMEOUT_MS);

    setIsLoadingAuth(true);
    base44.auth.me()
      .then((u) => {
        if (cancelled) return;
        setUser(u);
        setIsAuthenticated(true);
        setAuthChecked(true);
        clearTimeout(timeout);
      })
      .catch((err) => {
        if (cancelled) return;
        setIsAuthenticated(false);
        setAuthChecked(true);
        if (err?.status === 401 || err?.status === 403) {
          setAuthError({ type: 'auth_required', message: 'Authentication required' });
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingAuth(false);
      });

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, []);

  const checkUserAuth = async () => {
    setIsLoadingAuth(true);
    try {
      const u = await Promise.race([
        base44.auth.me(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Auth check timed out')), AUTH_TIMEOUT_MS)
        ),
      ]);
      setUser(u);
      setIsAuthenticated(true);
    } catch {
      setIsAuthenticated(false);
    } finally {
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  };

  const logout = (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    if (shouldRedirect) {
      base44.auth.logout(window.location.href);
    } else {
      base44.auth.logout();
    }
  };

  const navigateToLogin = () => {
    base44.auth.redirectToLogin(window.location.href);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      authError,
      authChecked,
      logout,
      navigateToLogin,
      checkUserAuth,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};