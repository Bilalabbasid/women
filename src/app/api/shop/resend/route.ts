import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getPaidOrdersByEmail } from '@/lib/shop/orders';
import { generateDownloadToken } from '@/lib/shop/tokens';
import { sendOrderReceiptEmail } from '@/lib/shop/email';

export const dynamic = 'force-dynamic';

// Rate limiter: 5 attempts per 15 minutes per IP
const attempts = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || now > entry.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return false;
  }
  if (entry.count >= 5) {
    return true;
  }
  entry.count += 1;
  return false;
}

function clientKey(req: Request): string {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1';
  return createHash('sha256').update(ip).digest('hex').slice(0, 32);
}

export async function POST(req: Request) {
  const key = clientKey(req);
  if (isRateLimited(key)) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Too many requests. Please wait a few minutes before trying again.',
      },
      { status: 429 }
    );
  }

  let email = '';
  const contentType = req.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    try {
      const body = await req.json();
      email = String(body?.email || '');
    } catch {
      // Handled below
    }
  } else if (contentType.includes('application/x-www-form-urlencoded')) {
    try {
      const formData = await req.formData();
      email = String(formData.get('email') || '');
    } catch {
      // Handled below
    }
  }

  const normalizedEmail = email.toLowerCase().trim();

  // If valid email provided, check for confirmed orders
  if (normalizedEmail && normalizedEmail.includes('@')) {
    const paidOrders = getPaidOrdersByEmail(normalizedEmail);

    if (paidOrders.length > 0) {
      const latestOrder = paidOrders[paidOrders.length - 1];
      const token = generateDownloadToken(latestOrder.orderId, latestOrder.email);
      const siteUrl = process.env.SITE_URL || 'https://menoverdict.com';
      const downloadUrl = `${siteUrl}/api/shop/download?token=${encodeURIComponent(token)}`;

      void sendOrderReceiptEmail({
        toEmail: latestOrder.email,
        orderId: latestOrder.orderId,
        downloadUrl,
      });
    }
  }

  // Consistent message whether or not a match is found (no user enumeration)
  const message =
    'If an order matches that email address, a fresh download link is on its way. Please check your inbox and spam folder.';

  if (contentType.includes('application/json')) {
    return NextResponse.json({ ok: true, message });
  }

  // Support plain HTML form POST
  return NextResponse.redirect(
    new URL('/shop/resend?sent=1', req.url),
    { status: 303 }
  );
}

