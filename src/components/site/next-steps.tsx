'use client';

import React, { useSyncExternalStore } from 'react';
import Link from 'next/link';

interface NextStepsProps {
  trackingUrl?: string;
  trackingLabel?: string;
  doctorUrl?: string;
  doctorLabel?: string;
  treatmentUrl?: string;
  treatmentLabel?: string;
}

export function NextSteps({
  trackingUrl = '/tools/symptoms-checklist/',
  trackingLabel = 'Log and spot your patterns with the symptom checklist',
  doctorUrl = '/tools/treatment-questions/',
  doctorLabel = 'Prepare your 10-minute doctor appointment questions',
  treatmentUrl = '/treatments/',
  treatmentLabel = 'Explore evidence-graded treatment and lifestyle options',
}: NextStepsProps) {
  return (
    <section aria-labelledby="next-steps-heading" className="my-10 rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)] p-6">
      <h2 id="next-steps-heading" className="font-serif text-2xl font-semibold mb-4">
        Where are you right now?
      </h2>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-[var(--color-rule)] bg-[var(--color-paper)] p-4 space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink-muted)]">Still tracking</p>
          <p className="text-sm">Not sure if your symptoms fit? Start tracking your daily patterns.</p>
          <Link href={trackingUrl} className="tap inline-block text-sm font-semibold text-[var(--color-link)] underline">
            {trackingLabel} →
          </Link>
        </div>

        <div className="rounded-lg border border-[var(--color-rule)] bg-[var(--color-paper)] p-4 space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink-muted)]">Ready to talk to a doctor</p>
          <p className="text-sm">Have an upcoming appointment? Bring structured questions and your history.</p>
          <Link href={doctorUrl} className="tap inline-block text-sm font-semibold text-[var(--color-link)] underline">
            {doctorLabel} →
          </Link>
        </div>

        <div className="rounded-lg border border-[var(--color-rule)] bg-[var(--color-paper)] p-4 space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink-muted)]">Already on treatment</p>
          <p className="text-sm">Evaluating your response or wondering what to adjust next?</p>
          <Link href={treatmentUrl} className="tap inline-block text-sm font-semibold text-[var(--color-link)] underline">
            {treatmentLabel} →
          </Link>
        </div>
      </div>
    </section>
  );
}

const BOOKMARKS_KEY = 'menowell_bookmarks';
const BOOKMARKS_EVENT = 'menowell-bookmarks-change';

function readBookmarks(): Array<{ url: string; title?: string; savedAt?: string }> {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || '[]');
    return Array.isArray(saved) ? saved.filter((b) => b && typeof b.url === 'string') : [];
  } catch {
    return [];
  }
}

function subscribeBookmarks(onChange: () => void) {
  window.addEventListener('storage', onChange);
  window.addEventListener(BOOKMARKS_EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(BOOKMARKS_EVENT, onChange);
  };
}

/**
 * "Save for later" for an article, kept in this browser. Read through
 * useSyncExternalStore so the server render and the first client render agree
 * (both "not saved"), then it switches to the saved state without a hydration error.
 */
export function BookmarkButton({ url, title }: { url: string; title: string }) {
  const bookmarked = useSyncExternalStore(
    subscribeBookmarks,
    () => readBookmarks().some((b) => b.url === url),
    () => false,
  );

  const toggleBookmark = () => {
    try {
      const saved = readBookmarks();
      const next = bookmarked
        ? saved.filter((b) => b.url !== url)
        : [...saved, { url, title, savedAt: new Date().toISOString() }];
      localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(next));
      window.dispatchEvent(new Event(BOOKMARKS_EVENT));
    } catch {
      // Storage blocked or full: the button simply doesn't change.
    }
  };

  return (
    <button
      type="button"
      onClick={toggleBookmark}
      aria-pressed={bookmarked}
      className="tap inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-rule)] bg-[var(--color-paper)] px-3 py-1.5 text-xs font-medium text-[var(--color-ink)] hover:bg-[var(--color-paper-raised)]"
    >
      <span aria-hidden="true">{bookmarked ? '★' : '☆'}</span>
      <span>{bookmarked ? 'Saved on this device' : 'Save for later'}</span>
    </button>
  );
}

