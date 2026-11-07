'use client';

import React, { useSyncExternalStore } from 'react';
import Link from 'next/link';
import { AppHeader } from '@/components/app/app-header';
import { readSavedPages, removeSavedPage, subscribeSavedPages, type SavedPage } from '@/lib/saved-pages';

const EMPTY: SavedPage[] = [];
let cache: { raw: string; list: SavedPage[] } = { raw: '', list: EMPTY };

// useSyncExternalStore needs a stable snapshot between changes.
function snapshot(): SavedPage[] {
  const list = readSavedPages();
  const raw = JSON.stringify(list);
  if (raw !== cache.raw) cache = { raw, list };
  return cache.list;
}

function savedOn(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export default function SavedPagesPage() {
  const pages = useSyncExternalStore(subscribeSavedPages, snapshot, () => EMPTY);
  const newestFirst = [...pages].reverse();

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader title="Saved pages" subtitle="Kept on this device" showBack backHref="/app/today/" />
      <div className="mx-auto w-full max-w-2xl flex-1 space-y-4 px-4 py-5">
        <p className="text-[var(--color-ink-muted)]">
          Pages you saved with &ldquo;Save for later&rdquo;. The list is kept only in this browser, and saved pages can
          be opened without a connection once the app is installed or the page has loaded once.
        </p>

        {newestFirst.length === 0 ? (
          <p className="rounded-2xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)] p-4">
            Nothing saved yet. Press &ldquo;Save for later&rdquo; on any guide to keep it here.
          </p>
        ) : (
          <ul className="space-y-3">
            {newestFirst.map((p) => (
              <li
                key={p.url}
                className="flex items-start justify-between gap-3 rounded-2xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)] p-4"
              >
                <div>
                  <Link href={p.url} className="font-semibold text-[var(--color-link)] underline">
                    {p.title || p.url}
                  </Link>
                  {savedOn(p.savedAt) && (
                    <p className="mt-0.5 text-sm text-[var(--color-ink-muted)]">Saved {savedOn(p.savedAt)}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeSavedPage(p.url)}
                  className="tap shrink-0 px-2 text-sm font-semibold text-[var(--color-ink-muted)] underline"
                  aria-label={`Remove ${p.title || p.url} from saved pages`}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
