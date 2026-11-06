import type { Metadata, Viewport } from 'next';
import './globals.css';
import { SwRegister } from '@/components/pwa/sw-register';
import { SITE, isIndexable } from '@/lib/site/config';

/**
 * Root layout. Kept deliberately thin and server-only: no tracker shell, no
 * install banner and no icon library, so article pages ship minimal JavaScript.
 * The private tracker adds its own shell in app/app/layout.tsx.
 */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#F7F6F2',
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: SITE.name, template: `%s | ${SITE.name}` },
  applicationName: SITE.name,
  manifest: '/manifest.webmanifest',
  // Only production is ever indexable (D-005). Pages may tighten this further.
  robots: isIndexable() ? undefined : { index: false, follow: false },
  appleWebApp: { capable: true, statusBarStyle: 'default', title: SITE.name },
  icons: { icon: '/icons/icon-192.svg', apple: '/icons/icon-192.png' },
  formatDetection: { telephone: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-US">
      <body>
        <SwRegister />
        {children}
      </body>
    </html>
  );
}
