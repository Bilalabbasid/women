'use client';

import { useSyncExternalStore } from 'react';
import Link from 'next/link';
import { AppHeader } from '@/components/app/app-header';
import { AppPage, Icon } from '@/components/app/kit';
import { IlloEmpty } from '@/components/ui/illustrations';
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
      <AppPage>
        <p className="text-[var(--ink-muted)]">
          Pages you saved with &ldquo;Save for later&rdquo;. The list is kept only in this browser, and saved pages can be
          opened without a connection once the app is installed or the page has loaded once.
        </p>

        {newestFirst.length === 0 ? (
          <div className="empty-state">
            <IlloEmpty />
            <strong>Nothing saved yet</strong>
            <span>Press &ldquo;Save for later&rdquo; on any guide to keep it here, ready to read offline.</span>
            <Link href="/symptoms/" className="btn btn-primary btn-sm mt-1">
              Browse symptom guides
            </Link>
          </div>
        ) : (
          <>
            <p className="font-bold">
              {newestFirst.length} saved {newestFirst.length === 1 ? 'page' : 'pages'}
            </p>
            <ul className="row-list">
              {newestFirst.map((p) => (
                <li key={p.url} className="flex items-center">
                  <Link href={p.url} className="row min-w-0 flex-1">
                    <span className="row-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
                        <path d="M6 3.5h12v17l-6-4-6 4z" />
                      </svg>
                    </span>
                    <span className="row-main">
                      <span className="row-title block">{p.title || p.url}</span>
                      {savedOn(p.savedAt) && <span className="row-meta block">Saved {savedOn(p.savedAt)}</span>}
                    </span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => removeSavedPage(p.url)}
                    className="icon-btn mr-2 shrink-0 text-[var(--ink-muted)]"
                    aria-label={`Remove ${p.title || p.url} from saved pages`}
                  >
                    <Icon.Close width={20} height={20} />
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </AppPage>
    </div>
  );
}
