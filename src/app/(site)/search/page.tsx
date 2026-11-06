import type { Metadata } from 'next';
import { Suspense } from 'react';
import { buildMetadata } from '@/lib/seo/metadata';
import { SearchBox } from '@/components/site/search-box';

export const metadata: Metadata = buildMetadata({
  title: 'Search',
  description: 'Search perimenopause and menopause guides, symptom pages, treatment explainers and tools.',
  path: '/search/',
  // Internal search results are kept out of the index (AGENTS.md "Technical SEO").
  noindex: true,
});

export default function SearchPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-3xl sm:text-4xl">Search</h1>
      {/* Without JavaScript the form still submits; the results list needs JS. */}
      <Suspense fallback={null}>
        <SearchBox />
      </Suspense>
    </div>
  );
}
