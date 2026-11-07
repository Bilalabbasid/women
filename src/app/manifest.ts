import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/site/config';
import { APP_ROUTES } from '@/lib/routes';

const SHORTCUT_ICON = { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' };

export const dynamic = 'force-static';

/** Web app manifest for MenoVerdict. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'MenoVerdict',
    short_name: 'MenoVerdict',
    description: `${SITE.tagline} Private perimenopause and menopause tools and evidence-graded guides.`,
    // The installed app opens on the tracker. `id` stays '/' so existing installs keep working.
    start_url: APP_ROUTES.today,
    scope: '/',
    display: 'standalone',
    orientation: 'any',
    background_color: '#F7F6F2',
    theme_color: '#1F5A4C',
    categories: ['health', 'medical', 'lifestyle'],
    icons: [
      { src: '/favicon.ico', sizes: '16x16 32x32 48x48', type: 'image/x-icon' },
      { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Log today', short_name: 'Log today', url: APP_ROUTES.checkIn, icons: [SHORTCUT_ICON] },
      { name: 'My report', short_name: 'Report', url: APP_ROUTES.doctorReport, icons: [SHORTCUT_ICON] },
      { name: 'Doctor questions', short_name: 'Questions', url: '/tools/treatment-questions/', icons: [SHORTCUT_ICON] },
    ],
    screenshots: [
      { src: '/screenshots/today-mobile.png', sizes: '390x844', type: 'image/png', form_factor: 'narrow', label: 'Today: log symptoms in under a minute' },
      { src: '/screenshots/report-mobile.png', sizes: '390x844', type: 'image/png', form_factor: 'narrow', label: 'A one-page report to take to your appointment' },
      { src: '/screenshots/today-desktop.png', sizes: '1280x800', type: 'image/png', form_factor: 'wide', label: 'Your tracker, stored only on this device' },
    ],
  };
}
