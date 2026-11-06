import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader, SiteFooter } from '@/components/site/site-chrome';
import { navHubs } from '@/lib/content/site-data';
import { APP_ROUTES } from '@/lib/routes';
import { isToolLive } from '@/lib/tools/logic';

export const metadata: Metadata = {
  title: 'Page not found',
};

/** Helpful 404 (served with a real 404 status): search plus the main hubs. */
export default function NotFound() {
  const hubs = navHubs();
  return (
    <>
      <SiteHeader hubs={hubs} />
      <main id="main" className="mx-auto w-full max-w-3xl space-y-6 px-4 py-10">
        <h1 className="text-3xl">We couldn&apos;t find that page</h1>
        <p>It may have moved, or the address may be mistyped. Try searching, or start from one of these pages.</p>
        <form role="search" action="/search/" method="get" className="space-y-1">
          <label htmlFor="nf-q" className="block font-semibold">
            Search the site
          </label>
          <div className="flex gap-2">
            <input
              id="nf-q"
              name="q"
              type="search"
              className="min-h-[48px] flex-1 rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)] px-4"
            />
            <button type="submit" className="tap rounded-xl bg-[var(--color-accent)] px-5 font-semibold text-white">
              Search
            </button>
          </div>
        </form>
        <ul className="space-y-1">
          {hubs.map((h) => (
            <li key={h.href}>
              <Link href={h.href} className="tap text-[var(--color-link)] underline">
                {h.label}
              </Link>
            </li>
          ))}
          <li>
            <Link href="/tools/" className="tap text-[var(--color-link)] underline">
              Tools
            </Link>
          </li>
          {isToolLive('symptom-tracker') && (
          <li>
            <Link href={APP_ROUTES.today} className="tap text-[var(--color-link)] underline">
              Your private symptom tracker
            </Link>
          </li>
          )}
          <li>
            <Link href="/urgent-help/" className="tap font-semibold text-[var(--color-urgent)] underline">
              Urgent help and crisis lines
            </Link>
          </li>
        </ul>
      </main>
      <SiteFooter links={[]} />
    </>
  );
}
