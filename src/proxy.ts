import { NextResponse, type NextRequest } from 'next/server';

/**
 * Staging protection (AGENTS.md: "Keep staging behind authentication and noindex").
 *
 * When SITE_ENV=staging, every request needs HTTP Basic credentials matching
 * STAGING_USER / STAGING_PASSWORD, and every response carries noindex. If the
 * credentials aren't configured, staging fails closed (503) instead of
 * exposing drafts. In every other environment this proxy does nothing.
 */
export function proxy(request: NextRequest) {
  if (process.env.SITE_ENV !== 'staging') return NextResponse.next();

  const user = process.env.STAGING_USER;
  const pass = process.env.STAGING_PASSWORD;
  if (!user || !pass) {
    return new NextResponse('Staging is locked: STAGING_USER and STAGING_PASSWORD are not set.', {
      status: 503,
      headers: { 'X-Robots-Tag': 'noindex, nofollow' },
    });
  }

  const expected = `Basic ${btoa(`${user}:${pass}`)}`;
  if (!safeEqual(request.headers.get('authorization') ?? '', expected)) {
    return new NextResponse('Authentication required.', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="staging", charset="UTF-8"', 'X-Robots-Tag': 'noindex, nofollow' },
    });
  }

  const res = NextResponse.next();
  res.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return res;
}

/** Length-independent comparison so timing doesn't leak how much of the header matched. */
function safeEqual(a: string, b: string): boolean {
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

export const config = {
  // sw.js and the manifest are fetched without credentials and hold nothing private.
  matcher: '/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest).*)',
};
