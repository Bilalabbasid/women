'use client';

import { useEffect } from 'react';
import Link from 'next/link';

/**
 * Root error boundary. It loads on every page, so it uses no icon library or
 * UI kit, to keep article JavaScript small.
 */
export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Log only the opaque digest: error messages could echo what was typed (privacy rule 9).
    console.error('[app error]', error.digest ?? '');
  }, [error]);

  return (
    <main id="main" className="wrap max-w-[38rem] space-y-6 py-14">
      <div className="error-state p-5 sm:p-6">
        <h1 className="font-serif text-[length:var(--fs-h2)] leading-tight text-[var(--ink)]">Something went wrong loading this page</h1>
        <p>Anything saved in your tracker is still on this device. Try again, or go back to the home page.</p>
      </div>
      <p className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => reset()} className="btn btn-primary">
          Try again
        </button>
        <Link href="/" className="btn btn-quiet">
          Home
        </Link>
      </p>
    </main>
  );
}
