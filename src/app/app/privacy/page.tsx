'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { HardDrive, Cloud, Download, Trash2, AlertTriangle, EyeOff, Cpu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppHeader } from '@/components/app/app-header';
import { AppPage, Panel, Icon } from '@/components/app/kit';
import { clearEverything } from '@/lib/storage/manager';
import { ExportService } from '@/lib/export/export-data';
import { db } from '@/lib/db/db';

function StatusRow({
  icon,
  title,
  body,
  status,
  good,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  status: string;
  good?: boolean;
}) {
  return (
    <li className="row items-start">
      <span className="row-icon" aria-hidden="true">
        {icon}
      </span>
      <span className="row-main">
        <span className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <span className="row-title">{title}</span>
          <span
            className={`rounded-full px-2.5 py-0.5 text-[0.9rem] font-bold whitespace-nowrap ${
              good ? 'bg-[var(--g-strong-soft)] text-[var(--g-strong-ink)]' : 'bg-[var(--paper-sunk)] text-[var(--ink-muted)]'
            }`}
          >
            {status}
          </span>
        </span>
        <span className="row-meta mt-1 block">{body}</span>
      </span>
    </li>
  );
}

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

  // Esc closes the confirmation.
  useEffect(() => {
    if (!showDeleteModal) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setShowDeleteModal(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showDeleteModal]);

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
    <div className="flex min-h-screen flex-col">
      <AppHeader title="Privacy center" subtitle="Where your data is, and who can see it" showPrivacyBadge={false} showSettings={true} />

      <AppPage>
        {deletedSuccess && (
          <p role="status" className="saved-note">
            <Icon.Check width={20} height={20} />
            Everything you logged has been deleted from this browser.
          </p>
        )}

        <Panel title="Where is my data right now?" tone="feature" hint="A live check of this browser, not a promise on a page.">
          <ul className="row-list">
            <StatusRow
              icon={<HardDrive className="h-5 w-5" />}
              title="Your journal and symptoms"
              body={`Kept in this browser on this device: ${counts.checkins} check-ins, ${counts.symptoms} symptom ratings, ${counts.treatments} treatments.`}
              status="This device"
              good
            />
            <StatusRow
              icon={<Cloud className="h-5 w-5" />}
              title="Online backup"
              body="There isn’t one. Nothing you log is sent to us or anyone else."
              status="Off"
            />
            <StatusRow
              icon={<Cpu className="h-5 w-5" />}
              title="Charts and summaries"
              body="Worked out on your device with simple counts and averages. No AI reads your entries."
              status="On device"
              good
            />
            <StatusRow
              icon={<EyeOff className="h-5 w-5" />}
              title="Advertising based on your health"
              body="Never. The site has no ads and no trackers."
              status="Never"
              good
            />
          </ul>
        </Panel>

        <section aria-labelledby="your-data-heading" className="grid gap-3">
          <h2 id="your-data-heading" className="section-title px-0.5">
            Take it with you, or delete it
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="panel content-start">
              <span className="row-icon" aria-hidden="true">
                <Download className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-sans text-[1.125rem] font-bold">Export all my data</h3>
                <p className="mt-1 text-[var(--ink-muted)]">
                  Download a file with all your check-ins, symptoms and treatments, to keep or move to another device.
                </p>
              </div>
              <Button variant="secondary" fullWidth loading={isExporting} disabled={isExporting} onClick={handleExportData}>
                Download my data
              </Button>
            </div>

            <div className="panel content-start">
              <span className="row-icon bg-[var(--urgent-soft)] text-[var(--urgent)]" aria-hidden="true">
                <Trash2 className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-sans text-[1.125rem] font-bold">Delete everything</h3>
                <p className="mt-1 text-[var(--ink-muted)]">
                  Permanently remove all check-ins, symptoms and treatments from this browser. You&apos;ll be asked to confirm.
                </p>
              </div>
              <Button variant="danger" fullWidth onClick={() => setShowDeleteModal(true)}>
                Delete all my data…
              </Button>
            </div>
          </div>
        </section>

        <div className="row-list">
          <Link href="/app/storage/" className="row">
            <span className="row-main">
              <span className="row-title block">Manage storage</span>
              <span className="row-meta block">
                Restore a backup, see how much space is used, or delete only older entries or one tool&apos;s data.
              </span>
            </span>
            <Icon.Chevron width={20} height={20} className="shrink-0 text-[var(--ink-muted)]" />
          </Link>
        </div>

        <blockquote className="border-l-[3px] border-[var(--accent)] py-1 pl-5">
          <p className="font-serif text-[1.25rem] leading-snug font-medium">&ldquo;Your body isn&apos;t our business model.&rdquo;</p>
          <p className="mt-2 text-[var(--ink-muted)]">
            We don&apos;t sell health data, use it for advertising, or pass your logs to anyone. What happens on your device
            stays on your device.
          </p>
        </blockquote>
      </AppPage>

      {/* Delete confirmation */}
      {showDeleteModal && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="delete-title"
          aria-describedby="delete-body"
          className="fixed inset-0 z-50 flex items-end justify-center bg-[var(--scrim)] sm:items-center sm:p-4"
          onClick={(e) => e.target === e.currentTarget && setShowDeleteModal(false)}
        >
          <div className="w-full max-w-sm space-y-4 rounded-t-[var(--radius-lg)] border border-[var(--rule)] bg-[var(--paper-raised)] p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] shadow-[var(--shadow-lift)] sm:rounded-[var(--radius-lg)] sm:pb-6">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[var(--urgent-soft)] text-[var(--urgent)]">
              <AlertTriangle className="h-6 w-6" aria-hidden="true" />
            </div>
            <div className="text-center">
              <h3 id="delete-title" className="font-serif text-[1.35rem] font-semibold">
                Delete all your data from this browser?
              </h3>
              <p id="delete-body" className="mt-2 text-[var(--ink-muted)]">
                This removes all {counts.checkins} check-ins and everything else you logged here. It can&apos;t be undone. If you
                might want it later, download your data first.
              </p>
            </div>
            <div className="grid gap-2 pt-1">
              <Button variant="danger" fullWidth onClick={handleClearLocal}>
                Yes, delete everything
              </Button>
              <Button variant="secondary" fullWidth onClick={() => setShowDeleteModal(false)} autoFocus>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
