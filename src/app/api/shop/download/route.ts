import fs from 'node:fs';
import { NextResponse } from 'next/server';
import { SHOP_CONFIG } from '@/lib/shop/config';
import { verifyDownloadToken } from '@/lib/shop/tokens';
import { recordDownload, getOrderById } from '@/lib/shop/orders';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get('token');

  if (!token) {
    return new NextResponse('Download token required', {
      status: 400,
      headers: { 'X-Robots-Tag': 'noindex, nofollow' },
    });
  }

  // 1. Verify token signature and expiration
  const verification = verifyDownloadToken(token);
  if (!verification.valid || !verification.orderId) {
    const message =
      verification.error === 'expired'
        ? 'This download link has expired (7-day validity). Please request a fresh link at /shop/resend/.'
        : 'Invalid or tampered download token.';
    return new NextResponse(message, {
      status: 403,
      headers: { 'X-Robots-Tag': 'noindex, nofollow' },
    });
  }

  // 2. Check order and download limits
  const downloadCheck = recordDownload(verification.orderId);
  if (!downloadCheck.allowed) {
    let message = 'Download access denied.';
    if (downloadCheck.reason === 'refunded') {
      message = 'This order has been refunded. Download access is disabled.';
    } else if (downloadCheck.reason === 'limit_reached') {
      message = `Download limit reached (${SHOP_CONFIG.maxDownloadsPerToken} downloads). Please contact support at /contact/ if you need an extension.`;
    } else if (downloadCheck.reason === 'not_paid') {
      message = 'Payment has not been confirmed for this order.';
    }

    return new NextResponse(message, {
      status: 403,
      headers: { 'X-Robots-Tag': 'noindex, nofollow' },
    });
  }

  // 3. Verify physical file presence in private storage
  if (!fs.existsSync(SHOP_CONFIG.filePath)) {
    return new NextResponse('Product file temporarily unavailable. Please contact support.', {
      status: 500,
      headers: { 'X-Robots-Tag': 'noindex, nofollow' },
    });
  }

  const fileStat = fs.statSync(SHOP_CONFIG.filePath);
  const fileStream = fs.createReadStream(SHOP_CONFIG.filePath);

  // Convert Node ReadStream to Web ReadableStream
  const stream = new ReadableStream({
    start(controller) {
      fileStream.on('data', (chunk) => controller.enqueue(chunk));
      fileStream.on('end', () => controller.close());
      fileStream.on('error', (err) => controller.error(err));
    },
  });

  return new NextResponse(stream, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${SHOP_CONFIG.filename}"`,
      'Content-Length': fileStat.size.toString(),
      'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}
