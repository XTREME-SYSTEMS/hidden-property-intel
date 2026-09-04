import { base44 } from "@/api/base44Client";

// Google's OAuth consent screen sets X-Frame-Options: DENY, so it cannot
// render inside the Base44 builder preview iframe — the redirect hangs and
// the tab freezes. When we detect an iframe, open the login page in a new
// tab with ?google_auth=1; the page then auto-triggers the provider flow
// in a top-level browsing context where Google allows rendering.

export function isInIframe() {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

export function startGoogleLogin(returnTo) {
  if (isInIframe()) {
    const url = new URL(window.location.href);
    url.searchParams.set("google_auth", "1");
    if (returnTo && returnTo !== "/") {
      url.searchParams.set("returnTo", returnTo);
    }
    window.open(url.toString(), "_blank", "noopener,noreferrer");
    return;
  }
  base44.auth.loginWithProvider("google", returnTo);
}