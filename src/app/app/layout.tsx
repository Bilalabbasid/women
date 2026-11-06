import type { Metadata } from 'next';
import { MedicalDisclaimerBanner } from '@/components/app/medical-disclaimer';
import { PWAInstallBanner } from '@/components/app/pwa-install-banner';
import { OfflineIndicator } from '@/components/app/service-worker-registrar';
import { AppNavigation } from '@/components/app/app-navigation';

/**
 * Private tracker shell. Everything under /app/ holds personal health data on
 * the device only, so it is never indexed (DECISIONS.md D-003).
 */
export const metadata: Metadata = {
  title: { default: 'Your tracker', template: '%s | Your tracker' },
  robots: { index: false, follow: false },
};

export default function TrackerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell flex min-h-screen flex-col bg-[#FAF8F5] text-[#231F1D]">
      <OfflineIndicator />
      <MedicalDisclaimerBanner />
      <PWAInstallBanner />
      <AppNavigation />
      <main id="main" className="flex flex-1 flex-col pb-20 md:pb-8">
        {children}
      </main>
    </div>
  );
}
