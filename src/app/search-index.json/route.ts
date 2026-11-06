import { getSiteData, CLUSTER_LABELS } from '@/lib/content/site-data';

export const dynamic = 'force-static';

/** Static search index of pages in this build (production: published pages only). */
export function GET() {
  const { pages } = getSiteData();
  const entries = pages
    .filter((p) => !p.fm.noindex)
    .map((p) => ({
      url: p.url,
      title: p.fm.title,
      description: p.fm.meta_description,
      section: CLUSTER_LABELS[p.fm.cluster] ?? p.fm.cluster,
      keywords: [p.fm.primary_keyword, ...p.fm.secondary_keywords],
    }));
  return Response.json(entries, { headers: { 'X-Robots-Tag': 'noindex' } });
}
