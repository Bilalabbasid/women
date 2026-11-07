import type { Metadata, Viewport } from 'next';
import './globals.css';
import { SwRegister } from '@/components/pwa/sw-register';
import { SITE, absoluteUrl, isIndexable } from '@/lib/site/config';
import { CONSENT_KEY } from '@/lib/storage/consent';

const CONSENT_PAINT_SCRIPT = "try{if(localStorage.getItem('" + CONSENT_KEY + "'))document.documentElement.classList.add('consent-set')}catch(e){}";

/**
 * Root layout. Kept deliberately thin and server-only: no tracker shell, no
 * install banner and no icon library, so article pages ship minimal JavaScript.
 * The private tracker adds its own shell in app/app/layout.tsx.
 */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#1F5A4C',
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `${SITE.name} — ${SITE.tagline}`, template: `%s | ${SITE.name}` },
  applicationName: SITE.name,
  manifest: '/manifest.webmanifest',
  robots: isIndexable() ? undefined : { index: false, follow: false },
  appleWebApp: { capable: true, statusBarStyle: 'default', title: SITE.name },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '16x16 32x32 48x48', type: 'image/x-icon' },
      { url: '/favicon.svg', type: 'image/svg+xml', sizes: 'any' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  alternates: {
    types: {
      'application/rss+xml': absoluteUrl('/feed.xml'),
    },
  },
  formatDetection: { telephone: false },
  // Search Console is the only measurement tool. Set GSC_VERIFICATION to the code from the HTML-tag method.
  ...(SITE.gscVerification ? { verification: { google: SITE.gscVerification } } : {}),
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-US">
      <head>
        {/* Hides the storage-choice banner before first paint when a choice is already stored. */}
        <script dangerouslySetInnerHTML={{ __html: CONSENT_PAINT_SCRIPT }} />
      </head>
      <body>
        <SwRegister />
        {children}
      </body>
    </html>
  );
}
