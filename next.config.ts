import type { NextConfig } from 'next';
import { missingProductionConfig } from './src/lib/site/config';
import { LEGACY_APP_REDIRECTS } from './src/lib/routes';

// D-005: a production build must never ship with unfilled placeholders.
if (process.env.SITE_ENV === 'production') {
  const missing = missingProductionConfig();
  if (missing.length > 0) {
    throw new Error(
      `Production build blocked. Set these values first (see DECISIONS.md D-005): ${missing.join(', ')}`,
    );
  }
}

const isProdBuild = process.env.NODE_ENV === 'production';

/**
 * CSP: blocks every third-party origin. That enforces "no third-party scripts"
 * and stops accidental data leaks. 'unsafe-inline' is needed for Next.js's
 * inline bootstrap scripts on statically generated pages (nonces would force
 * dynamic rendering). Only applied to production builds, because dev needs eval.
 */
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "manifest-src 'self'",
  "worker-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self' https://whop.com https://*.whop.com",
  "object-src 'none'",
].join('; ');

const securityHeaders = [
  ...(isProdBuild ? [{ key: 'Content-Security-Policy', value: csp }] : []),
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
  ...(isProdBuild ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' }] : []),
];

const nextConfig: NextConfig = {
  // D-004: one canonical form, /path/ with a trailing slash. Next.js issues 308s.
  trailingSlash: true,
  poweredByHeader: false,

  outputFileTracingIncludes: {
    '/api/shop/download': ['./storage/products/**/*'],
  },

  async redirects() {
    return [
      // www → apex in ONE hop. Page paths keep their trailing slash so the
      // apex doesn't redirect a second time; file paths (with a dot) don't get one.
      {
        source: '/',
        has: [{ type: 'host', value: 'www.menoverdict.com' }],
        destination: 'https://menoverdict.com/',
        permanent: true,
      },
      {
        source: '/:path((?:[^/]+/)*[^/.]+)',
        has: [{ type: 'host', value: 'www.menoverdict.com' }],
        destination: 'https://menoverdict.com/:path/',
        permanent: true,
      },
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.menoverdict.com' }],
        destination: 'https://menoverdict.com/:path*',
        permanent: true,
      },
      ...LEGACY_APP_REDIRECTS.map((r) => ({ ...r, permanent: true })),
    ];
  },

  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      // The private tracker is never indexed, even if linked.
      { source: '/app/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
      { source: '/search/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, follow' }] },
      { source: '/shop/thank-you/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
      { source: '/api/shop/download/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
      { source: '/shop/resend/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, follow' }] },
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
    ];
  },
};

export default nextConfig;
