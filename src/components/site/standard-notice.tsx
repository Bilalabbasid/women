import React from 'react';

/**
 * Standard medical notice required near the top of every medical article
 * and in the footer (Prompt 2).
 */
export function StandardNotice() {
  return (
    <div
      role="note"
      aria-label="Medical disclaimer"
      className="my-4 rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)] p-4 text-xs leading-relaxed text-[var(--color-ink-muted)]"
    >
      <p>
        <strong>Notice:</strong> General information based on published sources and the symptoms you searched for.
        This isn&apos;t medical or legal advice, a diagnosis or a treatment plan. We aren&apos;t doctors, and this
        content wasn&apos;t written by a doctor. Please consult a doctor about your own symptoms. If your symptoms
        are severe or sudden, seek urgent care.
      </p>
    </div>
  );
}

