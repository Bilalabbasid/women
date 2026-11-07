'use client';

import React, { useSyncExternalStore } from 'react';
import Link from 'next/link';
import { getConsent, resetConsent, setConsent, subscribeConsent } from '@/lib/storage/consent';

const NO_CHOICE = 'none';
const snapshot = () => getConsent() ?? NO_CHOICE;
// The banner is in the server HTML, so a first-time visitor sees it at first paint. A returning
// visitor's choice hides it before paint (inline script in the root layout + .consent-set CSS).
const serverSnapshot = () => NO_CHOICE;

/**
 * Storage choice. Both options are equally easy, and "Essential only" really
 * does store less (see src/lib/storage/consent.ts).
 */
export function CookieBanner() {
  const choice = useSyncExternalStore(subscribeConsent, snapshot, serverSnapshot);
  if (choice !== NO_CHOICE) return null;

  return (
    <aside
      aria-label="Storage choices"
      className="storage-choices no-print fixed inset-x-3 bottom-3 z-50 mx-auto max-w-2xl rounded-2xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)] px-4 py-4 shadow-lg sm:inset-x-6"
    >
      <p className="font-semibold text-[var(--color-ink)]">Your choice about this device</p>
      <p className="mt-1 text-sm leading-relaxed text-[var(--color-ink-muted)]">
        We use no cookies, analytics or tracking. The tools save what you log or save on this device so they work.
        With your OK we also remember a few preferences, like messages you&apos;ve closed.{' '}
        <Link href="/cookies/" className="font-semibold text-[var(--color-link)] underline">
          Details
        </Link>
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setConsent('all')}
          className="tap justify-center rounded-xl bg-[var(--color-accent)] px-5 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          Allow preferences
        </button>
        <button
          type="button"
          onClick={() => setConsent('essential')}
          className="tap justify-center rounded-xl bg-[var(--color-accent)] px-5 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          Essential only
        </button>
      </div>
    </aside>
  );
}

/** Footer link that brings the choice back, so it can be changed or withdrawn at any time. */
export function StorageChoicesButton({ className }: { className?: string }) {
  return (
    <button type="button" onClick={resetConsent} className={className}>
      Storage choices
    </button>
  );
}
