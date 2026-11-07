'use client';

import { useEffect } from 'react';
import { canStorePreferences } from '@/lib/storage/consent';
import { NOTICE_CLASS, NOTICE_KEY } from '@/lib/site/notice-dismiss';

/**
 * Close (×) for the tracker's top honesty strip. The strip stays in the server
 * HTML (validate:honesty, no-JS readers); closing adds `notice-closed` to <html>,
 * which hides it. Remembered on this device only if preferences are allowed
 * (menoverdict_notice_dismissed is a consent PREFERENCE_KEY), otherwise for this
 * visit. The full notice stays in the tracker footer.
 */
function isDismissed() {
  try {
    return !!(window.localStorage.getItem(NOTICE_KEY) || window.sessionStorage.getItem(NOTICE_KEY));
  } catch {
    return false;
  }
}

export function NoticeDismiss() {
  // Client-side navigation doesn't re-run the inline script; re-apply on mount.
  useEffect(() => {
    if (isDismissed()) document.documentElement.classList.add(NOTICE_CLASS);
  }, []);

  function close() {
    document.documentElement.classList.add(NOTICE_CLASS);
    try {
      if (canStorePreferences()) window.localStorage.setItem(NOTICE_KEY, '1');
      else window.sessionStorage.setItem(NOTICE_KEY, '1');
    } catch {
      // Storage unavailable: hidden for this page only.
    }
    // Keep keyboard users oriented: move focus to the main content.
    document.getElementById('main')?.focus({ preventScroll: true });
  }

  return (
    <button type="button" onClick={close} className="icon-btn shrink-0 text-[var(--color-ink-muted)]" aria-label="Close this notice">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
        <path d="M6 6l12 12M18 6L6 18" />
      </svg>
    </button>
  );
}
