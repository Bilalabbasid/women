import Link from 'next/link';
import { getSiteData } from '@/lib/content/site-data';
import { UPDATES_URL, parseEvidenceUpdates } from '@/lib/content/updates';
import '@/app/styles/misc.css';

/** The newest entries from the evidence updates log. Renders nothing if the log is empty or unpublished. */
export function RecentEvidenceUpdates({ limit = 5, headingLevel = 2 }: { limit?: number; headingLevel?: 2 | 3 }) {
  const { byUrl } = getSiteData();
  const log = byUrl.get(UPDATES_URL);
  if (!log) return null;
  const updates = parseEvidenceUpdates(log.body).slice(0, limit);
  if (updates.length === 0) return null;
  const Heading = headingLevel === 2 ? 'h2' : 'h3';

  return (
    <section aria-labelledby="evidence-updates-heading" className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <Heading id="evidence-updates-heading" className="font-serif text-[length:var(--fs-h3)] font-semibold text-[var(--ink)]">
          Recent evidence updates
        </Heading>
        <Link href={UPDATES_URL} className="link link-arrow text-[1rem]">
          Full updates log
        </Link>
      </div>
      <ul className="row-list" role="list">
        {updates.map((u) => (
          <li key={`${u.date}-${u.title}`} className="update-row">
            <time dateTime={u.date} className="update-date">
              {u.dateLabel}
            </time>
            {u.href && byUrl.has(u.href) ? (
              <Link href={u.href} className="font-bold leading-snug text-[var(--link)] underline decoration-[color-mix(in_srgb,var(--link)_45%,transparent)] underline-offset-[0.18em] hover:decoration-current">
                {u.title}
              </Link>
            ) : (
              <span className="font-bold leading-snug text-[var(--ink)]">{u.title}</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
