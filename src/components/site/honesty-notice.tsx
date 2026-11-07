import Link from 'next/link';
import { Info } from 'lucide-react';
import {
  HONESTY_ANCHOR,
  HONESTY_FOOTER,
  HONESTY_FULL,
  HONESTY_SHORT,
  formatCheckedDate,
} from '@/lib/site/honesty';

/**
 * The honesty notice. No hooks, so it renders in server HTML (readers and
 * search engines both see it) and inside client screens alike.
 */
export function HonestyNotice(
  props:
    | {
        variant: 'short';
        /** 'dark' inside the green heroes. */
        tone?: 'light' | 'dark';
        /** Where "How this page was made" points. Pages without the full notice link to the disclaimer. */
        href?: string;
      }
    | {
        variant: 'full';
        /** ISO date. */
        lastChecked: string;
        /** Set only when isMedicallyReviewed() is true for this exact version. */
        reviewer?: { name: string; credentials: string; date: string };
      }
    | { variant: 'footer'; className?: string },
) {
  if (props.variant === 'footer') {
    return <p className={props.className ?? 'text-sm leading-relaxed'}>{HONESTY_FOOTER}</p>;
  }

  if (props.variant === 'short') {
    const dark = props.tone === 'dark';
    const href = props.href ?? `#${HONESTY_ANCHOR}`;
    const label = href.startsWith('#') ? HONESTY_SHORT.linkLabel : 'How this site works';
    return (
      <p
        className={`flex items-start gap-2 text-sm leading-relaxed ${dark ? 'text-[#e4eeea]' : 'text-[var(--color-ink-muted)]'}`}
        data-honesty="short"
      >
        <Info aria-hidden="true" className={`mt-0.5 h-4 w-4 shrink-0 ${dark ? 'text-[#9fd4c3]' : 'text-[var(--color-accent)]'}`} />
        <span>
          {HONESTY_SHORT.text}{' '}
          <a
            href={href}
            className={`font-semibold underline underline-offset-2 ${dark ? 'text-white focus-visible:outline-white' : 'text-[var(--color-link)]'}`}
          >
            {label}
          </a>
        </span>
      </p>
    );
  }

  const { lastChecked, reviewer } = props;
  return (
    <section
      id={HONESTY_ANCHOR}
      aria-labelledby={`${HONESTY_ANCHOR}-title`}
      data-honesty="full"
      className="scroll-mt-4 space-y-3 rounded-2xl border border-[var(--color-rule)] border-l-4 border-l-[var(--color-accent)] bg-[var(--color-paper-raised)] p-5 sm:p-6"
    >
      <h2 id={`${HONESTY_ANCHOR}-title`} className="font-serif text-xl font-semibold">
        {HONESTY_FULL.heading}
      </h2>
      <p className="font-semibold">{reviewer ? HONESTY_FULL.leadReviewed(reviewer) : HONESTY_FULL.lead}</p>
      {HONESTY_FULL.sections.map((s) => (
        <p key={s.title} className="text-[var(--color-ink)]">
          <strong>{s.title}</strong> {s.body}
        </p>
      ))}
      <p className="font-semibold">{HONESTY_FULL.seeDoctor}</p>
      <p>
        {HONESTY_FULL.urgent}{' '}
        <Link href="/urgent-help/" className="font-bold text-[var(--color-urgent)] underline">
          {HONESTY_FULL.urgentLabel}
        </Link>
      </p>
      <p className="border-t border-[var(--color-rule)] pt-3 text-sm text-[var(--color-ink-muted)]">
        {HONESTY_FULL.lastCheckedLabel}: <time dateTime={lastChecked}>{formatCheckedDate(lastChecked)}</time> ·{' '}
        <Link href="/contact/" className="font-semibold text-[var(--color-link)] underline">
          {HONESTY_FULL.mistakeLabel}
        </Link>
      </p>
    </section>
  );
}
