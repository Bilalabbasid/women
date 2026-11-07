'use client';

import React, { useId, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { getConsent, resetConsent, setConsent, subscribeConsent } from '@/lib/storage/consent';
import '@/app/styles/misc.css';

const NO_CHOICE = 'none';
const snapshot = () => getConsent() ?? NO_CHOICE;
// The banner is in the server HTML, so a first-time visitor sees it at first paint. A returning
// visitor's choice hides it before paint (inline script in the root layout + .consent-set CSS).
const serverSnapshot = () => NO_CHOICE;

/**
 * Storage choice. Both options are equally easy (same size, same style), and
 * "Essential only" really does store less (see src/lib/storage/consent.ts).
 * A compact bar on phones, a corner card on wider screens.
 */
export function CookieBanner() {
  const choice = useSyncExternalStore(subscribeConsent, snapshot, serverSnapshot);
  const titleId = useId();
  if (choice !== NO_CHOICE) return null;

  return (
    <aside aria-labelledby={titleId} className="storage-choices storage-bar no-print">
      <div>
        <h2 id={titleId} className="storage-bar-title">
          Your choice about this device
        </h2>
        <p className="storage-bar-text">
          No cookies, analytics or tracking. The tools save what you log on this device; with your OK we also remember a
          few preferences.{' '}
          <Link href="/cookies/">Details</Link>
        </p>
      </div>
      <div className="storage-bar-actions">
        <button type="button" onClick={() => setConsent('all')} className="btn btn-secondary">
          Allow preferences
        </button>
        <button type="button" onClick={() => setConsent('essential')} className="btn btn-secondary">
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
