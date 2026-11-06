import React from 'react';
import { STANDARD_NOTICE } from '@/lib/site/notice';

/** Standard medical notice, shown near the top of every medical page. */
export function StandardNotice() {
  return (
    <div
      role="note"
      aria-label="Medical notice"
      className="my-4 rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)] p-4 text-xs leading-relaxed text-[var(--color-ink-muted)]"
    >
      <p>{STANDARD_NOTICE}</p>
    </div>
  );
}
