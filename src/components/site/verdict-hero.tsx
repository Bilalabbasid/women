import Link from 'next/link';
import type { EvidenceGrade } from '@/lib/content/schema';
import { GRADE_REGISTRY, gradeForPage, type GradeEntry } from '@/lib/grades/registry';
import { formatCheckedDate } from '@/lib/site/honesty';
import { GradeMeter } from '@/components/ui/grade';
import '@/app/styles/verdict.css';

/*
 * "Does it work?" verdict hero + "What has better evidence instead" cards.
 *
 * WIRING (main session, src/app/(site)/[...slug]/page.tsx), for fm.page_type === 'does_it_work'
 * and page.url !== '/does-it-work/' (the directory index):
 *
 *   import { VerdictHero, BetterEvidenceCards, verdictData } from '@/components/site/verdict-hero';
 *
 *   const verdict = fm.page_type === 'does_it_work' && page.url !== '/does-it-work/'
 *     ? verdictData({ url: page.url, title: fm.title, grade: fm.evidence_grade ?? null,
 *                     body: page.body, metaDescription: fm.meta_description, lastChecked: checkedIso })
 *     : null;
 *
 *   // In place of <ArticleHero …/> when `verdict` is set:
 *   <VerdictHero {...verdict} sourceCount={citationIds.length} />
 *
 *   // The page body opens with the same "**Our verdict: …**" line the hero shows. Add
 *   // className "verdict-body" to the FIRST prose part (instead of "lead-answer") and that
 *   // duplicate bold-only first paragraph is hidden (styles/verdict.css). Only a paragraph
 *   // that is entirely bold is hidden, so pages without the line are untouched.
 *
 *   // After the body, before <NextSteps />, when verdict.entry exists:
 *   {verdict?.entry && <BetterEvidenceCards entry={verdict.entry} isLive={(u) => byUrl.has(u)} />}
 *
 * Data sources: remedy/use/grade/last_checked come from the grade registry entry that names
 * this page (content/_grades/grades.json → gradeForPage). Pages without one fall back to the
 * page title, its frontmatter evidence_grade and lastCheckedDate(fm). The one-sentence
 * verdict is the page's own opening "**Our verdict: …**" line; if a page has none, its
 * meta_description is used. Nothing here writes new medical claims.
 */

export interface VerdictData {
  remedy: string;
  /** e.g. "hot flashes"; rendered as "for hot flashes". Null when unknown. */
  use: string | null;
  grade: EvidenceGrade | null;
  verdict: string;
  lastChecked: string;
  /** The registry entry, for BetterEvidenceCards. */
  entry: GradeEntry | null;
}

/** "**Our verdict: Not supported by clinical guidelines for hot flashes.**" → the sentence after the colon. */
export function extractVerdict(body: string): string | null {
  const m = body.match(/^\s*\*\*Our verdict:\s*([\s\S]+?)\*\*\s*$/m);
  if (!m) return null;
  const s = m[1].replace(/\s+/g, ' ').trim();
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : null;
}

export function verdictData({
  url,
  title,
  grade,
  body,
  metaDescription,
  lastChecked,
}: {
  url: string;
  title: string;
  grade: EvidenceGrade | null;
  body: string;
  metaDescription: string;
  lastChecked: string;
}): VerdictData {
  const entry = gradeForPage(url) ?? null;
  return {
    remedy: entry?.treatment ?? title,
    use: entry?.use ?? null,
    grade: entry?.grade ?? grade,
    verdict: extractVerdict(body) ?? metaDescription,
    lastChecked: entry?.last_checked ?? lastChecked,
    entry,
  };
}

export function VerdictHero({
  remedy,
  use,
  grade,
  verdict,
  lastChecked,
  sourceCount,
}: Omit<VerdictData, 'entry'> & { entry?: GradeEntry | null; sourceCount: number }) {
  return (
    <header className="verdict-hero">
      <div className="reading-progress" aria-hidden="true" />
      <p className="kicker">Does it work? · Evidence verdict</p>
      <h1 className="verdict-remedy">
        {remedy}
        {use && <span className="verdict-use"> for {use}</span>}
      </h1>

      <div className={`verdict-card${grade ? ` g-${grade}` : ''}`}>
        {grade && grade !== 'per_option' && (
          <div className="verdict-meter">
            <p className="eyebrow mb-2">Our grade</p>
            <GradeMeter grade={grade} size="lg" use={use ? `for ${use}` : undefined} showScale />
          </div>
        )}
        <div className="verdict-say">
          <p className="eyebrow mb-1.5">In one sentence</p>
          <p className="verdict-sentence">{verdict}</p>
          <p className="verdict-meta">
            Last checked <time dateTime={lastChecked}>{formatCheckedDate(lastChecked)}</time>
            {sourceCount > 0 && (
              <>
                {' · '}
                <a href="#references" className="link">
                  {sourceCount} {sourceCount === 1 ? 'source' : 'sources'}
                </a>
              </>
            )}
          </p>
        </div>
      </div>
    </header>
  );
}

const RANK: Record<EvidenceGrade, number> = {
  harm_concern: 0,
  not_supported: 1,
  comfort_only: 1,
  per_option: 1,
  limited: 2,
  moderate: 3,
  strong: 4,
};

const norm = (s: string) => s.toLowerCase().replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim();

/** Registry entries for the same use with a better grade, that have their own live page. */
export function betterEvidenceFor(entry: GradeEntry, isLive: (url: string) => boolean = () => true, limit = 4): GradeEntry[] {
  const use = norm(entry.use);
  return GRADE_REGISTRY.filter((o) => {
    if (o.id === entry.id || RANK[o.grade] <= RANK[entry.grade]) return false;
    const u = norm(o.use);
    if (!(u.includes(use) || use.includes(u))) return false;
    return (o.pages ?? []).some(isLive);
  })
    .sort((a, b) => RANK[b.grade] - RANK[a.grade] || a.treatment.localeCompare(b.treatment))
    .slice(0, limit);
}

/** "What has better evidence instead": tappable cards, each with its grade. Renders nothing if none. */
export function BetterEvidenceCards({
  entry,
  isLive = () => true,
  headingLevel = 2,
}: {
  entry: GradeEntry;
  isLive?: (url: string) => boolean;
  headingLevel?: 2 | 3;
}) {
  const better = betterEvidenceFor(entry, isLive);
  if (better.length === 0) return null;
  const H = `h${headingLevel}` as 'h2';
  return (
    <section aria-labelledby="better-evidence" className="better-evidence no-print">
      <p className="kicker">For {entry.use}</p>
      <H id="better-evidence" className="mt-1 text-[length:var(--fs-h3)]">
        What has better evidence instead
      </H>
      <ul className="better-grid">
        {better.map((o) => {
          const href = (o.pages ?? []).find(isLive)!;
          return (
            <li key={o.id}>
              <Link href={href} className="card better-card">
                <span className="better-name">{o.treatment}</span>
                <span className="better-use">for {o.use}</span>
                <GradeMeter grade={o.grade} explain={false} use={`for ${o.use}`} />
                <span className="link link-arrow mt-auto">Read the evidence</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
