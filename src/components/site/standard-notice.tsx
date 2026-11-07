import React from 'react';
import { Info } from 'lucide-react';
import { STANDARD_NOTICE } from '@/lib/site/notice';

/** Standard medical notice, shown near the top of every medical page. */
export function StandardNotice() {
  return (
    <div
      role="note"
      aria-label="Medical notice"
      className="my-4 flex items-start gap-3 rounded-2xl border border-[var(--color-rule)] border-l-4 border-l-[var(--color-accent)] bg-[var(--color-paper-raised)] p-4 text-sm leading-relaxed text-[var(--color-ink-muted)]"
    >
      <Info aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-accent)]" />
      <p>{STANDARD_NOTICE}</p>
    </div>
  );
}
