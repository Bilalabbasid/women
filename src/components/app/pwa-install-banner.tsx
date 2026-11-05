'use client';

import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { Download, Share2, PlusSquare, X, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/button';

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

function getStandaloneServerSnapshot() {
  return false;
}

function getIOSSnapshot() {
  const userAgent = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(userAgent);
}

function getIOSServerSnapshot() {
  return false;
}

export function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const isStandalone = useSyncExternalStore(
    subscribeStandalone,
    getStandaloneSnapshot,
    getStandaloneServerSnapshot
  );

  const isIOS = useSyncExternalStore(
    subscribeNoop,
    getIOSSnapshot,
    getIOSServerSnapshot
  );

  useEffect(() => {
    // Capture Android/Desktop PWA prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else if (isIOS) {
      setShowIOSModal(true);
    }
  };

  if (isStandalone || bannerDismissed) {
    return null;
  }

  // Show if either native prompt is available or it's an iOS browser
  if (!deferredPrompt && !isIOS) {
    return null;
  }

  return (
    <>
      <div
        role="region"
        aria-label="Install App"
        className="bg-[#F7EFEA] border-b border-[#E8D4C8] px-4 py-2.5 transition-all"
      >
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#965342] text-white flex items-center justify-center shrink-0">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#231F1D]">Install MenoWell</p>
              <p className="text-[11px] text-[#68615C]">
                Works offline, opens instantly from your home screen.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="primary"
              onClick={handleInstallClick}
              className="text-xs px-3 min-h-[34px]"
            >
              Install
            </Button>
            <button
              onClick={() => setBannerDismissed(true)}
              aria-label="Dismiss install banner"
              className="text-[#8A817A] hover:text-[#231F1D] p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* iOS Install Instruction Modal */}
      {showIOSModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 animate-in fade-in"
        >
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-[#E5DED5] space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#965342] flex items-center justify-center text-white font-serif font-bold text-lg">
                  M
                </div>
                <div>
                  <h3 className="font-serif font-semibold text-lg text-[#231F1D]">
                    Install on iPhone
                  </h3>
                  <p className="text-xs text-[#68615C]">Quick 3-step home screen setup</p>
                </div>
              </div>
              <button
                onClick={() => setShowIOSModal(false)}
                className="text-[#8A817A] hover:text-[#231F1D] p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <ol className="space-y-3.5 text-sm text-[#3E3834]">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-[#F3EFEA] text-[#965342] font-semibold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <span className="leading-snug">
                  Tap the <strong className="text-[#231F1D]">Share</strong> button{' '}
                  <Share2 className="w-4 h-4 inline text-[#965342] mx-0.5" /> at the bottom of Safari.
                </span>
              </li>

              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-[#F3EFEA] text-[#965342] font-semibold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <span className="leading-snug">
                  Scroll down and tap{' '}
                  <strong className="text-[#231F1D]">Add to Home Screen</strong>{' '}
                  <PlusSquare className="w-4 h-4 inline text-[#965342] mx-0.5" />.
                </span>
              </li>

              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-[#F3EFEA] text-[#965342] font-semibold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <span className="leading-snug">
                  Tap <strong className="text-[#231F1D]">Add</strong> in the top right corner. Done!
                </span>
              </li>
            </ol>

            <div className="bg-[#EFF7F2] rounded-xl p-3 flex items-center gap-2.5 text-xs text-[#2C6E49]">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#2C6E49]" />
              <span>No App Store account needed. 100% private to this device.</span>
            </div>

            <Button
              variant="outline"
              fullWidth
              onClick={() => setShowIOSModal(false)}
            >
              Got it
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
