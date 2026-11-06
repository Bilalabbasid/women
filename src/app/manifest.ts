import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/site/config';
import { APP_ROUTES } from '@/lib/routes';

export const dynamic = 'force-static';

/** Web app manifest. The installed app opens the private tracker. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: APP_ROUTES.today,
    name: `${SITE.name}: symptom tracker`,
    short_name: SITE.name,
    description: 'A private symptom tracker for perimenopause and menopause. Entries stay on your device.',
    start_url: APP_ROUTES.today,
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#F7F6F2',
    theme_color: '#F7F6F2',
    categories: ['health', 'medical', 'lifestyle'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      // The PNGs are full-bleed, so the 512px icon is safe to use as a maskable icon.
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      { src: '/icons/icon-192.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
    ],
  };
}
