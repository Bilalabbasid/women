'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { WifiOff } from 'lucide-react';

function subscribeOnline(callback: () => void) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

function getSnapshot() {
  return navigator.onLine;
}

function getServerSnapshot() {
  return true;
}

export function ServiceWorkerRegistrar() {
  const isOnline = useSyncExternalStore(subscribeOnline, getSnapshot, getServerSnapshot);

  useEffect(() => {
    // Register service worker in production / modern browsers
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('[MenoWell PWA] Service Worker registered with scope:', registration.scope);
          })
          .catch((error) => {
            console.warn('[MenoWell PWA] Service Worker registration failed:', error);
          });
      });
    }
  }, []);

  if (isOnline) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-[#231F1D] text-white text-xs py-1.5 px-4 text-center flex items-center justify-center gap-2 transition-all"
    >
      <WifiOff className="w-3.5 h-3.5 text-[#E5DED5]" />
      <span>Offline mode active. Your journal is safely saved locally on this device.</span>
    </div>
  );
}
