'use client';

import React from 'react';
import Link from 'next/link';
import { HardDrive, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { AppHeader } from '@/components/app/app-header';
import { PWAInstallBanner } from '@/components/app/pwa-install-banner';
import { APP_CONFIG } from '@/lib/config/constants';

export default function SettingsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader
        title="Settings"
        subtitle="Preferences, storage & safety"
        showBack={true}
        backHref="/app/today/"
        showPrivacyBadge={true}
        showSettings={false}
      />

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-5 space-y-6">
        {/* Your data: stored on this device only. There is no cloud option to choose. */}
        <section className="space-y-3" aria-labelledby="data-heading">
          <h2 id="data-heading" className="font-serif font-semibold text-base text-[#231F1D]">
            Your data
          </h2>
          <Card className="p-4 bg-white space-y-2">
            <p className="font-semibold text-sm text-[#231F1D] flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-[#1F5A4C]" />
              Saved in this browser on this device
            </p>
            <p className="text-xs text-[#554E48] leading-relaxed">
              Your tracker and tool entries are kept in this browser&apos;s storage. Nothing is uploaded and nothing is
              deleted automatically. It isn&apos;t synced to other devices, and clearing browsing data can remove it, so
              keep a backup.
            </p>
          </Card>
          <Link
            href="/app/storage/"
            className="flex items-center justify-between gap-3 rounded-2xl border border-[#1F5A4C] bg-[#FDF9F7] p-4 hover:bg-[#E6EFEB]"
          >
            <span>
              <span className="block font-semibold text-sm text-[#231F1D]">Manage storage</span>
              <span className="block text-xs text-[#554E48]">
                See what&apos;s stored, back up or restore, delete old entries or everything.
              </span>
            </span>
            <ChevronRight className="w-5 h-5 shrink-0 text-[#1F5A4C]" aria-hidden="true" />
          </Link>
          <Link href="/app/privacy/" className="inline-block text-xs text-[#1F5A4C] hover:underline font-medium">
            Privacy center
          </Link>
        </section>

        {/* Reminders: only treatment reminders exist, and they are set up on the Treatments page. */}
        <section className="space-y-3" aria-labelledby="reminders-heading">
          <h2 id="reminders-heading" className="font-serif font-semibold text-base text-[#231F1D]">
            Reminders
          </h2>
          <Card className="p-4 bg-white space-y-2">
            <p className="text-xs text-[#554E48] leading-relaxed">
              Reminders for treatments you log (such as a patch change) are set up on the Treatments page, where you can
              allow notifications and choose whether they show the treatment name.
            </p>
            <Link href="/app/treatments/" className="inline-block text-xs text-[#1F5A4C] hover:underline font-semibold">
              Set up treatment reminders
            </Link>
          </Card>
        </section>

        {/* Section 4: Install (the only place, besides after first tool use, that offers installation) */}
        <section className="space-y-2" aria-labelledby="install-heading">
          <h2 id="install-heading" className="font-serif font-semibold text-base text-[#231F1D]">
            Install the app
          </h2>
          <PWAInstallBanner variant="settings" />
        </section>

        {/* Section 5: Legal & App Version */}
        <section className="pt-4 border-t border-[#E5DED5] space-y-2 text-xs text-[#68615C]">
          <div className="flex items-center justify-between py-1">
            <span>App Version:</span>
            <span className="font-mono text-[#231F1D]">{APP_CONFIG.version}</span>
          </div>
          <div className="flex items-center justify-between py-1">
            <span>Storage Status:</span>
            <span className="text-[#2C6E49] font-medium">This device only</span>
          </div>

          <p className="text-xs text-[#5C554F] pt-3 leading-relaxed">
            {APP_CONFIG.medicalDisclaimer}
          </p>
        </section>
      </div>
    </div>
  );
}
