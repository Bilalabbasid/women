import Link from 'next/link';
import { SITE } from '@/lib/site/config';
import { HONESTY_FOOTER } from '@/lib/site/honesty';
import { StorageChoicesButton } from './cookie-banner';
import { APP_ROUTES } from '@/lib/routes';
import { isToolLive } from '@/lib/tools/logic';
import type { Crumb } from '@/lib/seo/jsonld';
import { serializeLd } from '@/lib/seo/jsonld';
import { getSiteData } from '@/lib/content/site-data';
import { MenuSheet, NavGroups, ReadingControls, UrgentLink, type NavGroup } from './menu-sheet';
import { SearchLauncher } from './search-launcher';
import '@/app/styles/chrome.css';

/**
 * Site chrome: server components, plus three small islands (the phone menu
 * sheet, the search overlay launcher, and the theme/text-size controls).
 * "More" on desktop is a native popover with no JavaScript.
 */

export function JsonLd({ data }: { data: Record<string, unknown> | Array<Record<string, unknown>> }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeLd(data) }} />;
}

/**
 * Brand mark + wordmark. Drawn from tokens, so it inverts cleanly in dark mode.
 * `tone` is kept for older callers; both tones now follow the theme.
 */
export function BrandLogo({ size = 28 }: { size?: number; tone?: 'dark' | 'light' }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true" className="shrink-0">
        <rect width="64" height="64" rx="14" fill="var(--accent)" />
        <path d="M13 46V18H19.5L27.5 34.5L35.5 18H42V46H36.5V27.5L29.2 42.5H25.8L18.5 27.5V46H13Z" fill="var(--on-accent)" />
        <path
          d="M38 35.5L43.5 41L53 27.5"
          stroke="var(--on-accent)"
          strokeOpacity=".75"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="font-serif text-[1.35rem] font-semibold tracking-tight text-[var(--ink)]">
        Meno<span className="text-[var(--accent)]">Verdict</span>
      </span>
    </span>
  );
}

/* ------------------------------------------------------------------ navigation model */

/** Desktop's main row (only hubs that exist in this build). */
const PRIMARY = [
  { href: '/symptoms/', label: 'Symptoms' },
  { href: '/treatments/', label: 'Treatments' },
  { href: '/does-it-work/', label: 'Does it work?' },
];

function exists(href: string) {
  return getSiteData().byUrl.has(href);
}

/** Understand · Treat · Tools, built from pages in this build. */
function navGroups(): NavGroup[] {
  const pick = (links: Array<{ href: string; label: string; hint?: string }>) => links.filter((l) => exists(l.href));
  const tools = pick([
    { href: '/tools/stage-guide/', label: 'Where am I in the transition?', hint: 'Short quiz' },
    { href: '/tools/symptoms-checklist/', label: 'Symptoms checklist' },
    { href: '/tools/does-it-work-checker/', label: 'Evidence checker' },
    { href: '/tools/treatment-questions/', label: 'Doctor question builder' },
  ]);
  if (isToolLive('symptom-tracker')) tools.unshift({ href: APP_ROUTES.today, label: 'Your private tracker', hint: 'On this device' });
  tools.push({ href: '/tools/', label: 'All tools' });
  return [
    {
      title: 'Understand',
      links: pick([
        { href: '/perimenopause/', label: 'Perimenopause' },
        { href: '/menopause/', label: 'Menopause' },
        { href: '/postmenopause/', label: 'Postmenopause' },
        { href: '/symptoms/', label: 'Symptoms' },
      ]),
    },
    {
      title: 'Treat',
      links: pick([
        { href: '/treatments/', label: 'Treatments' },
        { href: '/does-it-work/', label: 'Does it work?' },
        { href: '/compare/', label: 'Compare care' },
        { href: '/care/', label: 'Getting care' },
      ]),
    },
    { title: 'Tools', links: tools },
  ];
}

/** Saved pages and install (the tracker's PWA pages), when the tracker is live. */
function pwaLinks() {
  return isToolLive('symptom-tracker')
    ? [
        { href: APP_ROUTES.saved, label: 'Saved' },
        { href: APP_ROUTES.install, label: 'Install the app' },
      ]
    : [];
}

/* ------------------------------------------------------------------ header */

// `hubs` is kept for existing callers; the header builds its groups from this build's pages.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function SiteHeader(_props: { hubs: Array<{ href: string; label: string }> }) {
  const groups = navGroups();
  const primaryHrefs = new Set(PRIMARY.map((p) => p.href));
  // Desktop "More": everything not already in the main row.
  const moreGroups = groups.map((g) => ({ ...g, links: g.links.filter((l) => !primaryHrefs.has(l.href)) }));
  const primary = PRIMARY.filter((p) => exists(p.href));

  return (
    <header role="banner" className="site-header rule-double no-print">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <div className="site-header-row">
        <Link href="/" className="site-logo" aria-label="MenoVerdict home">
          <BrandLogo size={30} />
        </Link>

        <nav aria-label="Main" className="site-nav">
          <ul>
            {primary.map((p) => (
              <li key={p.href}>
                <Link href={p.href} className="site-nav-link">
                  {p.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/tools/" className="site-nav-link">
                Tools
              </Link>
            </li>
          </ul>
        </nav>

        <div className="site-header-actions">
          <SearchLauncher label className="site-nav-link site-search" />
          <button type="button" className="site-nav-link site-more" popoverTarget="site-more" aria-haspopup="true">
            More
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          <div className="site-menu-btn">
            <MenuSheet groups={groups} extra={pwaLinks()} />
          </div>
        </div>
      </div>

      {/* Desktop "More": native popover (no JS), light-dismiss and Esc to close. */}
      <div id="site-more" popover="auto" className="more-pop" role="dialog" aria-label="More">
        <NavGroups groups={moreGroups} extra={pwaLinks()} />
        <ReadingControls />
        <UrgentLink />
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ footer */

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

function FooterColumn({ title, links }: { title: string; links: Array<{ href: string; label: string }> }) {
  if (links.length === 0) return null;
  return (
    <div>
      <p className="footer-col-title">{title}</p>
      <ul className="mt-2">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="footer-link">
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
    <footer role="contentinfo" className="site-footer">
      <div className="wrap pt-12 pb-8">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_2fr]">
          <div className="space-y-4">
            <Link href="/" className="inline-flex no-underline" aria-label="MenoVerdict home">
              <BrandLogo size={34} />
            </Link>
            <p className="font-serif text-[1.3rem] leading-snug font-medium text-[var(--ink)]">{SITE.tagline}</p>
            <p className="max-w-sm text-[1.0625rem] leading-relaxed text-[var(--ink-muted)]">
              Independent, evidence-graded information on perimenopause and menopause. Every claim graded, every
              source linked. Free, with no ads and no sponsors.
            </p>
            <UrgentLink />
          </div>

          <nav aria-label="Footer" className="grid gap-8 sm:grid-cols-3">
            <FooterColumn title="Explore" links={explore} />
            <FooterColumn title="Trust & method" links={[...TRUST_LINKS, ...extraLinks]} />
            <div>
              <FooterColumn title="Legal & contact" links={LEGAL_LINKS} />
              <StorageChoicesButton className="footer-link cursor-pointer border-0 bg-transparent p-0 text-left" />
            </div>
          </nav>
        </div>

        {/* Standard notice */}
        <div className="footer-notice">
          <p data-honesty="footer">{HONESTY_FOOTER}</p>
        </div>

        <div className="mt-6 flex flex-col gap-2 border-t border-[var(--rule)] pt-5 text-[1rem] text-[var(--ink-muted)] sm:flex-row sm:items-center sm:justify-between">
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
  // Phones get one short "‹ Parent" link (the H1 is right below); wider screens the full trail.
  const parent = [...crumbs.slice(0, -1)].reverse().find((c) => c.linked);
  return (
    <nav aria-label="Breadcrumb" className="text-[1rem] text-[var(--color-ink-muted)]">
      {parent && (
        <Link href={parent.path} className="tap gap-1 font-bold text-[var(--link)] no-underline hover:underline sm:hidden">
          <span aria-hidden="true">‹</span> {parent.name}
        </Link>
      )}
      <ol className={`${parent ? 'hidden sm:flex' : 'flex'} flex-wrap items-center gap-x-2`}>
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
