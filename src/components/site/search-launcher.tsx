'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRef, useState } from 'react';

// The search UI and engine load only when she first opens search.
const SearchCombobox = dynamic(() => import('./search-combobox').then((m) => m.SearchCombobox), {
  ssr: false,
  loading: () => <p className="px-1 py-3 text-[var(--ink-muted)]">Loading search…</p>,
});

/**
 * Header search: a real link to /search/ (works without JavaScript) that opens
 * an overlay with instant results when JavaScript is available.
 */
export function SearchLauncher({ label = false, className = 'icon-btn' }: { label?: boolean; className?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [opened, setOpened] = useState(false);
  const close = () => ref.current?.close();

  return (
    <>
      <Link
        href="/search/"
        className={className}
        aria-label={label ? undefined : 'Search'}
        aria-haspopup="dialog"
        onClick={(e) => {
          if (e.metaKey || e.ctrlKey || e.shiftKey) return;
          e.preventDefault();
          setOpened(true);
          ref.current?.showModal();
        }}
      >
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        {label && <span>Search</span>}
      </Link>
      <dialog
        ref={ref}
        className="sheet search-sheet"
        aria-label="Search"
        onClick={(e) => {
          if (e.target === ref.current) close();
        }}
      >
        <div className="search-sheet-head">
          <p className="sheet-title">Search</p>
          <button type="button" className="icon-btn" onClick={close} aria-label="Close search">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <div className="search-sheet-body">
          {opened && <SearchCombobox autoFocus onEscape={close} onNavigate={close} />}
        </div>
      </dialog>
    </>
  );
}
