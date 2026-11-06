'use client';

import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { Download, Share2, PlusSquare, X } from 'lucide-react';
import { Button } from '../ui/button';
import { hasUsedTool } from '@/lib/pwa/install-gate';

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
  const toolUsed = useSyncExternalStore(subscribeNoop, hasUsedTool, serverFalse);
  const isStandalone = useSyncExternalStore(subscribeStandalone, getStandaloneSnapshot, serverFalse);
  const isIOS = useSyncExternalStore(subscribeNoop, getIOSSnapshot, serverFalse);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const canInstall = Boolean(deferredPrompt) || isIOS;

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
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-3 sm:items-center"
    >
      <div className="w-full max-w-sm space-y-5 rounded-3xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)] p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <h3 id="ios-install-title" className="font-serif text-lg font-semibold text-[var(--color-ink)]">
            Install on iPhone or iPad
          </h3>
          <button
            type="button"
            onClick={() => setShowIOSModal(false)}
            aria-label="Close install instructions"
            className="min-h-[44px] min-w-[44px] p-2 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <ol className="list-decimal space-y-3 pl-5 text-[var(--color-ink-muted)]">
          <li>
            In Safari, tap <strong>Share</strong> <Share2 className="mx-0.5 inline h-4 w-4" aria-hidden="true" />.
          </li>
          <li>
            Tap <strong>Add to Home Screen</strong>{' '}
            <PlusSquare className="mx-0.5 inline h-4 w-4" aria-hidden="true" />.
          </li>
          <li>
            Tap <strong>Add</strong>.
          </li>
        </ol>
        <p className="text-[var(--color-ink-muted)]">No App Store account needed. Your journal stays on this device.</p>
        <Button variant="outline" fullWidth onClick={() => setShowIOSModal(false)}>
          Got it
        </Button>
      </div>
    </div>
  );

  if (variant === 'settings') {
    return (
      <div className="space-y-2">
        {isStandalone ? (
          <p className="text-[var(--color-ink-muted)]">The app is already installed on this device.</p>
        ) : canInstall ? (
          <Button variant="outline" onClick={handleInstallClick} className="gap-2">
            <Download className="h-4 w-4" aria-hidden="true" />
            Install on this device
          </Button>
        ) : (
          <p className="text-[var(--color-ink-muted)]">
            Your browser doesn&apos;t offer installation here. In Chrome or Edge, use the browser menu
            and choose &ldquo;Install app&rdquo;. On iPhone, use Safari&apos;s Share menu.
          </p>
        )}
        {iosModal}
      </div>
    );
  }

  if (isStandalone || bannerDismissed || !toolUsed || !canInstall) return null;

  return (
    <>
      <div role="region" aria-label="Install the app" className="border-b border-[var(--color-accent)]/30 bg-[var(--color-accent-soft)] px-4 py-2.5">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
          <p className="text-[var(--color-ink)]">
            <strong>Install the tracker</strong> so it opens from your home screen and works offline.
          </p>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="primary" onClick={handleInstallClick}>
              Install
            </Button>
            <button
              type="button"
              onClick={() => setBannerDismissed(true)}
              aria-label="Dismiss install banner"
              className="min-h-[44px] min-w-[44px] p-2 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
      {iosModal}
    </>
  );
}
