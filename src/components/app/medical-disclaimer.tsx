import Link from 'next/link';
import { HONESTY_FOOTER, HONESTY_SHORT } from '@/lib/site/honesty';

/**
 * The honesty notice in the private tracker: the short line at the top of every
 * screen, and the footer line at the bottom. Copy comes from src/lib/site/honesty.ts.
 */
export function MedicalDisclaimerBanner() {
  return (
    <aside aria-label="Medical notice" className="border-b border-[var(--color-rule)] bg-[var(--color-paper)] px-4 py-1.5 text-[var(--color-ink-muted)]">
      <p className="mx-auto max-w-2xl text-xs" data-honesty="short">
        {HONESTY_SHORT.text}{' '}
        <Link href="/medical-disclaimer/" className="font-semibold text-[var(--color-link)] underline">
          How this site works
        </Link>{' '}
        ·{' '}
        <Link href="/urgent-help/" className="font-semibold text-[var(--color-urgent)] underline">
          Urgent help
        </Link>
      </p>
    </aside>
  );
}

export function AppFooterNotice() {
  return (
    <footer className="mx-auto w-full max-w-2xl px-4 pb-24 pt-6 text-xs leading-relaxed text-[var(--color-ink-muted)] md:pb-8">
      <p data-honesty="footer">{HONESTY_FOOTER}</p>
    </footer>
  );
}
