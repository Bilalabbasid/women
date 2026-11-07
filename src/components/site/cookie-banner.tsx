'use client';

import React, { useState, useSyncExternalStore } from 'react';
import Link from 'next/link';

/**
 * A plain notice, not a consent tool: the site sets no cookies and runs no
 * tracking, so there is nothing to accept or reject. The only thing stored is
 * that the visitor dismissed this notice (a choice made in the interface).
 */
const DISMISSED_KEY = 'menoverdict_notice_dismissed';
/** Left by the old consent banner; removed so nothing consent-like stays behind. */
const LEGACY_KEYS = ['menoverdict_cookie_consent', 'menowell_cookie_consent'];

const subscribe = () => () => {};
const getSnapshot = () => {
  try {
    return localStorage.getItem(DISMISSED_KEY) === '1';
  } catch {
    return true;
  }
};
const getServerSnapshot = () => true;

export function CookieBanner() {
  const storedDismissed = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [dismissed, setDismissed] = useState(false);
  if (storedDismissed || dismissed) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISSED_KEY, '1');
      for (const k of LEGACY_KEYS) localStorage.removeItem(k);
    } catch {
      // Storage unavailable: hide for this page view only.
    }
    setDismissed(true);
  };

  return (
    <aside
      aria-label="Privacy notice"
      className="no-print fixed inset-x-3 bottom-3 z-50 mx-auto max-w-2xl rounded-2xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)] px-4 py-3 shadow-lg sm:inset-x-6"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-relaxed text-[var(--color-ink)]">
          MenoVerdict sets no cookies and runs no tracking or analytics. Anything you log stays on this device.{' '}
          <Link href="/cookies/" className="font-semibold text-[var(--color-link)] underline">
            Cookie page
          </Link>
        </p>
        <button
          type="button"
          onClick={dismiss}
          className="tap shrink-0 justify-center rounded-xl bg-[var(--color-accent)] px-5 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          OK
        </button>
      </div>
    </aside>
  );
}
