'use client';

import { useSearchParams } from 'next/navigation';
import { SearchCombobox } from './search-combobox';

/**
 * The /search page: the same private, typo-tolerant search as the header, with
 * more results. The query never leaves the device: it filters a JSON file
 * fetched once.
 */
export function SearchBox({ suggestions }: { suggestions: Array<{ href: string; label: string }> }) {
  const params = useSearchParams();
  const initial = params.get('q') ?? '';

  return (
    <div className="grid gap-10">
      <header className="grid max-w-[42rem] gap-4">
        <p className="kicker">Private search · your words never leave this device</p>
        <h1 id="search-title" className="text-[length:var(--fs-h1)] leading-tight">
          What would you like to know?
        </h1>
        <SearchCombobox initialQuery={initial} autoFocus={!initial} limit={30} size="lg" showAllLink={false} />
      </header>

      {suggestions.length > 0 && (
        <section aria-labelledby="browse-topics" className="grid gap-4">
          <h2 id="browse-topics" className="text-[length:var(--fs-h3)]">
            Or browse by topic
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {suggestions.map((s) => (
              <li key={s.href}>
                <a href={s.href} className="card flex items-center justify-between gap-3 font-bold">
                  {s.label}
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
