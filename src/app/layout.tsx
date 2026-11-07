import type { Metadata, Viewport } from 'next';
import { Atkinson_Hyperlegible_Next, Newsreader } from 'next/font/google';
import './globals.css';
import { SwRegister } from '@/components/pwa/sw-register';
import { SITE, absoluteUrl, isIndexable } from '@/lib/site/config';
import { CONSENT_KEY } from '@/lib/storage/consent';
import { DISPLAY_PAINT_SCRIPT } from '@/lib/site/display';

const CONSENT_PAINT_SCRIPT = "try{if(localStorage.getItem('" + CONSENT_KEY + "'))document.documentElement.classList.add('consent-set')}catch(e){}";

/*
 * Two families, self-hosted and subset by next/font (no request to Google at
 * runtime). Newsreader for headings (optical sizes keep big heads crisp and small
 * ones sturdy); Atkinson Hyperlegible Next for body text, designed for readers
 * with low or changing vision. Only the body face is preloaded (it carries LCP
 * text); headings swap in.
 */
const serif = Newsreader({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  axes: ['opsz'],
  display: 'swap',
  variable: '--font-newsreader',
  preload: false,
  fallback: ['Iowan Old Style', 'Palatino Linotype', 'Georgia', 'serif'],
});
const sans = Atkinson_Hyperlegible_Next({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-atkinson',
  fallback: ['system-ui', 'Segoe UI', 'Arial', 'sans-serif'],
});

/**
 * Root layout. Kept deliberately thin and server-only: no tracker shell, no
 * install banner and no icon library, so article pages ship minimal JavaScript.
 * The private tracker adds its own shell in app/app/layout.tsx.
 */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  // Matches the page paper so the browser bar is calm, not a green band.
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F5F1E8' },
    { media: '(prefers-color-scheme: dark)', color: '#141B19' },
  ],
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
    // data-theme / data-text-size are set before hydration by DISPLAY_PAINT_SCRIPT.
    <html lang="en-US" data-theme="light" className={`${serif.variable} ${sans.variable}`} suppressHydrationWarning>
      <head>
        {/* Hides the storage-choice banner before first paint when a choice is already stored. */}
        <script dangerouslySetInnerHTML={{ __html: CONSENT_PAINT_SCRIPT }} />
        {/* Applies the reader's theme and text size before first paint (no flash). */}
        <script dangerouslySetInnerHTML={{ __html: DISPLAY_PAINT_SCRIPT }} />
      </head>
      <body>
        <SwRegister />
        {children}
      </body>
    </html>
  );
}
