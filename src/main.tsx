import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register offline-first service worker only in production to prevent caching raw typescript files in development
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const isDev = (import.meta as any).env?.DEV || window.location.hostname === 'localhost' || window.location.hostname.includes('ais-dev');
    if (isDev) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister().then(() => {
            console.log('Unregistered development service worker to prevent TS caching');
          });
        }
      });
    } else {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('RecapMind Offline Service Worker registered.', reg.scope))
        .catch(err => console.warn('Service Worker registration failed:', err));
    }
  });
}

// Global safe error boundary listener to gracefully swallow cross-origin CDN or iframe-related benign "Script error."
window.addEventListener('error', (event) => {
  const msgStr = String(event.message || '');
  if (
    msgStr.toLowerCase().includes('script error') || 
    !event.filename || 
    event.filename.indexOf(window.location.origin) === -1
  ) {
    console.warn('Swallowed cross-origin script error or iframe extension error:', event);
    event.preventDefault();
  }
});

window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  const reasonStr = String(reason?.message || reason || '');
  if (
    reasonStr.toLowerCase().includes('script error') || 
    reasonStr.toLowerCase().includes('cross-origin') ||
    reasonStr.toLowerCase().includes('origin')
  ) {
    console.warn('Swallowed cross-origin unhandled promise rejection in main.tsx:', reasonStr);
    event.preventDefault();
  }
});


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
