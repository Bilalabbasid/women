'use client';

import React, { useState, useSyncExternalStore } from 'react';
import Link from 'next/link';

const STORAGE_KEY = 'menoverdict_cookie_consent';

const subscribe = () => () => {};
const getSnapshot = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) || localStorage.getItem('menowell_cookie_consent') || '';
  } catch {
    return 'accepted_essential';
  }
};
const getServerSnapshot = () => 'accepted_essential';

export function CookieBanner() {
  const storedDecision = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [localDecision, setLocalDecision] = useState<string | null>(null);

  const decision = localDecision ?? storedDecision;
  if (decision) return null;

  const choose = (choice: 'rejected_all' | 'accepted_all') => {
    try {
      localStorage.setItem(STORAGE_KEY, choice);
    } catch {
      // ignore
    }
    setLocalDecision(choice);
  };

  return (
    <aside
      aria-label="Cookie and privacy choices"
      className="no-print fixed bottom-0 left-0 right-0 z-50 border-t-2 border-[var(--color-rule)] bg-[var(--color-paper-raised)] px-4 py-4 shadow-lg"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1 text-xs leading-relaxed text-[var(--color-ink)]">
          <p className="font-semibold">Your privacy comes first</p>
          <p className="text-[var(--color-ink-muted)]">
            We use only strictly essential local storage to keep your symptom tools working on your device. We never load advertising pixels, session replay, or third-party health trackers. Read our{' '}
            <Link href="/cookies/" className="text-[var(--color-link)] underline">
              Cookie Policy
            </Link>{' '}
            and{' '}
            <Link href="/privacy/" className="text-[var(--color-link)] underline">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => choose('rejected_all')}
            className="tap rounded-xl border-2 border-[var(--color-ink)] bg-[var(--color-paper)] px-4 py-2 text-xs font-semibold text-[var(--color-ink)] hover:bg-[var(--color-rule)]"
          >
            Reject all
          </button>
          <button
            type="button"
            onClick={() => choose('accepted_all')}
            className="tap rounded-xl border-2 border-[var(--color-accent)] bg-[var(--color-accent)] px-4 py-2 text-xs font-semibold text-white hover:opacity-95"
          >
            Accept all
          </button>
        </div>
      </div>
    </aside>
  );
}
