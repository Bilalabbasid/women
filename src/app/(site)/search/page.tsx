import type { Metadata } from 'next';
import { Suspense } from 'react';
import { buildMetadata } from '@/lib/seo/metadata';
import { SearchBox } from '@/components/site/search-box';
import { navHubs } from '@/lib/content/site-data';

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
        <header className="grid max-w-[42rem] gap-4">
          <h1 id="search-title" className="text-[length:var(--fs-h1)] leading-tight">
            What would you like to know?
          </h1>
          <form role="search" action="/search/" method="get">
            <label htmlFor="q-static" className="visually-hidden">
              Search MenoVerdict
            </label>
            <input id="q-static" name="q" type="search" className="input min-h-[64px] text-[1.25rem]" placeholder="What’s bothering you? e.g. hot at night" />
          </form>
        </header>
      }
    >
      <SearchBox suggestions={suggestions} />
    </Suspense>
  );
}
