import Link from 'next/link';
import type { Source, SourceType } from '@/lib/content/schema';
import type { ContentPage } from '@/lib/content/loader';

/** AGENTS.md source order: regulators/labels first, down to smaller/weaker evidence. */
const TYPE_ORDER: readonly SourceType[] = [
  'regulator_label',
  'regulator_statement',
  'guideline',
  'position_statement',
  'systematic_review',
  'rct',
  'cohort',
  'patient_information',
  'other',
  'small_study',
  'preprint',
  'brand_funded',
];

const TYPE_LABELS: Record<SourceType, string> = {
  regulator_label: 'Regulator prescribing labels',
  regulator_statement: 'Regulator statements',
  guideline: 'Society and clinical guidelines',
  position_statement: 'Position statements',
  systematic_review: 'Systematic reviews',
  rct: 'Randomized controlled trials',
  cohort: 'Cohort studies',
  small_study: 'Small studies (weigh with caution)',
  preprint: 'Preprints, not peer reviewed (weigh with caution)',
  brand_funded: 'Brand-funded research (weigh with caution)',
  patient_information: 'Patient information pages',
  other: 'Other sources (reviews, commentary, own-site data)',
};

/**
 * Live, read-only listing of every source in content/_sources/sources.yaml,
 * grouped the same way the brief orders evidence (strongest first), each
 * linked to its real URL/DOI and to every published page that cites it. Read
 * fresh from the registry at request time - nothing here is hand-typed, so
 * it can never drift out of sync with the actual sources.yaml file. The
 * companion machine-readable feed is /sources.json (src/app/sources.json/route.ts).
 */
export function SourcesList({ sources, pages }: { sources: Map<string, Source>; pages: ContentPage[] }) {
  const citedBy = new Map<string, ContentPage[]>();
  for (const p of pages) {
    for (const id of p.fm.sources) {
      if (!citedBy.has(id)) citedBy.set(id, []);
      citedBy.get(id)!.push(p);
    }
  }

  const byType = new Map<SourceType, Source[]>();
  for (const s of sources.values()) {
    if (!byType.has(s.type)) byType.set(s.type, []);
    byType.get(s.type)!.push(s);
  }
  for (const list of byType.values()) list.sort((a, b) => b.year - a.year);

  const groups = TYPE_ORDER.filter((t) => byType.has(t));

  return (
    <div className="space-y-8" data-sources-list-ui="true">
      <p className="text-sm text-[var(--color-ink-muted)]">
        {sources.size} source{sources.size === 1 ? '' : 's'} currently in the registry, generated from{' '}
        <code>content/_sources/sources.yaml</code>. The same data, for scripts and researchers, is at{' '}
        <a href="/sources.json" className="text-[var(--color-link)] underline">
          /sources.json
        </a>
        .
      </p>

      {groups.map((type) => {
        const list = byType.get(type)!;
        return (
          <section key={type} aria-labelledby={`sources-${type}`} className="space-y-3">
            <h2 id={`sources-${type}`} className="text-xl font-semibold">
              {TYPE_LABELS[type]} <span className="text-[var(--color-ink-muted)] font-normal">({list.length})</span>
            </h2>
            <ul className="space-y-4">
              {list.map((s) => {
                const href = s.url ?? (s.doi ? `https://doi.org/${s.doi}` : undefined);
                const citing = citedBy.get(s.id) ?? [];
                return (
                  <li key={s.id} className="rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)] p-4">
                    <p className="font-semibold">
                      {href ? (
                        <a href={href} className="text-[var(--color-link)] underline">
                          {s.title}
                        </a>
                      ) : (
                        s.title
                      )}
                    </p>
                    <p className="text-sm text-[var(--color-ink-muted)]">
                      {s.publisher}, {s.year}
                      {s.funding_conflict && <> — funding: {s.funding_conflict}</>}
                    </p>
                    {citing.length > 0 && (
                      <p className="mt-2 text-xs text-[var(--color-ink-muted)]">
                        Cited on:{' '}
                        {citing.map((p, i) => (
                          <span key={p.url}>
                            {i > 0 && ', '}
                            <Link href={p.url} className="text-[var(--color-link)] underline">
                              {p.fm.title}
                            </Link>
                          </span>
                        ))}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
