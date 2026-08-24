import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)

if ('serviceWorker' in navigator) {
  // Always purge stale service workers + caches — old v1 worker served stale
  // JS chunks (old React copies) causing "Cannot read properties of null (reading 'useState')".
  window.addEventListener('load', () => {
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((r) => r.unregister());
    });
    caches.keys().then((keys) => {
      keys.forEach((k) => caches.delete(k));
    });
    // Only register the fixed service worker (v2, no JS chunk caching) in production.
    if (!import.meta.env.DEV) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  });
}