'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

/**
 * Shown instead of a real page/feature for anything still waiting on a
 * dependency this build doesn't have yet (a connected database, an AI API
 * key, a payment processor). Never fakes the feature — no fake success
 * states, no fake pricing or Stripe prompts.
 *
 * Closing it goes back to whatever screen she was on before (browser
 * history), not forward into a half-built page. If there's no history to go
 * back to (she opened the URL directly, e.g. a typed-in membership link),
 * it falls back to fallbackHref instead of leaving her on a blank page.
 */
export function ComingSoon({
  title,
  message,
  fallbackHref = '/app/today/',
}: {
  title: string;
  message: string;
  fallbackHref?: string;
}) {
  const router = useRouter();

  const goBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="coming-soon-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-[var(--scrim)] sm:items-center sm:p-4"
    >
      <div className="w-full max-w-sm space-y-4 rounded-t-[var(--radius-lg)] border border-[var(--rule)] bg-[var(--paper-raised)] p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] text-center shadow-[var(--shadow-lift)] sm:rounded-[var(--radius-lg)] sm:pb-6">
        <svg viewBox="0 0 120 120" className="illo mx-auto h-20 w-20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="60" cy="60" r="50" className="i-fill" stroke="none" />
          <circle cx="60" cy="62" r="24" />
          <path d="M60 50v12l8 6" />
          <path d="M52 30h16" />
        </svg>
        <h2 id="coming-soon-title" className="font-serif text-[1.4rem] font-semibold">
          {title}
        </h2>
        <p className="text-[var(--ink-muted)]">{message}</p>
        <Button variant="primary" fullWidth onClick={goBack}>
          Got it
        </Button>
      </div>
    </div>
  );
}
