import type { Metadata } from 'next';
import { Suspense } from 'react';
import { buildMetadata } from '@/lib/seo/metadata';
import { SearchBox } from '@/components/site/search-box';
import { navHubs } from '@/lib/content/site-data';
import { HeroPanel, heroTitle } from '@/components/site/hero-panel';

export const metadata: Metadata = buildMetadata({
  title: 'Search',
  description: 'Search perimenopause and menopause guides, symptom pages, treatment explainers and tools.',
  path: '/search/',
  // Internal search results are kept out of the index (AGENTS.md "Technical SEO").
  noindex: true,
});

export default function SearchPage() {
  // Only hubs that exist in this build, plus the code-defined tools page.
  const suggestions = [...navHubs(), { href: '/tools/', label: 'Tools' }];
  return (
    // Without JavaScript the form still submits; the results list needs JS.
    <Suspense
      fallback={
        <HeroPanel labelledBy="search-title">
          <div className="max-w-2xl space-y-5">
            <h1 id="search-title" className={heroTitle}>
              Search
            </h1>
            <form role="search" action="/search/" method="get">
              <label htmlFor="q-static" className="sr-only">
                Search the site
              </label>
              <input
                id="q-static"
                name="q"
                type="search"
                className="min-h-[56px] w-full rounded-2xl bg-[var(--paper-raised)] px-4 text-lg text-[var(--color-ink)] shadow-lg shadow-black/15"
                placeholder="For example: night sweats, HRT patch"
              />
            </form>
          </div>
        </HeroPanel>
      }
    >
      <SearchBox suggestions={suggestions} />
    </Suspense>
  );
}
