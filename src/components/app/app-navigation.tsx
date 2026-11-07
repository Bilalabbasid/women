'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from './kit';

/**
 * Tracker navigation: a bottom tab bar on phones (≥64px targets, safe-area
 * aware) and a top tab row on tablets and desktop.
 */
const NAV_ITEMS = [
  { href: '/app/today/', label: 'Today', icon: Icon.Today },
  { href: '/app/timeline/', label: 'Timeline', icon: Icon.Timeline },
  { href: '/app/treatments/', label: 'Treatments', icon: Icon.Treatments },
  { href: '/app/insights/', label: 'Insights', icon: Icon.Insights },
  { href: '/app/doctor-report/', label: 'Report', icon: Icon.Report },
];

export function AppNavigation() {
  const rawPath = usePathname() ?? '/';
  // Normalise so comparisons work whether or not the router reports a trailing slash.
  const pathname = rawPath.endsWith('/') ? rawPath : `${rawPath}/`;

  // Hide on public landing and onboarding screens
  if (pathname === '/' || pathname === '/app/onboarding/') {
    return null;
  }

  const isActive = (href: string) => pathname === href || (href !== '/app/today/' && pathname.startsWith(href));

  return (
    <>
      <nav aria-label="Tracker" className="tab-bar no-print md:hidden">
        <ul>
          {NAV_ITEMS.map(({ href, label, icon: I }) => (
            <li key={href}>
              <Link href={href} aria-current={isActive(href) ? 'page' : undefined}>
                <I />
                <span>{label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <nav aria-label="Tracker" className="tab-top no-print hidden md:block">
        <ul>
          {NAV_ITEMS.map(({ href, label, icon: I }) => (
            <li key={href}>
              <Link href={href} aria-current={isActive(href) ? 'page' : undefined}>
                <I />
                <span>{label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
