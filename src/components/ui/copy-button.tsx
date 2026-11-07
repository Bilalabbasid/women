'use client';

import { useRef, useState } from 'react';

/**
 * Copies text (e.g. doctor questions) and confirms in place + to screen readers.
 * Pass `text`, or `targetId` to copy an element's text content.
 */
export function CopyButton({
  text,
  targetId,
  label = 'Copy questions',
  doneLabel = 'Copied',
  className = 'btn btn-secondary btn-sm',
}: {
  text?: string;
  targetId?: string;
  label?: string;
  doneLabel?: string;
  className?: string;
}) {
  const [state, setState] = useState<'idle' | 'done' | 'error'>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function copy() {
    const value =
      text ??
      (targetId
        ? Array.from(document.getElementById(targetId)?.querySelectorAll('li') ?? [])
            .map((li, i) => `${i + 1}. ${li.textContent?.trim() ?? ''}`)
            .join('\n') || (document.getElementById(targetId)?.textContent ?? '').trim()
        : '');
    try {
      await navigator.clipboard.writeText(value);
      setState('done');
    } catch {
      setState('error');
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setState('idle'), 2500);
  }

  return (
    <>
      <button type="button" className={className} onClick={copy}>
        {state === 'done' ? (
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12.5l4.5 4.5L19 7" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="9" y="9" width="11" height="11" rx="2" />
            <path d="M5 15V5a2 2 0 0 1 2-2h8" />
          </svg>
        )}
        {state === 'done' ? doneLabel : label}
      </button>
      <span role="status" className="visually-hidden">
        {state === 'done' ? 'Copied to your clipboard.' : state === 'error' ? 'Copy did not work. Select the text and copy it instead.' : ''}
      </span>
    </>
  );
}
