import { NextResponse } from 'next/server';
import { createWhopCheckout } from '@/lib/shop/whop';
import { SHOP_CONFIG } from '@/lib/shop/config';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const origin =
      req.headers.get('origin') ||
      process.env.SITE_URL ||
      'https://menoverdict.com';

    // Parse email if provided; ignore any price/product sent by client
    let email: string | undefined;
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      try {
        const body = await req.json();
        if (body && typeof body.email === 'string') {
          email = body.email;
        }
      } catch {
        // Optional payload
      }
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      try {
        const formData = await req.formData();
        const emailField = formData.get('email');
        if (typeof emailField === 'string') {
          email = emailField;
        }
      } catch {
        // Optional payload
      }
    }

    // Always create checkout with server-enforced product and price ($8.99 USD)
    const { checkoutUrl, sessionId } = await createWhopCheckout({
      email,
      origin,
    });

    // Support both standard HTML Form POST (no JS redirect) and Client JSON fetch
    if (contentType.includes('application/json')) {
      return NextResponse.json({
        ok: true,
        checkoutUrl,
        sessionId,
        amount: SHOP_CONFIG.productPriceCents,
        currency: SHOP_CONFIG.currency,
      });
    }

    // Standard redirect for forms without JavaScript
    return NextResponse.redirect(checkoutUrl, { status: 303 });
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Could not create checkout session' },
      { status: 500 }
    );
  }
}
