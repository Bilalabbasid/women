import Link from 'next/link';
import { SITE } from '@/lib/site/config';
import { HONESTY_FOOTER } from '@/lib/site/honesty';
import { StorageChoicesButton } from './cookie-banner';
import { APP_ROUTES } from '@/lib/routes';
import { isToolLive } from '@/lib/tools/logic';
import type { Crumb } from '@/lib/seo/jsonld';
import { serializeLd } from '@/lib/seo/jsonld';

/** Server-only site chrome. Ships no JavaScript. */

export function JsonLd({ data }: { data: Record<string, unknown> | Array<Record<string, unknown>> }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeLd(data) }} />;
}

export function BrandLogo({ size = 28, tone = 'dark' }: { size?: number; tone?: 'dark' | 'light' }) {
  const light = tone === 'light';
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect width="64" height="64" rx="14" fill={light ? '#2C7A66' : '#1F5A4C'} />
        <path
          d="M13 46V18H19.5L27.5 34.5L35.5 18H42V46H36.5V27.5L29.2 42.5H25.8L18.5 27.5V46H13Z"
          fill="#F7F6F2"
        />
        <path
          d="M38 35.5L43.5 41L53 27.5"
          stroke="#E6EFEB"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className={`font-serif text-xl font-bold tracking-tight ${light ? 'text-white' : 'text-[var(--color-ink)]'}`}>
        Meno<span className={light ? 'text-[#9fd4c3]' : 'text-[var(--color-accent)]'}>Verdict</span>
      </span>
    </span>
  );
}

export function SiteHeader({ hubs }: { hubs: Array<{ href: string; label: string }> }) {
  return (
    <header role="banner" className="border-b border-[var(--color-rule)] bg-[var(--color-paper)]">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-1 px-4 py-2.5">
        <Link href="/" className="tap font-serif text-xl font-semibold text-[var(--color-ink)] no-underline">
          <BrandLogo size={30} />
        </Link>
        {/* Up to 6 hubs plus Tools/Search/Account: on a narrow phone this wraps
            into 2-3 ragged lines of links before any page content, pushing
            everything down. A single scrollable row keeps it compact and
            lets the next item peek into view as a scroll affordance; it goes
            back to a normal wrapping row once there's room (sm+). No JS. */}
        <nav aria-label="Main" className="w-full min-w-0 sm:w-auto">
          <ul className="flex flex-nowrap items-center gap-x-5 gap-y-0 overflow-x-auto sm:flex-wrap sm:overflow-x-visible">
            {hubs.map((h) => (
              <li key={h.href}>
                <Link href={h.href} className="tap text-[var(--color-ink)] underline-offset-4 hover:underline">
                  {h.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/tools/" className="tap font-semibold text-[var(--color-accent)] underline-offset-4 hover:underline">
                Tools
              </Link>
            </li>
            <li>
              <Link href="/search/" className="tap text-[var(--color-ink)] underline-offset-4 hover:underline">
                Search
              </Link>
            </li>
            {isToolLive('symptom-tracker') && (
              <li>
                <Link href={APP_ROUTES.saved} className="tap text-[var(--color-ink)] underline-offset-4 hover:underline">
                  Saved
                </Link>
              </li>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
}

const TRUST_LINKS: Array<{ href: string; label: string }> = [
  { href: '/about/', label: 'About' },
  { href: '/evidence/editorial-policy/', label: 'Editorial Policy' },
  { href: '/evidence/how-we-grade/', label: 'Evidence Grading Method' },
  { href: '/about/how-we-make-money/', label: "How we're funded" },
  { href: '/evidence/updates/', label: 'Corrections' },
];

const LEGAL_LINKS: Array<{ href: string; label: string }> = [
  { href: '/medical-disclaimer/', label: 'Medical Disclaimer' },
  { href: '/privacy/', label: 'Privacy' },
  { href: '/cookies/', label: 'Cookies' },
  { href: '/terms/', label: 'Terms' },
  { href: '/contact/', label: 'Contact' },
];

const footerLink =
  'tap text-sm text-[#cfe2da] underline-offset-4 hover:text-white hover:underline focus-visible:outline-white';

function FooterColumn({ title, links }: { title: string; links: Array<{ href: string; label: string }> }) {
  if (links.length === 0) return null;
  return (
    <div>
      <p className="font-serif text-base font-semibold text-white">{title}</p>
      <ul className="mt-2">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className={footerLink}>
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SiteFooter({
  links,
  hubs = [],
}: {
  links?: Array<{ href: string; label: string }>;
  hubs?: Array<{ href: string; label: string }>;
}) {
  const seen = new Set<string>(['/urgent-help/', ...TRUST_LINKS.map((l) => l.href), ...LEGAL_LINKS.map((l) => l.href)]);
  const extraLinks = (links ?? []).filter((l) => !seen.has(l.href));
  const explore = [...hubs, { href: '/tools/', label: 'Tools' }, { href: '/search/', label: 'Search' }];
  if (isToolLive('symptom-tracker')) {
    explore.push(
      { href: APP_ROUTES.today, label: 'Your private tracker' },
      { href: APP_ROUTES.saved, label: 'Saved pages' },
      { href: APP_ROUTES.install, label: 'Install the app' },
    );
  }

  return (
    <footer role="contentinfo" className="relative mt-20 overflow-hidden bg-[#14382f] text-[#e4eeea]">
      <svg
        aria-hidden="true"
        focusable="false"
        className="pointer-events-none absolute -left-32 -bottom-48 h-[30rem] w-[30rem] opacity-[0.07]"
        viewBox="0 0 400 400"
        fill="none"
      >
        {[70, 110, 150, 190].map((r) => (
          <circle key={r} cx="200" cy="200" r={r} stroke="#fff" strokeWidth="1.5" />
        ))}
      </svg>

      <div className="relative mx-auto max-w-6xl px-4 pt-14 pb-8">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_2fr]">
          <div className="space-y-4">
            <Link href="/" className="tap no-underline focus-visible:outline-white">
              <BrandLogo size={34} tone="light" />
            </Link>
            <p className="font-serif text-xl font-medium text-white">{SITE.tagline}</p>
            <p className="max-w-sm text-sm leading-relaxed text-[#cfe2da]">
              Independent, evidence-graded information on perimenopause and menopause. Every claim graded, every
              source linked. Free, with no ads and no sponsors.
            </p>
            <Link
              href="/urgent-help/"
              className="tap gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-[var(--color-urgent)] no-underline shadow-sm hover:bg-[var(--color-urgent-soft)] focus-visible:outline-white"
            >
              <span aria-hidden="true" className="h-2 w-2 rounded-full bg-[var(--color-urgent)]" />
              Crisis and Urgent Help
            </Link>
          </div>

          <nav aria-label="Footer" className="grid gap-8 sm:grid-cols-3">
            <FooterColumn title="Explore" links={explore} />
            <FooterColumn title="Trust & method" links={[...TRUST_LINKS, ...extraLinks]} />
            <div>
              <FooterColumn title="Legal & contact" links={LEGAL_LINKS} />
              <StorageChoicesButton className={`${footerLink} cursor-pointer bg-transparent p-0 text-left`} />
            </div>
          </nav>
        </div>

        {/* Standard notice */}
        <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-relaxed text-[#cfe2da]">
          <p data-honesty="footer">{HONESTY_FOOTER}</p>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-white/10 pt-6 text-sm text-[#a9c7bc] sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {SITE.name}
            {SITE.legalEntity ? ` · Operated by ${SITE.legalEntity}` : ''}
          </p>
        </div>
      </div>
    </footer>
  );
}

export function Breadcrumbs({ crumbs }: { crumbs: Array<Crumb & { linked: boolean }> }) {
  return (
    <nav aria-label="Breadcrumb" className="text-[var(--color-ink-muted)]">
      <ol className="flex flex-wrap items-center gap-x-2">
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1;
          return (
            <li key={c.path} className="flex items-center gap-x-2">
              {c.linked && !last ? (
                <Link href={c.path} className="tap underline">
                  {c.name}
                </Link>
              ) : (
                <span aria-current={last ? 'page' : undefined}>{c.name}</span>
              )}
              {!last && <span aria-hidden="true">›</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
