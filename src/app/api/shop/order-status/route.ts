import { NextResponse } from 'next/server';
import { getOrderById, getOrderByProviderRef } from '@/lib/shop/orders';
import { generateDownloadToken } from '@/lib/shop/tokens';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const orderId = url.searchParams.get('order_id');
  const sessionId = url.searchParams.get('session_id');

  let order = null;
  if (orderId) {
    order = getOrderById(orderId);
  } else if (sessionId) {
    order = getOrderByProviderRef(sessionId);
  }

  if (!order) {
    return NextResponse.json(
      { ok: false, status: 'pending', message: 'Confirming your payment...' },
      { headers: { 'X-Robots-Tag': 'noindex, nofollow' } }
    );
  }

  if (order.status === 'confirmed') {
    const token = generateDownloadToken(order.orderId, order.email);
    return NextResponse.json(
      {
        ok: true,
        status: 'confirmed',
        orderId: order.orderId,
        email: order.email,
        downloadUrl: `/api/shop/download?token=${encodeURIComponent(token)}`,
      },
      { headers: { 'X-Robots-Tag': 'noindex, nofollow' } }
    );
  }

  return NextResponse.json(
    { ok: true, status: order.status },
    { headers: { 'X-Robots-Tag': 'noindex, nofollow' } }
  );
}

