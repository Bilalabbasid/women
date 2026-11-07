import type { Metadata } from 'next';
import { MedicalDisclaimerBanner, AppFooterNotice } from '@/components/app/medical-disclaimer';
import { PWAInstallBanner } from '@/components/app/pwa-install-banner';
import { OfflineIndicator } from '@/components/app/service-worker-registrar';
import { AppNavigation } from '@/components/app/app-navigation';
import { ReminderScheduler } from '@/components/app/reminder-scheduler';
import { notFound } from 'next/navigation';
import { isToolLive } from '@/lib/tools/logic';

/**
 * Private tracker shell. Everything under /app/ holds personal health data on
 * the device only, so it is never indexed (DECISIONS.md D-003).
 */
export const metadata: Metadata = {
  title: { default: 'Your tracker', template: '%s | Your tracker' },
  robots: { index: false, follow: false },
};

export default function TrackerLayout({ children }: { children: React.ReactNode }) {
  // Production hides the tracker until its logic file is clinician-approved (content/_tools/symptom-tracker.yaml).
  if (!isToolLive('symptom-tracker')) notFound();

  return (
    <div className="app-shell flex min-h-screen flex-col bg-[var(--color-paper)] text-[var(--color-ink)]">
      <ReminderScheduler />
      <OfflineIndicator />
      <MedicalDisclaimerBanner />
      <PWAInstallBanner />
      <AppNavigation />
      <main id="main" className="flex flex-1 flex-col">
        {children}
      </main>
      <AppFooterNotice />
    </div>
  );
}
