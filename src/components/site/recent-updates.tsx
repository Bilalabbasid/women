import Link from 'next/link';
import { getSiteData } from '@/lib/content/site-data';
import { UPDATES_URL, parseEvidenceUpdates } from '@/lib/content/updates';

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
      <div className="flex flex-wrap items-end justify-between gap-2">
        <Heading id="evidence-updates-heading" className="font-serif text-2xl font-semibold text-[var(--color-ink)]">
          Recent evidence updates
        </Heading>
        <Link href={UPDATES_URL} className="tap text-sm font-semibold text-[var(--color-link)] underline">
          Full updates log →
        </Link>
      </div>
      <ul className="divide-y divide-[var(--color-rule)] overflow-hidden rounded-2xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)]">
        {updates.map((u) => (
          <li key={`${u.date}-${u.title}`} className="space-y-1 p-4">
            <time dateTime={u.date} className="block text-sm text-[var(--color-ink-muted)]">
              {u.dateLabel}
            </time>
            {u.href && byUrl.has(u.href) ? (
              <Link href={u.href} className="tap font-medium text-[var(--color-link)] underline">
                {u.title}
              </Link>
            ) : (
              <span className="font-medium text-[var(--color-ink)]">{u.title}</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
