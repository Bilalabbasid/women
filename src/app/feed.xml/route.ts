import { getContent } from '@/lib/content/loader';
import { indexablePages } from '@/lib/content/gate';
import { SITE, absoluteUrl } from '@/lib/site/config';

export const dynamic = 'force-static';

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** RSS 2.0 feed of published pages, newest material change first. */
export function GET() {
  const pages = indexablePages(getContent())
    .map((p) => ({ p, date: p.fm.change_log.filter((c) => c.material).map((c) => c.date).sort().at(-1) ?? p.fm.updated_at }))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 50);

  const items = pages
    .map(
      ({ p, date }) => `    <item>
      <title>${esc(p.fm.title)}</title>
      <link>${esc(absoluteUrl(p.url))}</link>
      <guid isPermaLink="true">${esc(absoluteUrl(p.url))}</guid>
      <description>${esc(p.fm.meta_description)}</description>
      <pubDate>${new Date(`${date}T12:00:00Z`).toUTCString()}</pubDate>
    </item>`,
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${esc(SITE.name)}</title>
    <link>${esc(absoluteUrl('/'))}</link>
    <description>New and updated evidence-graded pages on perimenopause and menopause.</description>
    <language>en-us</language>
${items}
  </channel>
</rss>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}
