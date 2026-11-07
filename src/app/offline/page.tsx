import type { Metadata } from 'next';
import Link from 'next/link';
import { APP_ROUTES } from '@/lib/routes';
import { isToolLive } from '@/lib/tools/logic';

export const metadata: Metadata = {
  title: 'You’re offline',
  robots: { index: false, follow: false },
};

/** Fallback the service worker shows when a page isn't saved on this device. Plain HTML, no JavaScript needed. */
export default function OfflinePage() {
  const tracker = isToolLive('symptom-tracker');
  return (
    <main id="main" className="wrap max-w-[38rem] space-y-6 py-14">
      <svg viewBox="0 0 120 120" className="illo h-24 w-24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
        <circle cx="60" cy="60" r="50" className="i-fill" stroke="none" />
        <path d="M30 52a42 42 0 0 1 60 0M40 63a28 28 0 0 1 40 0M50 74a14 14 0 0 1 20 0" />
        <circle cx="60" cy="84" r="3.5" fill="currentColor" stroke="none" />
        <path d="M34 34l52 52" />
      </svg>
      <div>
        <h1 className="text-[length:var(--fs-h1)] leading-[1.1]">You&apos;re offline</h1>
        <p className="mt-3 text-[length:var(--fs-lead)] text-[var(--ink-muted)]">
          This page isn&apos;t saved on this device yet. Pages you&apos;ve opened before may still be available.
        </p>
      </div>

      <ul className="row-list" role="list">
        <li>
          <Link href="/app/saved/" className="row">
            <span className="row-main">
              <span className="row-title block">Your saved pages</span>
              <span className="row-meta block">Guides you saved for later are kept on this device.</span>
            </span>
            <span aria-hidden="true">→</span>
          </Link>
        </li>
        {tracker && (
          <li>
            <Link href={APP_ROUTES.today} className="row">
              <span className="row-main">
                <span className="row-title block">Open the tracker</span>
                <span className="row-meta block">Logging, your timeline and your doctor report all work without a connection.</span>
              </span>
              <span aria-hidden="true">→</span>
            </Link>
          </li>
        )}
      </ul>

      {tracker && (
        <p className="notice-line">
          Entries are saved in this browser on this device. To keep a copy somewhere else, use Export on the tracker&apos;s
          Privacy screen: if you clear your browser data, those entries are deleted.
        </p>
      )}
    </main>
  );
}
