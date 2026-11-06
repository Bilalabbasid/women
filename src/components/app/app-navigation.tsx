'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  CalendarDays,
  Clock,
  Pill,
  BarChart2,
  Stethoscope,
} from 'lucide-react';
import { clsx } from 'clsx';

const NAV_ITEMS = [
  { href: '/app/today/', label: 'Today', icon: CalendarDays },
  { href: '/app/timeline/', label: 'Timeline', icon: Clock },
  { href: '/app/treatments/', label: 'Treatments', icon: Pill },
  { href: '/app/insights/', label: 'Insights', icon: BarChart2 },
  { href: '/app/doctor-report/', label: 'Doctor', icon: Stethoscope },
];

export function AppNavigation() {
  const rawPath = usePathname() ?? '/';
  // Normalise so comparisons work whether or not the router reports a trailing slash.
  const pathname = rawPath.endsWith('/') ? rawPath : `${rawPath}/`;

  // Hide on public landing and onboarding screens
  if (pathname === '/' || pathname === '/app/onboarding/') {
    return null;
  }

  return (
    <>
      {/* Mobile Bottom Navigation (screens < 768px) */}
      <nav
        aria-label="Bottom Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#F7F6F2]/95 backdrop-blur-lg border-t border-[#E5DED5] pb-[env(safe-area-inset-bottom,0px)]"
      >
        <div className="grid grid-cols-5 h-16 max-w-lg mx-auto px-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== '/app/today/' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'flex flex-col items-center justify-center gap-1 transition-colors select-none group min-h-[48px]',
                  isActive
                    ? 'text-[#1F5A4C] font-semibold'
                    : 'text-[#5C554F] hover:text-[#231F1D]'
                )}
              >
                <div
                  className={clsx(
                    'w-9 h-7 rounded-full flex items-center justify-center transition-all',
                    isActive ? 'bg-[#E6EFEB]' : 'group-hover:bg-[#EEF1EF]'
                  )}
                >
                  <Icon
                    className={clsx(
                      'w-5 h-5 transition-transform',
                      isActive ? 'stroke-[2.25] scale-105' : 'stroke-[1.75]'
                    )}
                  />
                </div>
                <span className="text-xs leading-none tracking-tight">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop / Tablet Sub-Header Navigation (screens >= 768px) */}
      <div className="hidden md:block border-b border-[#E5DED5] bg-white">
        <div className="max-w-2xl mx-auto px-4 flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== '/app/today/' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                  isActive
                    ? 'border-[#1F5A4C] text-[#1F5A4C]'
                    : 'border-transparent text-[#68615C] hover:text-[#231F1D] hover:border-[#D9D1C7]'
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
