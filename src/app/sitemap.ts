import type { MetadataRoute } from 'next';
import { getContent } from '@/lib/content/loader';
import { indexablePages } from '@/lib/content/gate';
import { SITE, absoluteUrl, isIndexable } from '@/lib/site/config';

export const dynamic = 'force-static';

/**
 * Only published, indexable, canonical pages. lastmod comes from the date of
 * the latest *material* change in the change log, not from build time.
 * Non-production builds publish an empty sitemap.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  if (!isIndexable(SITE.env)) return [];
  const store = getContent();
  const pages = indexablePages(store);
  const contentEntries = pages.map((p) => {
    const material = p.fm.change_log.filter((c) => c.material).map((c) => c.date).sort();
    return { url: absoluteUrl(p.url), lastModified: material.at(-1) ?? p.fm.updated_at };
  });
  const latestContentDate = contentEntries.map((e) => e.lastModified).sort().at(-1) ?? '2026-11-06';
  const staticEntries = [
    '/',
    '/tools/',
    '/urgent-help/',
    '/shop/menopause-symptom-journal/',
    '/refund-policy/',
  ].map((path) => ({
    url: absoluteUrl(path),
    lastModified: latestContentDate,
  }));
  return [...staticEntries, ...contentEntries];
}
