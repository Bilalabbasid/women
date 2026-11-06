import type { MetadataRoute } from 'next';
import { SITE, absoluteUrl, isIndexable } from '@/lib/site/config';

export const dynamic = 'force-static';

/**
 * Production: crawl content, keep out the private tracker, affiliate redirects,
 * internal search and APIs. Every other environment: disallow everything.
 */
export default function robots(): MetadataRoute.Robots {
  if (!isIndexable(SITE.env)) {
    return { rules: { userAgent: '*', disallow: '/' } };
  }
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/app/', '/go/', '/search/', '/api/', '/search-index.json'],
    },
    sitemap: absoluteUrl('/sitemap.xml'),
  };
}
