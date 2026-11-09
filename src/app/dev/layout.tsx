import { notFound } from 'next/navigation';
import { SITE } from '@/lib/site/config';

// Rendered on request (not prerendered), so production answers with the site's normal 404 page.
export const dynamic = 'force-dynamic';

/** Design previews (/dev/*) exist only in development and preview builds, never on the live site. */
export default function DevLayout({ children }: { children: React.ReactNode }) {
  if (SITE.env === 'production') notFound();
  return children;
}
