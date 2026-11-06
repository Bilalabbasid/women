'use client';

import { useEffect } from 'react';

/** Registers the service worker in production. Renders nothing. */
export function SwRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
      // Registration failure only disables offline support; never surface it.
    });
  }, []);
  return null;
}
