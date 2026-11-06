import { NextResponse, type NextRequest } from 'next/server';
import { readSiteConfig } from '../site/config';

/**
 * Gate for every account and server-sync API route.
 *
 * - FEATURE_LOGIN=false (the default): accounts don't exist, so the routes
 *   answer 404 and nothing can be stored or read on the server.
 * - Production: refused (503) until a real database AND real sign-in are wired
 *   in. Today the only backend is an in-memory mock and "sign-in" doesn't
 *   verify anyone, so enabling it in production would expose health data.
 *   Remove this branch only after real authentication is in place
 *   (DECISIONS.md, audit/OWNER_TODO.md).
 * - Test and staging environments with FEATURE_LOGIN=true: allowed, against the mock.
 */
export function accountsBlocked(env: NodeJS.ProcessEnv = process.env): NextResponse | null {
  const cfg = readSiteConfig(env);
  if (!cfg.flags.login) {
    return NextResponse.json({ error: 'Accounts are not enabled.' }, { status: 404 });
  }
  if (cfg.env === 'production') {
    return NextResponse.json(
      { error: 'Accounts are not available yet. Everything on this site works without one.' },
      { status: 503 },
    );
  }
  return null;
}

/**
 * The user id comes only from the x-user-id header (or a JSON body for writes),
 * never from the URL: URLs end up in logs, history and analytics.
 */
export function userIdFrom(req: NextRequest): string | null {
  return req.headers.get('x-user-id');
}
