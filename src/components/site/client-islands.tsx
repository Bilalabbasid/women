'use client';

import { useEffect, useState } from 'react';

/**
 * Small client islands for article pages. Each is a few hundred bytes and only
 * renders when its page needs it, keeping article JavaScript minimal.
 */

/** Copy and print controls for :::questions blocks. Reads the rendered list from the DOM. */
export function QuestionTools() {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    const items = Array.from(document.querySelectorAll('[data-questions="true"] li')).map(
      (li, i) => `${i + 1}. ${li.textContent?.trim() ?? ''}`,
    );
    try {
      await navigator.clipboard.writeText(items.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };
  return (
    <div className="no-print flex flex-wrap gap-3">
      <button
        type="button"
        onClick={copy}
        className="tap rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)] px-4 font-semibold"
      >
        {copied ? 'Copied' : 'Copy questions'}
      </button>
      <button
        type="button"
        onClick={() => window.print()}
        className="tap rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)] px-4 font-semibold"
      >
        Print this page
      </button>
      <span aria-live="polite" className="sr-only">
        {copied ? 'Questions copied to clipboard' : ''}
      </span>
    </div>
  );
}

/**
 * When the service worker serves this page from its offline cache, it marks
 * <html data-sw-cached-at="ISO">. This shows a warning that medical guidance
 * may have changed since the copy was saved (AGENTS.md "PWA").
 */
export function SavedCopyNotice({ reviewedAt, isMedical }: { reviewedAt: string | null; isMedical: boolean }) {
  const [savedAt, setSavedAt] = useState<string | null>(null);
  useEffect(() => {
    const v = document.documentElement.dataset.swCachedAt;
    // Reading a DOM attribute set by the service worker; runs once after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (v) setSavedAt(v);
  }, []);
  if (!savedAt) return null;
  const saved = new Date(savedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  return (
    <div role="status" className="rounded-xl border-2 border-[var(--color-draft)] bg-[var(--color-draft-soft)] p-4">
      <p className="font-semibold">You&apos;re reading a copy saved on this device on {saved}.</p>
      <p>
        {isMedical
          ? `It may be out of date. ${reviewedAt ? `Its medical content was last reviewed on ${reviewedAt}. ` : ''}Reconnect to check for the latest version before relying on it.`
          : 'Reconnect to check for the latest version.'}
      </p>
    </div>
  );
}
