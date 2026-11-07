'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Icon } from './kit';
import { AppTopTabs } from './app-navigation';

export interface AppHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  backHref?: string;
  showPrivacyBadge?: boolean;
  showSettings?: boolean;
}

/** The tracker's top bar: brand mark or back, screen title, "On this device", settings. */
export function AppHeader({
  title,
  subtitle,
  showBack = false,
  backHref,
  showPrivacyBadge = true,
  showSettings = true,
}: AppHeaderProps) {
  const router = useRouter();

  return (
    <header className="app-topbar no-print">
      <div className="app-topbar-row">
        {showBack ? (
          <button
            type="button"
            onClick={() => (backHref ? router.push(backHref) : router.back())}
            aria-label="Go back"
            className="icon-btn -ml-2"
          >
            <Icon.Back width={24} height={24} />
          </button>
        ) : (
          <Link href="/" className="icon-btn -ml-2" aria-label="MenoVerdict home">
            <svg width="30" height="30" viewBox="0 0 64 64" aria-hidden="true">
              <rect width="64" height="64" rx="14" fill="var(--accent)" />
              <path d="M13 46V18H19.5L27.5 34.5L35.5 18H42V46H36.5V27.5L29.2 42.5H25.8L18.5 27.5V46H13Z" fill="var(--on-accent)" />
              <path d="M38 35.5L43.5 41L53 27.5" stroke="var(--on-accent)" strokeOpacity=".75" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </Link>
        )}

        <div className="min-w-0 flex-1">
          <h1 className="app-title truncate">{title}</h1>
          {subtitle && <p className="app-subtitle line-clamp-2">{subtitle}</p>}
        </div>

        {showPrivacyBadge && (
          <Link href="/app/privacy/" className="device-chip" aria-label="Your entries stay on this device. How privacy works">
            <Icon.Lock width={16} height={16} />
            <span className="min-[400px]:hidden">On device</span>
            <span className="hidden min-[400px]:inline">On this device</span>
          </Link>
        )}

        {showSettings && (
          <Link href="/app/settings/" aria-label="Settings" className="icon-btn">
            <Icon.Settings width={22} height={22} />
          </Link>
        )}
      </div>
      <AppTopTabs />
    </header>
  );
}
