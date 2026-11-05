import type { Metadata, Viewport } from 'next';
import './globals.css';
import { MedicalDisclaimerBanner } from '@/components/app/medical-disclaimer';
import { PWAInstallBanner } from '@/components/app/pwa-install-banner';
import { ServiceWorkerRegistrar } from '@/components/app/service-worker-registrar';
import { AppNavigation } from '@/components/app/app-navigation';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: '#FAF8F5',
};

export const metadata: Metadata = {
  title: {
    default: 'MenoWell — Private Menopause & Midlife Health Companion',
    template: '%s | MenoWell',
  },
  description:
    'A private, calm, local-first health journal designed for women aged 40–60 navigating perimenopause and menopause. Track symptoms, treatments, and prepare for doctor visits. No account required.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'MenoWell',
  },
  icons: {
    icon: '/icons/icon-192.svg',
    apple: '/icons/icon-192.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full bg-[#FAF8F5] text-[#231F1D] antialiased">
      <body className="min-h-full flex flex-col font-sans selection:bg-[#F7EFEA] selection:text-[#965342]">
        <ServiceWorkerRegistrar />
        <MedicalDisclaimerBanner />
        <PWAInstallBanner />
        <AppNavigation />
        <main className="flex-1 pb-20 md:pb-8 flex flex-col">{children}</main>
      </body>
    </html>
  );
}
