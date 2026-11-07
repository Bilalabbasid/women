import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getSiteData } from '@/lib/content/site-data';
import { lastCheckedDate } from '@/lib/content/schema';
import { GradeExplainers } from '@/components/ui/grade';
import { BetterEvidenceCards, VerdictHero, verdictData } from '@/components/site/verdict-hero';

export const metadata: Metadata = { title: 'Verdict preview', robots: { index: false, follow: false } };

/** Dev-only preview of the verdict template with real data (until it is wired into [...slug]). */
export default async function VerdictPreview({ searchParams }: { searchParams: Promise<{ p?: string }> }) {
  const { p } = await searchParams;
  const url = `/does-it-work/${p && /^[a-z0-9-]+$/.test(p) ? p : 'black-cohosh'}/`;
  const { byUrl } = getSiteData();
  const page = byUrl.get(url);
  if (!page) notFound();
  const v = verdictData({
    url,
    title: page.fm.title,
    grade: page.fm.evidence_grade ?? null,
    body: page.body,
    metaDescription: page.fm.meta_description,
    lastChecked: lastCheckedDate(page.fm),
  });
  return (
    <main id="main" className="wrap py-10">
      <VerdictHero {...v} sourceCount={page.fm.sources.length} />
      {v.entry && <BetterEvidenceCards entry={v.entry} isLive={(u) => byUrl.has(u)} />}
      <GradeExplainers />
    </main>
  );
}
