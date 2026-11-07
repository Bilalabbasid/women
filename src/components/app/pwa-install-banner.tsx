'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { Download, Share2, PlusSquare, X } from 'lucide-react';
import { Button } from '../ui/button';
import { hasUsedTool } from '@/lib/pwa/install-gate';
import { setPreference } from '@/lib/storage/consent';
import { APP_ROUTES } from '@/lib/routes';

const DISMISS_KEY = 'menoverdict_install_dismissed_until';
const DISMISS_DAYS = 30;

function getDismissedSnapshot() {
  try {
    const until = Number(window.localStorage.getItem(DISMISS_KEY));
    return Number.isFinite(until) && until > Date.now();
  } catch {
    return false;
  }
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function subscribeNoop() {
  return () => {};
}

function subscribeStandalone(callback: () => void) {
  const mql = window.matchMedia('(display-mode: standalone)');
  mql.addEventListener('change', callback);
  return () => mql.removeEventListener('change', callback);
}

function getStandaloneSnapshot() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function getIOSSnapshot() {
  return /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
}

const serverFalse = () => false;

/**
 * Install prompt. AGENTS.md: never interrupt reading; offer installation only
 * after a tool is used or from a settings link.
 *
 * - variant "banner": rendered only inside the private tracker, and only after
 *   she has saved at least one check-in (hasUsedTool()).
 * - variant "settings": an inline control on the Settings screen.
 */
export function PWAInstallBanner({ variant = 'banner' }: { variant?: 'banner' | 'settings' }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [installed, setInstalled] = useState(false);
  const dismissedEarlier = useSyncExternalStore(subscribeNoop, getDismissedSnapshot, serverFalse);
  const toolUsed = useSyncExternalStore(subscribeNoop, hasUsedTool, serverFalse);
  const isStandalone = useSyncExternalStore(subscribeStandalone, getStandaloneSnapshot, serverFalse);
  const isIOS = useSyncExternalStore(subscribeNoop, getIOSSnapshot, serverFalse);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const handleInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const canInstall = Boolean(deferredPrompt) || isIOS;

  // Hidden for 30 days after closing it (remembered only if she allowed preferences).
  const dismiss = () => {
    setBannerDismissed(true);
    setPreference(DISMISS_KEY, String(Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000));
  };

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSModal(true);
    }
  };

  const iosModal = showIOSModal && (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ios-install-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-[var(--scrim)] sm:items-center sm:p-4"
    >
      <div className="w-full max-w-md space-y-4 rounded-t-[var(--radius-lg)] border border-[var(--rule)] bg-[var(--paper-raised)] p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] shadow-[var(--shadow-lift)] sm:rounded-[var(--radius-lg)] sm:pb-5">
        <div className="flex items-start justify-between gap-3">
          <h3 id="ios-install-title" className="font-serif text-[1.35rem] font-semibold text-[var(--ink)]">
            Install on iPhone or iPad
          </h3>
          <button
            type="button"
            onClick={() => setShowIOSModal(false)}
            aria-label="Close install instructions"
            className="icon-btn -mr-2 -mt-1 text-[var(--ink-muted)]"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <ol className="step-list">
          <li>
            <span className="step-title">
              In Safari, tap <strong>Share</strong>{' '}
              <Share2 className="mx-0.5 inline h-4 w-4 align-[-2px] text-[var(--accent)]" aria-hidden="true" />
            </span>
          </li>
          <li>
            <span className="step-title">
              Tap <strong>Add to Home Screen</strong>{' '}
              <PlusSquare className="mx-0.5 inline h-4 w-4 align-[-2px] text-[var(--accent)]" aria-hidden="true" />
            </span>
          </li>
          <li>
            <span className="step-title">
              Tap <strong>Add</strong>
            </span>
          </li>
        </ol>
        <p className="text-[var(--ink-muted)]">No App Store account needed. Your journal stays on this device.</p>
        <Button variant="secondary" fullWidth onClick={() => setShowIOSModal(false)}>
          Got it
        </Button>
      </div>
    </div>
  );

  if (variant === 'settings') {
    return (
      <div className="space-y-2">
        {isStandalone || installed ? (
          <p className="flex items-center gap-2 font-bold text-[var(--g-strong-ink)]">
            <span aria-hidden="true" className="grid h-6 w-6 place-items-center rounded-full bg-[var(--g-strong-soft)]">
              ✓
            </span>
            The app is already installed on this device.
          </p>
        ) : canInstall ? (
          <Button variant="primary" onClick={handleInstallClick}>
            <Download className="h-5 w-5" aria-hidden="true" />
            Install now
          </Button>
        ) : (
          <p className="text-[var(--ink-muted)]">
            Your browser doesn&apos;t offer installation here. In Chrome or Edge, use the browser menu
            and choose &ldquo;Install app&rdquo;. On iPhone, use Safari&apos;s Share menu.
          </p>
        )}
        {iosModal}
      </div>
    );
  }

  if (isStandalone || installed || bannerDismissed || dismissedEarlier || !toolUsed || !canInstall) return null;

  return (
    <>
      <div role="region" aria-label="Install the app" className="no-print border-b border-[var(--rule)] bg-[var(--accent-soft)]">
        <div className="mx-auto flex max-w-[42rem] items-center gap-3 py-2 pr-1 pl-4">
          <span aria-hidden="true" className="hidden h-10 w-10 shrink-0 place-items-center rounded-[var(--radius)] bg-[var(--paper-raised)] text-[var(--accent)] min-[420px]:grid">
            <Download className="h-5 w-5" />
          </span>
          <p className="min-w-0 flex-1 text-[1rem] leading-snug text-[var(--ink)]">
            <strong>Install MenoVerdict</strong> — works offline, your data stays on this phone.{' '}
            <a href={APP_ROUTES.install} className="link">
              How it works
            </a>
          </p>
          <Button size="sm" variant="primary" onClick={handleInstallClick} className="shrink-0">
            Install
          </Button>
          <button type="button" onClick={dismiss} aria-label="Dismiss install banner" className="icon-btn shrink-0 text-[var(--ink-muted)]">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>
      {iosModal}
    </>
  );
}
