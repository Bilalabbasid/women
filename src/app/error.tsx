'use client';

import { useEffect } from 'react';

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
    <main id="main" className="mx-auto max-w-xl space-y-5 px-4 py-12">
      <h1 className="text-3xl">Something went wrong loading this page</h1>
      <p>Anything saved in your tracker is still on this device. Try again, or go back to the home page.</p>
      <p className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="tap rounded-xl bg-[var(--color-accent)] px-5 font-semibold text-white"
        >
          Try again
        </button>
        <a href="/" className="tap px-2 font-semibold text-[var(--color-link)] underline">
          Home
        </a>
      </p>
    </main>
  );
}
