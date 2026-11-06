'use client';

import React, { useState, useEffect } from 'react';
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

export function BookmarkButton({ url, title }: { url: string; title: string }) {
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('menowell_bookmarks') || '[]');
      setBookmarked(saved.some((b: { url: string }) => b.url === url));
    } catch {
      // Local storage unavailable
    }
  }, [url]);

  const toggleBookmark = () => {
    try {
      const saved = JSON.parse(localStorage.getItem('menowell_bookmarks') || '[]');
      if (bookmarked) {
        const filtered = saved.filter((b: { url: string }) => b.url !== url);
        localStorage.setItem('menowell_bookmarks', JSON.stringify(filtered));
        setBookmarked(false);
      } else {
        saved.push({ url, title, savedAt: new Date().toISOString() });
        localStorage.setItem('menowell_bookmarks', JSON.stringify(saved));
        setBookmarked(true);
      }
    } catch {
      // ignore
    }
  };

  return (
    <button
      type="button"
      onClick={toggleBookmark}
      aria-label={bookmarked ? 'Remove bookmark from this device' : 'Save reading to this device'}
      className="tap inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-rule)] bg-[var(--color-paper)] px-3 py-1.5 text-xs font-medium text-[var(--color-ink)] hover:bg-[var(--color-paper-raised)]"
    >
      <span>{bookmarked ? '★ Saved on this device' : '☆ Save for later'}</span>
    </button>
  );
}

