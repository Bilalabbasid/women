import Link from 'next/link';
import { SITE } from '@/lib/site/config';
import { STANDARD_NOTICE } from '@/lib/site/notice';
import { APP_ROUTES } from '@/lib/routes';
import { isToolLive } from '@/lib/tools/logic';
import type { Crumb } from '@/lib/seo/jsonld';
import { serializeLd } from '@/lib/seo/jsonld';

/** Server-only site chrome. Ships no JavaScript. */

export function JsonLd({ data }: { data: Record<string, unknown> | Array<Record<string, unknown>> }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeLd(data) }} />;
}

export function BrandLogo({ size = 28 }: { size?: number }) {
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
        <rect width="64" height="64" rx="14" fill="#1F5A4C" />
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
      <span className="font-serif text-xl font-bold tracking-tight text-[var(--color-ink)]">
        Meno<span className="text-[var(--color-accent)]">Verdict</span>
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
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-1 px-4 py-2.5">
        <Link href="/" className="tap font-serif text-xl font-semibold text-[var(--color-ink)] no-underline">
          <BrandLogo size={30} />
        </Link>
        <nav aria-label="Main" className="w-full sm:w-auto">
          <ul className="flex flex-wrap items-center gap-x-5 gap-y-0">
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
            {SITE.flags.login && (
              <li>
                <Link href="/app/account/" className="tap font-semibold text-[var(--color-ink)] underline-offset-4 hover:underline">
                  Account
                </Link>
              </li>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
}

const REQUIRED_FOOTER_LINKS: Array<{ href: string; label: string }> = [
  { href: '/about/', label: 'About' },
  { href: '/evidence/editorial-policy/', label: 'Editorial Policy' },
  { href: '/evidence/how-we-grade/', label: 'Evidence Grading Method' },
  { href: '/about/how-we-make-money/', label: 'Affiliate Disclosure' },
  { href: '/medical-disclaimer/', label: 'Medical Disclaimer' },
  { href: '/privacy/', label: 'Privacy' },
  { href: '/cookies/', label: 'Cookies' },
  { href: '/terms/', label: 'Terms' },
  { href: '/evidence/updates/', label: 'Corrections' },
  { href: '/contact/', label: 'Contact' },
];

export function SiteFooter({ links }: { links?: Array<{ href: string; label: string }> }) {
  const seen = new Set<string>(['/urgent-help/', ...REQUIRED_FOOTER_LINKS.map((l) => l.href)]);
  const extraLinks = (links ?? []).filter((l) => !seen.has(l.href));

  return (
    <footer role="contentinfo" className="mt-16 border-t border-[var(--color-rule)] bg-[var(--color-paper-raised)]">
      <div className="mx-auto max-w-5xl px-4 pt-10 pb-8">
        {/* Standard Notice */}
        <div className="mb-8 rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper)] p-4 text-xs leading-relaxed text-[var(--color-ink-muted)]">
          <p>{STANDARD_NOTICE}</p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2">
          <div className="space-y-3">
            <Link href="/" className="tap no-underline">
              <BrandLogo size={28} />
            </Link>
            <p className="font-serif text-base font-medium text-[var(--color-ink)]">{SITE.tagline}</p>
            <p className="text-sm text-[var(--color-ink-muted)]">
              Independent, evidence-graded information on perimenopause and menopause. Fast, crawlable, and reader-first.
            </p>
            <p className="text-xs text-[var(--color-ink-muted)]">
              As an Amazon Associate we earn from qualifying purchases.
            </p>
            {SITE.legalEntity && <p className="text-xs text-[var(--color-ink-muted)]">Operated by {SITE.legalEntity}.</p>}
          </div>
          <nav aria-label="Footer">
            <ul className="grid grid-cols-1 gap-y-1 sm:grid-cols-2 sm:gap-x-6">
              <li className="sm:col-span-2">
                <Link href="/urgent-help/" className="tap font-semibold text-[var(--color-urgent)] underline">
                  Crisis and Urgent Help
                </Link>
              </li>
              {REQUIRED_FOOTER_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="tap text-sm underline">
                    {l.label}
                  </Link>
                </li>
              ))}
              {extraLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="tap text-sm underline">
                    {l.label}
                  </Link>
                </li>
              ))}
              {isToolLive('symptom-tracker') && (
                <li className="sm:col-span-2">
                  <Link href={APP_ROUTES.today} className="tap text-sm underline">
                    Your private symptom tracker
                  </Link>
                </li>
              )}
            </ul>
          </nav>
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
