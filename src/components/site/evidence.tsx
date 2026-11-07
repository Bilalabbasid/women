import Link from 'next/link';
import type { EvidenceGrade, Source, Person } from '@/lib/content/schema';
import type { ContentPage } from '@/lib/content/loader';
import { SITE } from '@/lib/site/config';
import { AI_GRADE_NOTE } from '@/lib/site/honesty';

export { GRADE_LABELS } from '@/lib/grades/labels';
import { GRADE_LABELS } from '@/lib/grades/labels';

/** A heading's label for a contents list, without a leading "1. " (the list numbers it already). */
export const headingLabel = (text: string) => text.replace(/^\d+[.)]\s+/, '');

/** The line shown next to a grade badge: grades are AI-assisted, and the method is public. */
export function GradeAiNote({ methodHref = '/evidence/how-we-grade/' }: { methodHref?: string }) {
  return (
    <span className="text-xs text-[var(--color-ink-muted)]">
      {AI_GRADE_NOTE} ·{' '}
      <Link href={methodHref} className="font-semibold text-[var(--color-link)] underline">
        method
      </Link>
    </span>
  );
}

/** Evidence grade with a text label (never colour alone). Links to the grading method. */
export function GradeBadge({ grade, methodHref }: { grade: EvidenceGrade; methodHref?: string }) {
  const badge = <span className={`grade grade-${grade}`}>{GRADE_LABELS[grade]}</span>;
  return methodHref ? (
    <Link href={methodHref} className="no-underline" aria-label={`${GRADE_LABELS[grade]}: how we grade evidence`}>
      {badge}
    </Link>
  ) : (
    badge
  );
}

const fmtDate = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });

export const displayName = (p: Person | undefined) =>
  !p ? 'Unknown' : p.name ?? `${SITE.name} editorial team`;

export function References({ ids, sources }: { ids: string[]; sources: Map<string, Source> }) {
  if (ids.length === 0) return null;
  return (
    <section aria-labelledby="references" className="space-y-3">
      <h2 id="references" className="text-2xl">
        References
      </h2>
      <ol className="list-decimal space-y-2 pl-6">
        {ids.map((id, i) => {
          const s = sources.get(id);
          const href = s?.url ?? (s?.doi ? `https://doi.org/${s.doi}` : undefined);
          return (
            <li key={id} id={`ref-${i + 1}`}>
              {s ? (
                <>
                  {s.authors.length > 0 && `${s.authors.slice(0, 3).join(', ')}${s.authors.length > 3 ? ' et al.' : ''}. `}
                  {href ? (
                    <a href={href} rel="noopener" className="text-[var(--color-link)] underline">
                      {s.title}
                    </a>
                  ) : (
                    s.title
                  )}
                  . {s.publisher}, {s.year}.
                  {(s.type === 'small_study' || s.type === 'preprint' || s.type === 'brand_funded') && (
                    <strong>
                      {' '}
                      [{s.type === 'small_study' ? 'Small study' : s.type === 'preprint' ? 'Preprint, not peer reviewed' : 'Brand-funded'}]
                    </strong>
                  )}
                  {s.funding_conflict && <> Funding: {s.funding_conflict}.</>}
                </>
              ) : (
                <strong>Missing source &ldquo;{id}&rdquo;</strong>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export function ChangeLog({ entries }: { entries: ContentPage['fm']['change_log'] }) {
  return (
    <details className="rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)] p-4">
      <summary className="tap cursor-pointer font-semibold">Change log</summary>
      <ul className="mt-2 space-y-1">
        {[...entries]
          .sort((a, b) => b.date.localeCompare(a.date))
          .map((e) => (
            <li key={`${e.date}-${e.summary}`}>
              <time dateTime={e.date}>{fmtDate(e.date)}</time>: {e.summary}
            </li>
          ))}
      </ul>
    </details>
  );
}

export function DraftBanner({ problems }: { problems: string[] }) {
  return (
    <div role="note" className="border-b-2 border-[var(--color-draft)] bg-[var(--color-draft-soft)] px-4 py-3 text-[var(--color-ink)]">
      <div className="mx-auto max-w-5xl">
        <p className="font-bold">DRAFT: not published. This page is excluded from production builds.</p>
        <ul className="list-disc pl-6">
          {problems.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function Toc({
  headings,
  compact = false,
}: {
  headings: Array<{ depth: 2 | 3; id: string; text: string }>;
  /** Single column, for the sticky sidebar. */
  compact?: boolean;
}) {
  const h2s = headings.filter((h) => h.depth === 2 && h.id !== 'references');
  if (h2s.length < 3) return null;
  const titleId = compact ? 'toc-title-side' : 'toc-title';
  return (
    <nav
      aria-labelledby={titleId}
      className="rounded-2xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)] p-4 shadow-xs sm:p-5"
    >
      <p id={titleId} className="font-serif text-lg font-semibold">
        {compact ? 'Contents' : 'On this page'}
      </p>
      <ol className={`mt-2 grid gap-x-6 ${compact ? 'text-base' : 'sm:grid-cols-2'}`}>
        {h2s.map((h, i) => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              className="tap group w-full gap-3 rounded-lg px-2 text-[var(--color-link)] no-underline hover:bg-[var(--color-accent-soft)]"
            >
              <span
                aria-hidden="true"
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-sm font-semibold text-[var(--color-accent)] group-hover:bg-[var(--color-accent)] group-hover:text-white"
              >
                {i + 1}
              </span>
              <span className="underline-offset-4 group-hover:underline">{headingLabel(h.text)}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
