'use client';

import { useSyncExternalStore } from 'react';
import { WifiOff } from 'lucide-react';

function subscribeOnline(callback: () => void) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

/**
 * Offline indicator for the private tracker. Service worker registration moved
 * to components/pwa/sw-register.tsx (root layout) so articles work offline too.
 */
export function OfflineIndicator() {
  const isOnline = useSyncExternalStore(subscribeOnline, () => navigator.onLine, () => true);
  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center justify-center gap-2 bg-[var(--color-ink)] px-4 py-1.5 text-center text-white"
    >
      <WifiOff className="h-4 w-4" aria-hidden="true" />
      <span>You&apos;re offline. Your journal is still saved on this device.</span>
    </div>
  );
}
