import { NextResponse } from 'next/server';
import { recordOrder, markOrderRefunded } from '@/lib/shop/orders';
import { generateDownloadToken } from '@/lib/shop/tokens';
import { sendOrderReceiptEmail } from '@/lib/shop/email';
import { verifyWhopWebhookSignature } from '@/lib/shop/whop';
import { SHOP_CONFIG } from '@/lib/shop/config';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch {
    return new NextResponse('Bad request', { status: 400 });
  }

  const sigHeader =
    req.headers.get('webhook-signature') ||
    req.headers.get('whop-signature') ||
    req.headers.get('x-whop-signature');

  // Verify signature
  const isValid = verifyWhopWebhookSignature(
    rawBody,
    sigHeader,
    SHOP_CONFIG.whop.webhookSecret
  );

  if (!isValid) {
    return new NextResponse('Invalid signature', { status: 401 });
  }

  let event: Record<string, unknown>;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new NextResponse('Invalid JSON payload', { status: 400 });
  }

  const eventType = (event.action || event.type || event.event || '') as string;
  const data = (event.data || event) as Record<string, unknown>;

  // Normalize Whop payment and membership identifiers
  const providerReference = String(
    data.id || data.payment_id || data.membership_id || data.checkout_id || ''
  );
  const email = String(
    data.email ||
      (data.user as Record<string, unknown>)?.email ||
      (data.customer as Record<string, unknown>)?.email ||
      ''
  ).toLowerCase().trim();

  // Handle refunds and chargebacks
  if (
    eventType.includes('refund') ||
    eventType.includes('dispute') ||
    eventType.includes('chargeback')
  ) {
    if (providerReference) {
      markOrderRefunded(providerReference);
    }
    return NextResponse.json({ ok: true, handled: 'refund' });
  }

  // Handle successful payment
  const isPaymentSuccess =
    eventType === 'payment.succeeded' ||
    eventType === 'membership.went_valid' ||
    eventType === 'checkout.completed' ||
    eventType === 'order.completed' ||
    data.status === 'paid' ||
    data.status === 'completed';

  if (!isPaymentSuccess) {
    // Other informational events (e.g. created, updated) - ack without granting access
    return NextResponse.json({ ok: true, ignored: eventType });
  }

  // Record order idempotently on server
  const order = recordOrder({
    email: email || 'customer@example.com',
    providerReference,
    amount: SHOP_CONFIG.productPriceCents,
    currency: SHOP_CONFIG.currency,
    product: SHOP_CONFIG.productId,
    status: 'confirmed',
  });

  // Generate secure download token and send email if possible
  const token = generateDownloadToken(order.orderId, order.email);
  const siteUrl = process.env.SITE_URL || 'https://menoverdict.com';
  const downloadUrl = `${siteUrl}/api/shop/download?token=${encodeURIComponent(token)}`;

  if (email && email !== 'customer@example.com') {
    void sendOrderReceiptEmail({
      toEmail: email,
      orderId: order.orderId,
      downloadUrl,
    });
  }

  return NextResponse.json({
    ok: true,
    orderId: order.orderId,
    token,
  });
}
