const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://fwtchbsebygwifmmqhur.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_oNTYjS9lIq3YSEHooAZJbg_Q34g4esY";

const SESSION_KEY = "hpi_supabase_session_v1";
const RETURN_TO_KEY = "hpi_auth_return_to_v1";

function browser() {
  return typeof window !== "undefined";
}

function authError(message, status = 401) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function normalizeReturnTo(value, fallback = "/portal") {
  if (!value || !browser()) return fallback;
  try {
    if (value.startsWith("/") && !value.startsWith("//")) return value;
    const parsed = new URL(value, window.location.origin);
    if (parsed.origin !== window.location.origin) return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

function loadSession() {
  if (!browser()) return null;
  try {
    return JSON.parse(window.localStorage.getItem(SESSION_KEY) || "null");
  } catch {
    return null;
  }
}

function notifyAuthChanged() {
  if (browser()) window.dispatchEvent(new CustomEvent("hpi-auth-changed"));
}

function storeSession(session) {
  if (!browser()) return session;
  if (!session?.access_token) {
    window.localStorage.removeItem(SESSION_KEY);
    notifyAuthChanged();
    return null;
  }
  const expiresIn = Number(session.expires_in || 3600);
  const expiresAt = Number(session.expires_at || 0);
  const normalized = {
    ...session,
    expires_at: expiresAt > 1000000000000
      ? expiresAt
      : expiresAt > 0
        ? expiresAt * 1000
        : Date.now() + expiresIn * 1000,
  };
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(normalized));
  notifyAuthChanged();
  return normalized;
}

async function request(path, { method = "GET", body, token } = {}) {
  const response = await fetch(`${SUPABASE_URL}${path}`, {
    method,
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw authError(data?.msg || data?.message || data?.error_description || data?.error || `Auth request failed (${response.status})`, response.status);
  }
  return data;
}

async function refreshSession(session) {
  if (!session?.refresh_token) return null;
  try {
    const refreshed = await request("/auth/v1/token?grant_type=refresh_token", {
      method: "POST",
      body: { refresh_token: session.refresh_token },
    });
    return storeSession(refreshed);
  } catch {
    storeSession(null);
    return null;
  }
}

async function getValidSession() {
  let session = loadSession();
  if (!session) return null;
  if (Number(session.expires_at || 0) - Date.now() < 60000) {
    session = await refreshSession(session);
  }
  return session;
}

async function profileFor(user, accessToken) {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/universal_user_profiles?select=id,email,full_name,avatar_url,role&id=eq.${encodeURIComponent(user.id)}&limit=1`,
      {
        headers: {
          apikey: SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    if (!response.ok) return null;
    const rows = await response.json();
    return rows?.[0] || null;
  } catch {
    return null;
  }
}

function parseSessionFromHash() {
  if (!browser() || !window.location.hash) return null;
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const error = params.get("error_description") || params.get("error");
  if (error) throw authError(error, 400);
  const accessToken = params.get("access_token");
  if (!accessToken) return null;
  return {
    access_token: accessToken,
    refresh_token: params.get("refresh_token"),
    expires_in: Number(params.get("expires_in") || 3600),
    expires_at: Number(params.get("expires_at") || 0),
    token_type: params.get("token_type") || "bearer",
  };
}

export const supabaseAuth = {
  async me() {
    const session = await getValidSession();
    if (!session?.access_token) throw authError("Authentication required", 401);
    const user = await request("/auth/v1/user", { token: session.access_token });
    const profile = await profileFor(user, session.access_token);
    return {
      id: user.id,
      email: user.email,
      full_name: profile?.full_name || user.user_metadata?.full_name || user.user_metadata?.name || "",
      avatar_url: profile?.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture || "",
      role: profile?.role || "investor",
      provider: user.app_metadata?.provider || "email",
      user_metadata: user.user_metadata || {},
    };
  },

  async loginViaEmailPassword(email, password) {
    const session = await request("/auth/v1/token?grant_type=password", {
      method: "POST",
      body: { email, password },
    });
    return storeSession(session);
  },

  loginWithProvider(provider, returnTo = "/portal") {
    if (!browser()) return;
    const safeReturnTo = normalizeReturnTo(returnTo);
    window.localStorage.setItem(RETURN_TO_KEY, safeReturnTo);
    const redirectTo = `${window.location.origin}/auth/callback`;
    const authorizeUrl = new URL(`${SUPABASE_URL}/auth/v1/authorize`);
    authorizeUrl.searchParams.set("provider", provider);
    authorizeUrl.searchParams.set("redirect_to", redirectTo);
    window.location.assign(authorizeUrl.toString());
  },

  async register({ email, password }) {
    const redirectTo = browser() ? `${window.location.origin}/auth/callback` : undefined;
    const suffix = redirectTo ? `?redirect_to=${encodeURIComponent(redirectTo)}` : "";
    const result = await request(`/auth/v1/signup${suffix}`, {
      method: "POST",
      body: { email, password },
    });
    if (result?.access_token) storeSession(result);
    return result;
  },

  async verifyOtp({ email, otpCode }) {
    const result = await request("/auth/v1/verify", {
      method: "POST",
      body: { type: "signup", email, token: otpCode },
    });
    if (result?.access_token) storeSession(result);
    return result;
  },

  async resendOtp(email) {
    return request("/auth/v1/resend", {
      method: "POST",
      body: { type: "signup", email },
    });
  },

  setToken(accessToken) {
    const existing = loadSession() || {};
    storeSession({ ...existing, access_token: accessToken });
  },

  async resetPasswordRequest(email) {
    const redirectTo = browser() ? `${window.location.origin}/reset-password` : undefined;
    const suffix = redirectTo ? `?redirect_to=${encodeURIComponent(redirectTo)}` : "";
    return request(`/auth/v1/recover${suffix}`, {
      method: "POST",
      body: { email },
    });
  },

  async resetPassword({ newPassword }) {
    this.captureSessionFromUrl();
    const session = await getValidSession();
    if (!session?.access_token) throw authError("Password recovery session is missing or expired", 401);
    return request("/auth/v1/user", {
      method: "PUT",
      token: session.access_token,
      body: { password: newPassword },
    });
  },

  captureSessionFromUrl() {
    const session = parseSessionFromHash();
    if (!session) return loadSession();
    const stored = storeSession(session);
    if (browser()) {
      window.history.replaceState({}, document.title, `${window.location.pathname}${window.location.search}`);
    }
    return stored;
  },

  completeOAuthCallback() {
    this.captureSessionFromUrl();
    if (!browser()) return "/portal";
    const returnTo = normalizeReturnTo(window.localStorage.getItem(RETURN_TO_KEY), "/portal");
    window.localStorage.removeItem(RETURN_TO_KEY);
    return returnTo;
  },

  hasSession() {
    return Boolean(loadSession()?.access_token);
  },

  async logout(redirectUrl) {
    const session = loadSession();
    try {
      if (session?.access_token) {
        await request("/auth/v1/logout", { method: "POST", token: session.access_token });
      }
    } catch {
      // Local logout must still succeed if the network is unavailable.
    }
    storeSession(null);
    if (redirectUrl && browser()) {
      window.location.assign(normalizeReturnTo(redirectUrl, "/"));
    }
  },

  redirectToLogin(returnTo) {
    if (!browser()) return;
    const safeReturnTo = normalizeReturnTo(returnTo, window.location.pathname || "/");
    window.location.assign(`/login?returnTo=${encodeURIComponent(safeReturnTo)}`);
  },
};

export { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY };
