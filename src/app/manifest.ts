import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/site/config';

export const dynamic = 'force-static';

/** Web app manifest for MenoVerdict. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'MenoVerdict',
    short_name: 'MenoVerdict',
    description: `${SITE.tagline} Private perimenopause and menopause tools and evidence-graded guides.`,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
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
  };
}
