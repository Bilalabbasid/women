import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader, SiteFooter } from '@/components/site/site-chrome';
import { navHubs } from '@/lib/content/site-data';
import { APP_ROUTES } from '@/lib/routes';
import { isToolLive } from '@/lib/tools/logic';
import { IlloEmpty } from '@/components/ui/illustrations';

export const metadata: Metadata = {
  title: 'Page not found',
};

/** Helpful 404 (served with a real 404 status): search plus the main hubs. */
export default function NotFound() {
  const hubs = navHubs();
  const links = [
    ...hubs,
    { href: '/tools/', label: 'Tools' },
    ...(isToolLive('symptom-tracker') ? [{ href: APP_ROUTES.today, label: 'Your private symptom tracker' }] : []),
  ];
  return (
    <>
      <SiteHeader hubs={hubs} />
      <main id="main" className="wrap max-w-[42rem] space-y-7 py-12">
        <IlloEmpty className="h-24 w-24" />
        <div>
          <h1 className="text-[length:var(--fs-h1)] leading-[1.1]">We couldn&apos;t find that page</h1>
          <p className="mt-3 text-[length:var(--fs-lead)] text-[var(--ink-muted)]">
            It may have moved, or the address may be mistyped. Try searching, or start from one of these pages.
          </p>
        </div>
        <form role="search" action="/search/" method="get" className="field">
          <label htmlFor="nf-q" className="label">
            Search the site
          </label>
          <div className="flex gap-2">
            <div className="search-input flex-1">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <input id="nf-q" name="q" type="search" className="input" placeholder="Try “hot at night”" />
            </div>
            <button type="submit" className="btn btn-primary">
              Search
            </button>
          </div>
        </form>
        <ul className="row-list" role="list">
          {links.map((h) => (
            <li key={h.href}>
              <Link href={h.href} className="row">
                <span className="row-main row-title">{h.label}</span>
                <span aria-hidden="true" className="text-[var(--ink-muted)]">
                  →
                </span>
              </Link>
            </li>
          ))}
          <li>
            <Link href="/urgent-help/" className="row">
              <span className="row-main row-title text-[var(--urgent)]">Urgent help and crisis lines</span>
              <span aria-hidden="true" className="text-[var(--urgent)]">
                →
              </span>
            </Link>
          </li>
        </ul>
      </main>
      <SiteFooter links={[]} hubs={hubs} />
    </>
  );
}
