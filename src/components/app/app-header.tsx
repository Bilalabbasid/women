'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, ChevronLeft, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';

export interface AppHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  backHref?: string;
  showPrivacyBadge?: boolean;
  showSettings?: boolean;
}

export function AppHeader({
  title,
  subtitle,
  showBack = false,
  backHref,
  showPrivacyBadge = true,
  showSettings = true,
}: AppHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (backHref) {
      router.push(backHref);
    } else {
      router.back();
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-[#EBE3D8] transition-all">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        {/* Left: Back or Brand Icon */}
        <div className="flex items-center gap-2.5">
          {showBack ? (
            <button
              onClick={handleBack}
              aria-label="Go back"
              className="w-10 h-10 -ml-1 rounded-xl flex items-center justify-center text-[#554E48] hover:bg-[#F3EFEA] active:scale-95 transition"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          ) : (
            <Link
              href="/app/today/"
              className="flex items-center gap-2 group"
              aria-label="MenoWell Dashboard"
            >
              <div className="w-8 h-8 rounded-lg bg-[#965342] flex items-center justify-center shadow-xs">
                <span className="text-white font-serif font-bold text-base leading-none">M</span>
              </div>
            </Link>
          )}

          <div>
            <h1 className="text-base sm:text-lg font-serif font-semibold text-[#231F1D] leading-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs text-[#68615C] mt-0.5 line-clamp-1">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Right: Privacy Indicator & Settings */}
        <div className="flex items-center gap-2">
          {showPrivacyBadge && (
            <Link
              href="/app/privacy/"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#EDF3EF] text-[#2C6E49] border border-[#CFDFD5] hover:bg-[#E2ECE5] transition"
              title="Your health data stays on this device"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#2C6E49]" />
              <span className="hidden xs:inline">Device Only</span>
            </Link>
          )}

          {showSettings && (
            <Link
              href="/app/settings/"
              aria-label="App Settings"
              className="w-9 h-9 rounded-xl flex items-center justify-center text-[#68615C] hover:bg-[#F3EFEA] hover:text-[#231F1D] transition"
            >
              <Settings className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
