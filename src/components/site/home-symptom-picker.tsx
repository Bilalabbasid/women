'use client';

import { useId, useState } from 'react';
import Link from 'next/link';

export interface PickerChip {
  id: string;
  label: string;
  /** Guides for this feeling, most relevant first. Only pages that exist in this build. */
  guides: Array<{ href: string; title: string }>;
}

/**
 * "Tap what you're feeling": everyday phrasings that narrow to matching guides
 * instantly, on the page. Several can be chosen; guides that match more of them
 * come first. Links are resolved on the server, so they always exist.
 */
export function HomeSymptomPicker({ chips }: { chips: PickerChip[] }) {
  const [on, setOn] = useState<string[]>([]);
  const resultsId = useId();

  const toggle = (id: string) => setOn((xs) => (xs.includes(id) ? xs.filter((x) => x !== id) : [...xs, id]));

  // Rank guides by how many chosen feelings they match, then by their order within each chip.
  const scores = new Map<string, { href: string; title: string; score: number; order: number }>();
  for (const c of chips) {
    if (!on.includes(c.id)) continue;
    c.guides.forEach((g, i) => {
      const prev = scores.get(g.href);
      if (prev) prev.score += 1;
      else scores.set(g.href, { ...g, score: 1, order: on.indexOf(c.id) * 10 + i });
    });
  }
  const results = [...scores.values()].sort((a, b) => b.score - a.score || a.order - b.order).slice(0, 6);
  const chosen = chips.filter((c) => on.includes(c.id)).map((c) => c.label.toLowerCase());

  return (
    <fieldset className="min-w-0 border-0 p-0">
      <legend className="mb-2.5 text-[1.0625rem] font-bold">Tap what you&rsquo;re feeling</legend>
      <div className="chip-row" role="group" aria-controls={resultsId}>
        {chips.map((c) => (
          <button key={c.id} type="button" className="chip" aria-pressed={on.includes(c.id)} onClick={() => toggle(c.id)}>
            {c.label}
          </button>
        ))}
      </div>

      <div id={resultsId} aria-live="polite" className="mt-3">
        {results.length > 0 && (
          <div className="rounded-[var(--radius-lg)] border border-[var(--rule)] bg-[var(--paper-raised)] p-3 sm:p-4">
            <p className="flex flex-wrap items-baseline justify-between gap-x-3 px-1 text-[1rem] text-[var(--ink-muted)]">
              <span>
                <strong className="text-[var(--ink)]">
                  {results.length} {results.length === 1 ? 'guide' : 'guides'}
                </strong>{' '}
                for {chosen.length > 2 ? `${chosen.length} things` : chosen.join(' and ')}
              </span>
              <button type="button" className="btn btn-quiet btn-sm -mr-2" onClick={() => setOn([])}>
                Clear
              </button>
            </p>
            <ul className="mt-1 grid gap-1 sm:grid-cols-2">
              {results.map((g) => (
                <li key={g.href}>
                  <Link
                    href={g.href}
                    className="flex min-h-12 items-center justify-between gap-3 rounded-[var(--radius)] px-2 py-2 font-bold text-[var(--link)] no-underline hover:bg-[var(--accent-soft)]"
                  >
                    <span>{g.title}</span>
                    <span aria-hidden="true" className="text-[var(--ink-muted)]">
                      →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </fieldset>
  );
}
