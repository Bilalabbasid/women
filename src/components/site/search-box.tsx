'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowRight, Search } from 'lucide-react';
import { HeroPanel, heroEyebrow, heroTitle } from './hero-panel';

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
export function SearchBox({ suggestions }: { suggestions: Array<{ href: string; label: string }> }) {
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

  const empty = q.trim() === '';

  return (
    <div className="space-y-8">
      <HeroPanel labelledBy="search-title">
        <div className="max-w-2xl space-y-5">
          <p className={heroEyebrow}>Private search · Your query never leaves this device</p>
          <h1 id="search-title" className={heroTitle}>
            Search
          </h1>
          <form role="search" action="/search/" method="get" onSubmit={(e) => e.preventDefault()}>
            <label htmlFor="q" className="sr-only">
              Search the site
            </label>
            <div className="flex items-center gap-2 rounded-2xl bg-[var(--paper-raised)] p-2 shadow-lg shadow-black/15">
              <Search aria-hidden="true" className="ml-2 h-5 w-5 shrink-0 text-[var(--color-ink-muted)]" />
              <input
                id="q"
                name="q"
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                autoComplete="off"
                className="min-h-[48px] w-full bg-transparent px-1 text-lg text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus:outline-hidden"
                placeholder="For example: night sweats, HRT patch"
              />
            </div>
          </form>
        </div>
      </HeroPanel>

      <p aria-live="polite" className="text-[var(--color-ink-muted)]">
        {empty ? '' : index === null ? 'Loading…' : `${results.length} result${results.length === 1 ? '' : 's'} for “${q.trim()}”`}
      </p>

      {!empty && results.length > 0 && (
        <ul className="space-y-3">
          {results.map((r) => (
            <li key={r.url}>
              <a
                href={r.url}
                className="card-live group flex items-start justify-between gap-4 rounded-2xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)] p-4 no-underline shadow-xs transition hover:-translate-y-0.5 hover:border-[var(--color-accent)] hover:shadow-md sm:p-5"
              >
                <span className="min-w-0 space-y-1">
                  <span className="inline-block rounded-full bg-[var(--color-accent-soft)] px-2.5 py-0.5 text-xs font-semibold text-[var(--color-accent)]">
                    {r.section}
                  </span>
                  <span className="block text-lg font-semibold leading-snug text-[var(--color-link)] group-hover:underline">
                    {r.title}
                  </span>
                  <span className="block text-sm leading-relaxed text-[var(--color-ink-muted)]">{r.description}</span>
                </span>
                <ArrowRight
                  aria-hidden="true"
                  className="mt-1 h-5 w-5 shrink-0 text-[var(--color-ink-muted)] transition-transform group-hover:translate-x-1 group-hover:text-[var(--color-accent)]"
                />
              </a>
            </li>
          ))}
        </ul>
      )}

      {(empty || (index !== null && results.length === 0)) && suggestions.length > 0 && (
        <section aria-labelledby="browse-topics" className="space-y-4">
          <h2 id="browse-topics" className="font-serif text-2xl font-semibold">
            {empty ? 'Or browse by topic' : 'Nothing matched. Try browsing by topic'}
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {suggestions.map((s) => (
              <li key={s.href}>
                <a
                  href={s.href}
                  className="card-live tap group flex h-full w-full items-center justify-between gap-3 rounded-2xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)] p-4 font-semibold text-[var(--color-ink)] no-underline shadow-xs transition hover:-translate-y-0.5 hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] hover:shadow-md"
                >
                  {s.label}
                  <ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1" />
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
