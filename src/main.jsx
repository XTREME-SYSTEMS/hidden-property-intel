import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)

// Service worker registration is intentionally disabled until the stale-cache
// issue is fully resolved. The inline script in index.html purges any existing
// workers before app JS loads. Re-enable /sw.js here once the app is stable.