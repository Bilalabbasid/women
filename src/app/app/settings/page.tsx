'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  HardDrive,
  Cloud,
  Check,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AppHeader } from '@/components/app/app-header';
import { PWAInstallBanner } from '@/components/app/pwa-install-banner';
import { APP_CONFIG } from '@/lib/config/constants';

export default function SettingsPage() {
  const [storageMode, setStorageMode] = useState<'device_only' | 'temporary_cloud'>('device_only');
  const [retentionDays, setRetentionDays] = useState<number>(30);
  const [notifications, setNotifications] = useState<boolean>(true);
  const [savedToast, setSavedToast] = useState(false);

  const handleSave = () => {
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);
  };

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
        {savedToast && (
          <div className="bg-[#EFF7F2] border border-[#CDE0D4] rounded-2xl p-3 text-xs text-[#2C6E49] flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>Preferences updated locally on this device.</span>
          </div>
        )}

        {/* Section 1: Storage & Cloud Policy */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-serif font-semibold text-base text-[#231F1D]">
              Data Storage Preference
            </h2>
            <Link href="/app/privacy/" className="text-xs text-[#965342] hover:underline font-medium">
              Privacy Dashboard
            </Link>
          </div>

          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => {
                setStorageMode('device_only');
                handleSave();
              }}
              className={`w-full text-left p-4 rounded-2xl border transition-all ${
                storageMode === 'device_only'
                  ? 'border-[#965342] bg-[#FDF9F7] shadow-xs ring-1 ring-[#965342]'
                  : 'border-[#E5DED5] bg-white hover:border-[#D0C7BC]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-[#231F1D] flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-[#965342]" />
                  Option A — Device Only (Default)
                </span>
                <Badge variant="success">100% Local</Badge>
              </div>
              <p className="text-xs text-[#68615C] mt-1">
                Zero health records persisted in cloud database. Stored in IndexedDB.
              </p>
            </button>

            <button
              type="button"
              onClick={() => {
                setStorageMode('temporary_cloud');
                handleSave();
              }}
              className={`w-full text-left p-4 rounded-2xl border transition-all ${
                storageMode === 'temporary_cloud'
                  ? 'border-[#965342] bg-[#FDF9F7] shadow-xs ring-1 ring-[#965342]'
                  : 'border-[#E5DED5] bg-white hover:border-[#D0C7BC]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-[#231F1D] flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-[#965342]" />
                  Option B — Temporary Encrypted Cloud
                </span>
                <Badge variant="warning">Auto-Purge</Badge>
              </div>
              <p className="text-xs text-[#68615C] mt-1">
                Client-encrypted with automated hard deletion after your chosen retention window.
              </p>
            </button>
          </div>
        </section>

        {/* Section 2: Retention Window (if cloud enabled) */}
        {storageMode === 'temporary_cloud' && (
          <section className="space-y-3 p-4 bg-white rounded-2xl border border-[#E5DED5]">
            <h3 className="font-semibold text-sm text-[#231F1D]">
              Cloud Retention Window
            </h3>
            <p className="text-xs text-[#68615C]">
              Records older than this window are permanently purged by the backend deletion engine.
            </p>

            <div className="grid grid-cols-5 gap-2 pt-1">
              {[7, 14, 30, 60, 90].map((days) => (
                <button
                  key={days}
                  onClick={() => {
                    setRetentionDays(days);
                    handleSave();
                  }}
                  className={`py-2 rounded-xl text-xs font-semibold border transition ${
                    retentionDays === days
                      ? 'bg-[#965342] border-[#965342] text-white'
                      : 'bg-[#FAF8F5] border-[#E5DED5] text-[#554E48]'
                  }`}
                >
                  {days}d
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Section 3: Reminders & Notifications */}
        <section className="space-y-3">
          <h2 className="font-serif font-semibold text-base text-[#231F1D]">
            Reminders
          </h2>

          <Card className="p-4 bg-white flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="font-semibold text-sm text-[#231F1D]">Daily Check-in Reminder</p>
              <p className="text-xs text-[#68615C]">Gentle prompt at 8:30 PM</p>
            </div>
            <button
              onClick={() => {
                setNotifications(!notifications);
                handleSave();
              }}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                notifications ? 'bg-[#965342]' : 'bg-[#D9D1C7]'
              }`}
              aria-label="Toggle notifications"
            >
              <span
                className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                  notifications ? 'left-7' : 'left-1'
                }`}
              />
            </button>
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
            <span className="text-[#2C6E49] font-medium">Local-First (IndexedDB ready)</span>
          </div>

          <p className="text-[11px] text-[#7A736E] pt-3 leading-relaxed">
            {APP_CONFIG.medicalDisclaimer}
          </p>
        </section>
      </div>
    </div>
  );
}
