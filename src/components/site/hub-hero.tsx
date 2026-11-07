import Link from 'next/link';
import { ArrowDown, ArrowRight } from 'lucide-react';
import type { ContentPage } from '@/lib/content/loader';
import type { EvidenceGrade } from '@/lib/content/schema';
import { HeroPanel, heroEyebrow, heroTitle, heroLead, heroPrimaryBtn } from './hero-panel';
import { GradeBadge, GRADE_LABELS } from './evidence';

const MAX_JUMPS = 6;

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
  /** The hub's own H2s, used as a jump list. */
  sections: Array<{ id: string; text: string }>;
}) {
  return (
    <HeroPanel>
      <div className={`grid items-center gap-8 ${sections.length > 0 ? 'md:grid-cols-[3fr_2fr]' : ''}`}>
        <div className="space-y-5">
          <p className={heroEyebrow}>{eyebrow}</p>
          <h1 className={heroTitle}>{title}</h1>
          <p className={heroLead}>{description}</p>
          {guideCount > 0 && (
            <div className="no-print flex flex-wrap items-center gap-3 pt-1">
              <a href="#in-this-section" className={heroPrimaryBtn}>
                Browse {guideCount} guides
                <ArrowDown aria-hidden="true" className="h-4 w-4" />
              </a>
            </div>
          )}
        </div>

        {sections.length > 0 && (
          <nav
            aria-label="On this page"
            className="rounded-2xl bg-white p-5 text-[var(--color-ink)] shadow-xl shadow-black/20 sm:p-6"
          >
            <p className="font-serif text-lg font-semibold">On this page</p>
            <ol className="mt-3 space-y-1">
              {sections.slice(0, MAX_JUMPS).map((s, i) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="tap group w-full gap-3 rounded-lg px-1.5 text-base text-[var(--color-ink)] no-underline hover:bg-[var(--color-accent-soft)]"
                  >
                    <span
                      aria-hidden="true"
                      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-sm font-semibold text-[var(--color-accent)] group-hover:bg-[var(--color-accent)] group-hover:text-white"
                    >
                      {i + 1}
                    </span>
                    <span className="leading-snug group-hover:underline">{s.text}</span>
                  </a>
                </li>
              ))}
            </ol>
            {sections.length > MAX_JUMPS && (
              <p className="mt-2 pl-1.5 text-sm text-[var(--color-ink-muted)]">
                + {sections.length - MAX_JUMPS} more sections further down
              </p>
            )}
          </nav>
        )}
      </div>
    </HeroPanel>
  );
}

const GRADE_ORDER: EvidenceGrade[] = ['strong', 'moderate', 'limited', 'not_supported', 'harm_concern'];

function GuideCard({ page, showGrade }: { page: ContentPage; showGrade: boolean }) {
  const grade = page.fm.evidence_grade;
  return (
    <Link
      href={page.url}
      className="card-live tap group flex h-full flex-col items-start gap-2 rounded-2xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)] p-4 no-underline shadow-xs transition hover:-translate-y-0.5 hover:border-[var(--color-accent)] hover:shadow-md"
    >
      <span className="flex w-full items-start justify-between gap-3">
        <span className="font-semibold leading-snug text-[var(--color-ink)] group-hover:text-[var(--color-accent)]">
          {page.fm.title}
        </span>
        <ArrowRight
          aria-hidden="true"
          className="mt-1 h-4 w-4 shrink-0 text-[var(--color-ink-muted)] transition-transform group-hover:translate-x-1 group-hover:text-[var(--color-accent)]"
        />
      </span>
      <span className="line-clamp-2 text-sm leading-relaxed text-[var(--color-ink-muted)]">
        {page.fm.meta_description}
      </span>
      {showGrade && grade && grade !== 'per_option' && (
        <span className="mt-auto pt-1">
          <GradeBadge grade={grade} />
        </span>
      )}
    </Link>
  );
}

/**
 * The hub's guides as cards. When most of them carry an evidence grade (the
 * Does-it-work hub), they are grouped by grade, strongest first, so the
 * directory doubles as a verdict board. Grades come from each page's own
 * frontmatter, never from here.
 */
export function HubDirectory({ pages, heading }: { pages: ContentPage[]; heading: string }) {
  const graded = pages.filter((p) => p.fm.evidence_grade && p.fm.evidence_grade !== 'per_option');
  const byGrade = graded.length * 2 > pages.length;

  return (
    <section aria-labelledby="in-this-section" className="scroll-mt-4 space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 id="in-this-section" className="font-serif text-2xl font-semibold sm:text-3xl">
          {heading}
        </h2>
        <p className="text-sm text-[var(--color-ink-muted)]">{pages.length} guides</p>
      </div>

      {byGrade ? (
        <div className="space-y-7">
          {GRADE_ORDER.map((g) => {
            const group = graded.filter((p) => p.fm.evidence_grade === g);
            if (group.length === 0) return null;
            return (
              <div key={g} className="space-y-3">
                <h3 className="flex items-center gap-3 text-lg">
                  <GradeBadge grade={g} />
                  <span className="text-[var(--color-ink-muted)]">
                    {group.length} {group.length === 1 ? 'verdict' : 'verdicts'}
                  </span>
                  <span className="sr-only">: {GRADE_LABELS[g]}</span>
                </h3>
                <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
            <div className="space-y-3">
              <h3 className="text-lg">More guides</h3>
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
