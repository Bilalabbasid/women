import Link from 'next/link';

/**
 * Short, persistent notice for the private tracker. The full disclaimer text
 * (APP_CONFIG.medicalDisclaimer) appears on the doctor report. A short line here
 * keeps the notice on every screen without pushing the content off a phone screen.
 */
export function MedicalDisclaimerBanner() {
  return (
    <aside aria-label="Medical notice" className="no-print border-b border-[var(--color-rule)] bg-[var(--color-paper)] px-4 py-1.5 text-[var(--color-ink-muted)]">
      <p className="mx-auto max-w-2xl text-xs">
        A personal log, not a diagnosis or treatment advice.{' '}
        <Link href="/urgent-help/" className="font-semibold text-[var(--color-urgent)] underline">
          Urgent help
        </Link>
      </p>
    </aside>
  );
}
