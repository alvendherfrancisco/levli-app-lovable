import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
// iOS wrapper globals, installed before React mounts.
import '@/lib/iosBridge'
import '@/lib/iosLoadingOverlayBridge'
import '@/lib/iosSession'
import '@/lib/iosSystem'

// Registers the offline app-shell worker (caching only — it holds no push or
// notification code). Published builds only, so the dev server is never cached.
// Failures are ignored: the app runs fine without it.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)