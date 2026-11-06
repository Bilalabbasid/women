import type { Metadata } from 'next';
import Link from 'next/link';
import { APP_ROUTES } from '@/lib/routes';
import { isToolLive } from '@/lib/tools/logic';

export const metadata: Metadata = {
  title: 'You’re offline',
  robots: { index: false, follow: false },
};

/** Fallback the service worker shows when a page isn't saved on this device. */
export default function OfflinePage() {
  return (
    <main id="main" className="mx-auto max-w-xl space-y-5 px-4 py-12">
      <h1 className="text-3xl">You&apos;re offline</h1>
      <p>This page isn&apos;t saved on this device yet. Pages you&apos;ve opened before may still be available.</p>
      {isToolLive('symptom-tracker') && (
      <p>
        Your symptom tracker works without a connection. Entries are saved in this browser on this device.
        To keep a copy somewhere else, use Export on the tracker&apos;s Privacy screen: if you clear your
        browser data, those entries are deleted.
      </p>
      )}
      {isToolLive('symptom-tracker') && (
      <p>
        <Link
          href={APP_ROUTES.today}
          className="tap rounded-xl bg-[var(--color-accent)] px-5 font-semibold text-white no-underline"
        >
          Open the tracker
        </Link>
      </p>
      )}
    </main>
  );
}
