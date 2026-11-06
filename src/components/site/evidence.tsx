import Link from 'next/link';
import type { EvidenceGrade, Source, Person } from '@/lib/content/schema';
import type { ContentPage } from '@/lib/content/loader';
import { SITE } from '@/lib/site/config';

export const GRADE_LABELS: Record<EvidenceGrade, string> = {
  strong: 'Strong evidence',
  moderate: 'Moderate evidence',
  limited: 'Limited evidence',
  not_supported: 'Not supported',
  harm_concern: 'Harm concern',
  per_option: 'Graded per option below',
};

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

/**
 * Updated/Reviewed line. The reviewer is shown only when the page has passed the
 * publish gate (`approved`). Otherwise the line says plainly that it is not yet reviewed.
 */
export function ReviewLine({
  page,
  author,
  reviewer,
  reviewed,
}: {
  page: ContentPage;
  author: Person | undefined;
  reviewer: Person | undefined;
  /** isMedicallyReviewed(page, store) — NOT whether the page is published/live. See gate.ts. */
  reviewed: boolean;
}) {
  const { fm } = page;
  return (
    <p className="text-[var(--color-ink-muted)]">
      By {displayName(author)} · Updated <time dateTime={fm.updated_at}>{fmtDate(fm.updated_at)}</time>
      {page.isMedical &&
        (reviewed && reviewer && fm.reviewed_at ? (
          <>
            {' '}
            · Medically reviewed by {displayName(reviewer)}
            {reviewer.credentials ? `, ${reviewer.credentials}` : ''} on{' '}
            <time dateTime={fm.reviewed_at}>{fmtDate(fm.reviewed_at)}</time>
          </>
        ) : (
          <> · Not yet medically reviewed</>
        ))}
    </p>
  );
}

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
                    <a href={href} className="text-[var(--color-link)] underline">
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

export function Toc({ headings }: { headings: Array<{ depth: 2 | 3; id: string; text: string }> }) {
  const h2s = headings.filter((h) => h.depth === 2 && h.id !== 'references');
  if (h2s.length < 3) return null;
  return (
    <nav aria-labelledby="toc-title" className="rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)] p-4">
      <p id="toc-title" className="font-semibold">
        On this page
      </p>
      <ol className="mt-1 space-y-0.5">
        {h2s.map((h) => (
          <li key={h.id}>
            <a href={`#${h.id}`} className="tap text-[var(--color-link)] underline">
              {h.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
