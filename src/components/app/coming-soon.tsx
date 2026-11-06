'use client';

import { useRouter } from 'next/navigation';
import { Sparkles } from 'lucide-react';
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
    >
      <div className="w-full max-w-sm space-y-4 rounded-2xl bg-[var(--color-paper)] p-6 text-center shadow-xl">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
          <Sparkles className="h-6 w-6" aria-hidden="true" />
        </div>
        <h2 id="coming-soon-title" className="font-serif text-xl font-semibold text-[var(--color-ink)]">
          {title}
        </h2>
        <p className="text-sm text-[var(--color-ink-muted)]">{message}</p>
        <Button variant="primary" fullWidth onClick={goBack} className="min-h-[44px]">
          Got it
        </Button>
      </div>
    </div>
  );
}
