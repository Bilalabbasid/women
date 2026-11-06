import { getContent } from '@/lib/content/loader';
import { indexablePages } from '@/lib/content/gate';

export const dynamic = 'force-static';

/**
 * Machine-readable source registry (AGENTS.md "Add ... a machine-readable
 * sources page"). Lists every registered source and which published pages cite it.
 */
export function GET() {
  const store = getContent();
  const published = indexablePages(store);
  const sources = [...store.sources.values()].map((s) => ({
    ...s,
    cited_by: published.filter((p) => p.fm.sources.includes(s.id)).map((p) => p.url),
  }));
  return Response.json({ generated_from: 'content/_sources/sources.yaml', count: sources.length, sources });
}
