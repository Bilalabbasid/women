'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

interface Entry {
  url: string;
  title: string;
  description: string;
  section: string;
  keywords: string[];
}

/**
 * Fast client-side search over a static index built from pages in this build.
 * The query never leaves the device: it filters a JSON file fetched once.
 */
export function SearchBox() {
  const params = useSearchParams();
  const [q, setQ] = useState(params.get('q') ?? '');
  const [index, setIndex] = useState<Entry[] | null>(null);

  useEffect(() => {
    fetch('/search-index.json')
      .then((r) => (r.ok ? r.json() : []))
      .then(setIndex)
      .catch(() => setIndex([]));
  }, []);

  const results = useMemo(() => {
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!index || terms.length === 0) return [];
    return index
      .map((e) => {
        const hay = `${e.title} ${e.description} ${e.keywords.join(' ')}`.toLowerCase();
        const title = e.title.toLowerCase();
        const score = terms.reduce((s, t) => s + (hay.includes(t) ? 1 : 0) + (title.includes(t) ? 2 : 0), 0);
        return { e, score, all: terms.every((t) => hay.includes(t)) };
      })
      .filter((x) => x.all)
      .sort((a, b) => b.score - a.score)
      .slice(0, 20)
      .map((x) => x.e);
  }, [q, index]);

  return (
    <div className="space-y-4">
      <form role="search" action="/search/" method="get" onSubmit={(e) => e.preventDefault()}>
        <label htmlFor="q" className="block font-semibold">
          Search the site
        </label>
        <input
          id="q"
          name="q"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoComplete="off"
          className="mt-1 min-h-[48px] w-full rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)] px-4 text-lg"
          placeholder="For example: night sweats, HRT patch"
        />
      </form>
      <p aria-live="polite" className="text-[var(--color-ink-muted)]">
        {q.trim() === '' ? '' : index === null ? 'Loading…' : `${results.length} result${results.length === 1 ? '' : 's'}`}
      </p>
      <ul className="space-y-4">
        {results.map((r) => (
          <li key={r.url}>
            <a href={r.url} className="text-xl font-semibold text-[var(--color-link)] underline">
              {r.title}
            </a>
            <p className="text-[var(--color-ink-muted)]">
              {r.section} · {r.description}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
