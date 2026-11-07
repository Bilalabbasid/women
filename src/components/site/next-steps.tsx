'use client';

import React, { useSyncExternalStore } from 'react';
import Link from 'next/link';
import { readSavedPages, removeSavedPage, savePage, subscribeSavedPages } from '@/lib/saved-pages';

interface NextStepsProps {
  trackingUrl?: string;
  trackingLabel?: string;
  doctorUrl?: string;
  doctorLabel?: string;
  treatmentUrl?: string;
  treatmentLabel?: string;
}

/**
 * End-of-article next steps: one thing to read, one tool, one way to prepare
 * for the doctor. Three clear cards, each a single tap.
 */
export function NextSteps({
  trackingUrl = '/tools/symptoms-checklist/',
  trackingLabel = 'Try the symptoms checklist',
  doctorUrl = '/tools/treatment-questions/',
  doctorLabel = 'Build your doctor questions',
  treatmentUrl = '/treatments/',
  treatmentLabel = 'See treatments, graded',
}: NextStepsProps) {
  const steps = [
    {
      kicker: 'Not sure it fits?',
      body: 'Tick what you’ve noticed and see which guides match. It stays on your device.',
      href: trackingUrl,
      label: trackingLabel,
      icon: (
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="4" y="3.5" width="16" height="17" rx="2.5" />
          <path d="M8 9l1.6 1.6L12.5 7.5M8 15.5l1.6 1.6 2.9-3.1M15 9.5h2M15 16h2" />
        </svg>
      ),
    },
    {
      kicker: 'Seeing a doctor soon?',
      body: 'Pick the questions that matter to you and print them for the appointment.',
      href: doctorUrl,
      label: doctorLabel,
      icon: (
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 5h16v11H9l-5 4V5Z" />
          <path d="M9.5 9.2a2.5 2.5 0 1 1 3.2 2.4c-.5.2-.7.6-.7 1v.2" />
        </svg>
      ),
    },
    {
      kicker: 'Weighing your options?',
      body: 'Every treatment with its evidence grade, from strong to not supported.',
      href: treatmentUrl,
      label: treatmentLabel,
      icon: (
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" aria-hidden="true">
          <path d="M5 20v-6M10 20V9M15 20v-9M20 20V5" />
        </svg>
      ),
    },
  ];
  return (
    <section aria-labelledby="next-steps-heading" className="no-print my-10 border-t border-[var(--rule)] pt-8">
      <p className="kicker">What to do next</p>
      <h2 id="next-steps-heading" className="mt-1 text-[length:var(--fs-h3)]">
        Where are you right now?
      </h2>
      <ul className="mt-5 grid gap-3 sm:grid-cols-3">
        {steps.map((s) => (
          <li key={s.href}>
            <Link href={s.href} className="card grid h-full content-start gap-2">
              <span className="row-icon" aria-hidden="true">
                {s.icon}
              </span>
              <span className="mt-1 font-bold">{s.kicker}</span>
              <span className="text-[1.0625rem] leading-snug text-[var(--ink-muted)]">{s.body}</span>
              <span className="link link-arrow mt-1">{s.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * "Save for later" for an article, kept in this browser. Read through
 * useSyncExternalStore so the server render and the first client render agree
 * (both "not saved"), then it switches to the saved state without a hydration error.
 */
export function BookmarkButton({ url, title }: { url: string; title: string }) {
  const bookmarked = useSyncExternalStore(
    subscribeSavedPages,
    () => readSavedPages().some((b) => b.url === url),
    () => false,
  );

  const toggleBookmark = () => {
    try {
      if (bookmarked) removeSavedPage(url);
      else savePage(url, title);
    } catch {
      // Storage blocked or full: the button simply doesn't change.
    }
  };

  return (
    <button type="button" onClick={toggleBookmark} aria-pressed={bookmarked} className="btn btn-secondary btn-sm no-print">
      <svg viewBox="0 0 24 24" width="18" height="18" fill={bookmarked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 3.5h12v17l-6-4-6 4z" />
      </svg>
      <span>{bookmarked ? 'Saved' : 'Save for later'}</span>
    </button>
  );
}
