import Link from 'next/link';

/**
 * Editorial callout linking to the MenoVerdict Symptom Journal printable PDF.
 * Strictly placed after the answer on relevant guides (appointment prep, perimenopause hub).
 * Never placed in crisis, emergency, cancer, or bleeding content.
 */
export function SymptomJournalCallout({ className = '' }: { className?: string }) {
  return (
    <aside
      className={`my-8 p-5 rounded-2xl bg-[var(--paper-raised)] border border-[var(--rule)] shadow-xs ${className}`}
      aria-label="Printable Symptom Journal"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <p className="text-xs uppercase font-semibold tracking-wider text-[var(--accent)]">
            Sold by MenoVerdict
          </p>
          <p className="text-base text-[var(--ink)] leading-snug font-serif font-medium">
            Prefer paper? Our 38-page Symptom Journal &amp; Doctor Visit Toolkit helps you track for eight weeks and walk into your appointment with a one-page summary.
          </p>
          <p className="text-xs text-[var(--ink-muted)]">
            $8.99 · Instant download · Print it or fill it in on a tablet
          </p>
        </div>
        <Link
          href="/shop/menopause-symptom-journal/"
          className="btn btn-secondary shrink-0 text-sm font-semibold px-4 py-2 rounded-xl whitespace-nowrap"
        >
          View journal, $8.99 →
        </Link>
      </div>
    </aside>
  );
}

