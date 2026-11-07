import Link from 'next/link';
import type { ContentPage } from '@/lib/content/loader';
import type { EvidenceGrade } from '@/lib/content/schema';
import { getSiteData } from '@/lib/content/site-data';
import { HOW_SITE_WORKS_LINK } from '@/lib/site/honesty';
import { TocSheet } from '@/components/ui/interactive';
import { GradeBadge, GRADE_LABELS, headingLabel } from './evidence';
import { SymptomsDirectory } from './hub-symptoms';
import { EXTRA_URLS, SLUG_GROUP, SLUG_TERMS, SYMPTOM_GROUPS, type DirectoryGroup } from './hub-symptoms-data';
import '@/app/styles/hubs.css';

/**
 * Hub page top: calm and editorial, matching ArticleHero (kicker, H1, lead).
 * No banner and no second contents box; the hub's own sections open from an
 * "On this page" chip, and the guide count sits beside the title on desktop.
 */
export function HubHero({
  eyebrow,
  title,
  description,
  guideCount,
  sections,
}: {
  eyebrow: string;
  title: string;
  description: string;
  /** Real count of published guides in this hub. 0 hides the browse button. */
  guideCount: number;
  /** The hub's own H2s, offered as an "On this page" sheet. */
  sections: Array<{ id: string; text: string }>;
}) {
  return (
    <header className="hub-hero">
      <div>
        <p className="kicker">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="hub-hero-lead">{description}</p>
        <p className="notice-line mt-3">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" className="mt-1 shrink-0 text-[var(--accent)]" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 11v5M12 7.5v.01" strokeLinecap="round" />
          </svg>
          <Link href="/about/">{HOW_SITE_WORKS_LINK}</Link>
        </p>
        {(guideCount > 0 || sections.length > 0) && (
          <div className="hub-hero-actions no-print">
            {guideCount > 0 && (
              <a href="#in-this-section" className="btn btn-primary">
                Browse {guideCount} guides
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 5v14M6 13l6 6 6-6" />
                </svg>
              </a>
            )}
            {sections.length > 0 && <TocSheet items={sections.map((s) => ({ id: s.id, label: headingLabel(s.text) }))} />}
          </div>
        )}
      </div>
      {guideCount > 0 && (
        <p className="hub-hero-count" aria-hidden="true">
          <strong>{guideCount}</strong>
          <span>guides, each with its sources</span>
        </p>
      )}
    </header>
  );
}

const GRADE_ORDER: EvidenceGrade[] = ['strong', 'moderate', 'limited', 'comfort_only', 'not_supported', 'harm_concern'];

function GuideCard({ page, showGrade }: { page: ContentPage; showGrade: boolean }) {
  const grade = page.fm.evidence_grade;
  return (
    <Link href={page.url} className="guide-card">
      <span className="guide-card-title">
        <span>{page.fm.title}</span>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </span>
      <span className="guide-card-desc">{page.fm.meta_description}</span>
      {showGrade && grade && grade !== 'per_option' && (
        <span className="guide-card-grade">
          <GradeBadge grade={grade} />
        </span>
      )}
    </Link>
  );
}

/** Symptoms hub: guides grouped by what she's feeling, with chips and instant search. */
function symptomGroups(pages: ContentPage[]): DirectoryGroup[] {
  const { byUrl } = getSiteData();
  const toItem = (p: ContentPage) => ({
    url: p.url,
    title: p.fm.title,
    desc: p.fm.meta_description,
    terms: [p.fm.primary_keyword, ...(p.fm.secondary_keywords ?? []), ...(p.fm.symptom_tags ?? []), SLUG_TERMS[p.fm.slug] ?? '']
      .join(' ')
      .replace(/-/g, ' ')
      .toLowerCase(),
  });
  const groups: DirectoryGroup[] = SYMPTOM_GROUPS.map((g) => ({ ...g, items: [] }));
  const byId = new Map(groups.map((g) => [g.id, g]));
  for (const p of pages) byId.get(SLUG_GROUP[p.fm.slug] ?? 'other')!.items.push(toItem(p));
  for (const extra of EXTRA_URLS) {
    const p = byUrl.get(extra.url);
    if (p && !pages.includes(p)) byId.get(extra.group)!.items.push(toItem(p));
  }
  for (const g of groups) g.items.sort((a, b) => a.title.localeCompare(b.title));
  return groups.filter((g) => g.items.length > 0);
}

/**
 * The hub's guides. The symptoms hub gets grouped, filterable cards; a hub where
 * most guides carry an evidence grade (Does it work?) is grouped by grade,
 * strongest first; any other hub is a simple card grid. Grades come from each
 * page's own frontmatter, never from here.
 */
export function HubDirectory({ pages, heading }: { pages: ContentPage[]; heading: string }) {
  const isSymptoms = pages.length > 0 && pages.every((p) => p.url.startsWith('/symptoms/'));
  const graded = pages.filter((p) => p.fm.evidence_grade && p.fm.evidence_grade !== 'per_option');
  const byGrade = !isSymptoms && graded.length * 2 > pages.length;
  const groups = isSymptoms ? symptomGroups(pages) : [];
  const total = isSymptoms ? groups.reduce((n, g) => n + g.items.length, 0) : pages.length;

  return (
    <section aria-labelledby="in-this-section" className="scroll-mt-4 space-y-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-t border-[var(--rule)] pt-6">
        <h2 id="in-this-section" className="text-[length:var(--fs-h2)]">
          {heading}
        </h2>
        <p className="text-[var(--fs-meta)] text-[var(--ink-muted)]">{total} guides</p>
      </div>

      {isSymptoms ? (
        <SymptomsDirectory groups={groups} total={total} />
      ) : byGrade ? (
        <div>
          {GRADE_ORDER.map((g) => {
            const group = graded.filter((p) => p.fm.evidence_grade === g);
            if (group.length === 0) return null;
            return (
              <div key={g} className="hub-group">
                <h3 className="flex flex-wrap items-center gap-3 text-[length:var(--fs-h4)]">
                  <GradeBadge grade={g} />
                  <span className="font-sans text-[1rem] font-normal text-[var(--ink-muted)]">
                    {group.length} {group.length === 1 ? 'verdict' : 'verdicts'}
                  </span>
                  <span className="visually-hidden">: {GRADE_LABELS[g]}</span>
                </h3>
                <ul className="guide-grid">
                  {group.map((p) => (
                    <li key={p.url}>
                      <GuideCard page={p} showGrade={false} />
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
          {pages.length > graded.length && (
            <div className="hub-group">
              <h3 className="text-[length:var(--fs-h4)]">More guides</h3>
              <ul className="guide-grid">
                {pages
                  .filter((p) => !graded.includes(p))
                  .map((p) => (
                    <li key={p.url}>
                      <GuideCard page={p} showGrade={false} />
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <ul className="guide-grid">
          {pages.map((p) => (
            <li key={p.url}>
              <GuideCard page={p} showGrade />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
