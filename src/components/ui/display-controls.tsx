'use client';

import { useEffect, useState } from 'react';
import {
  DEFAULT_DISPLAY,
  DISPLAY_EVENT,
  readDisplay,
  saveDisplay,
  type DisplayPrefs,
  type TextSize,
  type ThemeChoice,
} from '@/lib/site/display';
import { canStorePreferences } from '@/lib/storage/consent';

/** Theme (System / Light / Dark) and text size (A / A+ / A++). A small island: no deps. */

function useDisplay(): [DisplayPrefs, (next: Partial<DisplayPrefs>) => void] {
  // Server and first client render agree on the default; the real value (already
  // applied to <html> by the paint script) is read after mount.
  const [prefs, setPrefs] = useState<DisplayPrefs>(DEFAULT_DISPLAY);
  useEffect(() => {
    const sync = () => setPrefs(readDisplay());
    sync();
    window.addEventListener(DISPLAY_EVENT, sync);
    return () => window.removeEventListener(DISPLAY_EVENT, sync);
  }, []);
  const update = (next: Partial<DisplayPrefs>) => {
    const merged = { ...readDisplay(), ...next };
    saveDisplay(merged, canStorePreferences());
    setPrefs(merged);
  };
  return [prefs, update];
}

const THEMES: Array<{ value: ThemeChoice; label: string; icon: React.ReactNode }> = [
  {
    value: 'system',
    label: 'System',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <rect x="3" y="4" width="18" height="12" rx="2" />
        <path d="M8 20h8M12 16v4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    value: 'light',
    label: 'Light',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    ),
  },
  {
    value: 'dark',
    label: 'Dark',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
        <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z" />
      </svg>
    ),
  },
];

const SIZES: Array<{ value: TextSize; label: string; name: string; scale: string }> = [
  { value: 'md', label: 'A', name: 'Standard text', scale: '1rem' },
  { value: 'lg', label: 'A+', name: 'Larger text', scale: '1.12rem' },
  { value: 'xl', label: 'A++', name: 'Largest text', scale: '1.25rem' },
];

export function ThemeControl({ showLabels = true }: { showLabels?: boolean }) {
  const [prefs, update] = useDisplay();
  return (
    <div className="seg-control" role="group" aria-label="Colour theme">
      {THEMES.map((t) => (
        <button
          key={t.value}
          type="button"
          aria-pressed={prefs.t === t.value}
          aria-label={showLabels ? undefined : `${t.label} theme`}
          onClick={() => update({ t: t.value })}
        >
          {t.icon}
          {showLabels && <span>{t.label}</span>}
        </button>
      ))}
    </div>
  );
}

export function TextSizeControl() {
  const [prefs, update] = useDisplay();
  return (
    <div className="seg-control" role="group" aria-label="Text size">
      {SIZES.map((s) => (
        <button
          key={s.value}
          type="button"
          aria-pressed={prefs.z === s.value}
          aria-label={s.name}
          onClick={() => update({ z: s.value })}
          style={{ fontSize: s.scale }}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}

export function ThemeToggle({ className }: { className?: string }) {
  const [prefs, update] = useDisplay();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = mounted && (prefs.t === 'dark' || document.documentElement.getAttribute('data-theme') === 'dark');

  const toggle = () => {
    const next = isDark ? 'light' : 'dark';
    update({ t: next });
    document.documentElement.setAttribute('data-theme', next);
  };

  return (
    <button
      type="button"
      className={className ?? 'site-nav-link'}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={toggle}
    >
      {isDark ? (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
          <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z" />
        </svg>
      )}
      <span className="hidden md:inline text-sm font-semibold">{isDark ? 'Light' : 'Dark'}</span>
    </button>
  );
}

/** Both controls with labels: for the menu sheet, settings and the design-system page. */
export function DisplayControls() {
  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <span className="label" id="dc-size">
          Text size
        </span>
        <TextSizeControl />
      </div>
      <div className="grid gap-2">
        <span className="label">Theme</span>
        <ThemeControl />
      </div>
    </div>
  );
}
