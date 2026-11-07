import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { FORM_ERROR, createRateLimiter, notificationEmail, parseSubmission } from '@/lib/forms/subscribe';

/**
 * POST /api/subscribe: the newsletter and contact forms. Sends one notification
 * email to the site owner (FORMS_NOTIFY_TO) through Resend. Nothing is stored,
 * and nothing about the request is logged: the IP address is only hashed in memory
 * for the rate limit and never written anywhere.
 */
export const dynamic = 'force-dynamic';

const allow = createRateLimiter();

function clientKey(req: Request): string {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
  return createHash('sha256').update(ip).digest('hex').slice(0, 32);
}

const fail = (status: number) => NextResponse.json({ ok: false, error: FORM_ERROR }, { status });

export async function POST(req: Request) {
  if (!allow(clientKey(req))) return fail(429);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail(400);
  }

  const parsed = parseSubmission(body);
  if (parsed.kind === 'bot') return NextResponse.json({ ok: true });
  if (parsed.kind === 'invalid') return fail(400);

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.FORMS_NOTIFY_TO;
  const from = process.env.FORMS_NOTIFY_FROM;
  if (!apiKey || !to || !from) return fail(503);

  const { subject, text } = notificationEmail(parsed.submission);
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [to], subject, text, reply_to: parsed.submission.email }),
    });
    if (!res.ok) return fail(502);
  } catch {
    return fail(502);
  }
  return NextResponse.json({ ok: true });
}
