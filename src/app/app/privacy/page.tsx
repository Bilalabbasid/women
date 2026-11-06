'use client';

import React, { useState, useEffect } from 'react';
import {
  HardDrive,
  Cloud,
  Download,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  EyeOff,
  Cpu,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AppHeader } from '@/components/app/app-header';
import Link from 'next/link';
import { clearEverything } from '@/lib/storage/manager';
import { ExportService } from '@/lib/export/export-data';
import { db } from '@/lib/db/db';

export default function PrivacyCenterPage() {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletedSuccess, setDeletedSuccess] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [counts, setCounts] = useState<{ checkins: number; symptoms: number; treatments: number }>({
    checkins: 0,
    symptoms: 0,
    treatments: 0,
  });
  const [reloadTrigger, setReloadTrigger] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function loadCounts() {
      const cCount = await db.checkins.count();
      const sCount = await db.symptoms.count();
      const tCount = await db.treatments.count();
      if (!isMounted) return;
      setCounts({ checkins: cCount, symptoms: sCount, treatments: tCount });
    }

    void loadCounts();

    return () => {
      isMounted = false;
    };
  }, [reloadTrigger]);

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      await ExportService.downloadJsonArchive();
    } finally {
      setIsExporting(false);
    }
  };

  const handleClearLocal = async () => {
    // Every table plus this site's own localStorage keys (not other sites' or unrelated keys).
    await clearEverything();
    setReloadTrigger((n) => n + 1);
    setDeletedSuccess(true);
    setShowDeleteModal(false);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader
        title="Privacy Center"
        subtitle="Your data sovereignty dashboard"
        showPrivacyBadge={false}
        showSettings={true}
      />

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-5 space-y-6">
        {deletedSuccess && (
          <div className="bg-[#EFF7F2] border border-[#CDE0D4] rounded-2xl p-4 text-xs text-[#2C6E49] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Local journal cache cleared. 0 records remaining in IndexedDB.</span>
          </div>
        )}

        {/* Central Card: WHERE IS MY DATA? */}
        <section aria-labelledby="data-location-heading">
          <Card className="bg-[#FAF6F0] border-2 border-[#E5DCD0] p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <Badge variant="primary" className="text-xs">
                Live Audit
              </Badge>
              <span className="text-xs text-[#68615C]">Status: Device Only (Zero Cloud)</span>
            </div>

            <h2
              id="data-location-heading"
              className="text-xl sm:text-2xl font-serif font-semibold text-[#231F1D]"
            >
              Where is my data right now?
            </h2>

            <div className="space-y-3 pt-2 text-xs sm:text-sm">
              <div className="flex items-start justify-between py-2 border-b border-[#E8DFD3]">
                <div className="flex items-start gap-2">
                  <HardDrive className="w-4 h-4 text-[#2C6E49] mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-[#231F1D]">Health Journal & Symptoms</p>
                    <p className="text-xs text-[#68615C]">
                      Stored on this device ({counts.checkins} check-ins, {counts.symptoms} symptom ratings, {counts.treatments} regimens in IndexedDB)
                    </p>
                  </div>
                </div>
                <Badge variant="success">This Device</Badge>
              </div>

              <div className="flex items-start justify-between py-2 border-b border-[#E8DFD3]">
                <div className="flex items-start gap-2">
                  <Cloud className="w-4 h-4 text-[#68615C] mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-[#231F1D]">Cloud Backup</p>
                    <p className="text-xs text-[#68615C]">Zero cloud persistence active</p>
                  </div>
                </div>
                <Badge variant="neutral">Off</Badge>
              </div>

              <div className="flex items-start justify-between py-2 border-b border-[#E8DFD3]">
                <div className="flex items-start gap-2">
                  <Cpu className="w-4 h-4 text-[#68615C] mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-[#231F1D]">AI Health Processing</p>
                    <p className="text-xs text-[#68615C]">All current calculations performed deterministically on device</p>
                  </div>
                </div>
                <Badge variant="outline">On-Device Math</Badge>
              </div>

              <div className="flex items-start justify-between py-2">
                <div className="flex items-start gap-2">
                  <EyeOff className="w-4 h-4 text-[#2C6E49] mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-[#231F1D]">Health Advertising Profiling</p>
                    <p className="text-xs text-[#68615C]">Strict architectural prohibition</p>
                  </div>
                </div>
                <Badge variant="success">Never</Badge>
              </div>
            </div>
          </Card>
        </section>

        {/* Data Actions: Export & Delete */}
        <section className="space-y-3">
          <h3 className="font-serif font-semibold text-base text-[#231F1D]">
            Data Management & Sovereignty
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Export */}
            <Card className="p-4 bg-white space-y-3">
              <div className="w-8 h-8 rounded-lg bg-[#EDF3EF] text-[#2C6E49] flex items-center justify-center">
                <Download className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-[#231F1D]">Export All My Data</h4>
                <p className="text-xs text-[#68615C] mt-0.5">
                  Download a structured, client-side JSON archive of all check-ins, symptoms, and treatments.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                fullWidth
                disabled={isExporting}
                onClick={handleExportData}
                className="text-xs"
              >
                {isExporting ? 'Preparing Archive...' : 'Download Export (JSON)'}
              </Button>
            </Card>

            {/* Delete Local Journal */}
            <Card className="p-4 bg-white space-y-3">
              <div className="w-8 h-8 rounded-lg bg-[#FDF1F0] text-[#A33A33] flex items-center justify-center">
                <Trash2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-[#231F1D]">Delete Local Journal</h4>
                <p className="text-xs text-[#68615C] mt-0.5">
                  Permanently wipe all locally stored check-ins, symptoms, and regimens from this browser.
                </p>
              </div>
              <Button
                variant="danger"
                size="sm"
                fullWidth
                onClick={() => setShowDeleteModal(true)}
                className="text-xs"
              >
                Delete Local Data
              </Button>
            </Card>
          </div>
        </section>

        <Link
          href="/app/storage/"
          className="block rounded-2xl border border-[#1F5A4C] bg-[#FDF9F7] p-4 text-sm hover:bg-[#E6EFEB]"
        >
          <span className="block font-semibold text-[#231F1D]">Manage storage</span>
          <span className="block text-xs text-[#554E48]">
            Restore a backup, see how much space is used, or delete only older entries or one tool&apos;s data.
          </span>
        </Link>

        {/* Philosophy Statement */}
        <Card variant="muted" className="p-4 text-xs text-[#554E48] leading-relaxed">
          <p className="font-semibold text-[#231F1D] mb-1">
            &quot;Your body isn&apos;t our business model.&quot;
          </p>
          We do not sell health data, use health records for behavioral advertising, or quietly ship your logs to third-party brokers. What happens on your device stays on your device.
        </Card>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          >
            <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-[#E5DED5] space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#FDF1F0] text-[#A33A33] flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <div className="text-center">
                <h3 className="font-serif font-bold text-lg text-[#231F1D]">
                  Permanently delete all local data?
                </h3>
                <p className="text-xs text-[#68615C] mt-1 leading-relaxed">
                  This will completely clear your IndexedDB storage ({counts.checkins} check-ins). This action cannot be reversed.
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <Button variant="danger" fullWidth onClick={handleClearLocal}>
                  Yes, Permanently Delete All Data
                </Button>
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
