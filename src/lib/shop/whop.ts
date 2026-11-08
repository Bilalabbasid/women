import crypto from 'node:crypto';
import { SHOP_CONFIG } from './config';

export interface CreateCheckoutParams {
  email?: string;
  origin: string;
}

export interface CheckoutResult {
  checkoutUrl: string;
  sessionId: string;
}

/**
 * Creates a Whop checkout link / session on the server.
 * The price is strictly fixed at $8.99 USD on the server.
 */
export async function createWhopCheckout(params: CreateCheckoutParams): Promise<CheckoutResult> {
  const sessionId = `whop_sess_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  const redirectUrl = `${params.origin}/shop/thank-you?session_id=${sessionId}`;

  // If a direct Whop checkout link is set in environment (e.g. created from Whop dashboard)
  const checkoutBase = SHOP_CONFIG.whop.checkoutUrl || process.env.WHOP_CHECKOUT_URL || '';
  if (checkoutBase) {
    const url = new URL(checkoutBase);
    if (params.email) url.searchParams.set('email', params.email);
    url.searchParams.set('redirect_url', redirectUrl);
    url.searchParams.set('metadata[session_id]', sessionId);
    return { checkoutUrl: url.toString(), sessionId };
  }

  // Attempt Whop API checkout configuration if API key is provided
  if (SHOP_CONFIG.whop.apiKey) {
    try {
      const res = await fetch(`${SHOP_CONFIG.whop.apiBase}/api/v1/checkout_configurations`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${SHOP_CONFIG.whop.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan: {
            title: SHOP_CONFIG.productTitle,
            initial_price: SHOP_CONFIG.productPriceCents,
            currency: SHOP_CONFIG.currency.toLowerCase(),
          },
          metadata: {
            session_id: sessionId,
            product_id: SHOP_CONFIG.productId,
          },
          redirect_url: redirectUrl,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.purchase_url) {
          return { checkoutUrl: data.purchase_url, sessionId: data.id || sessionId };
        }
      } else {
        const errorText = await res.text();
        console.warn('Whop API checkout creation notice:', res.status, errorText);
      }
    } catch (err) {
      console.warn('Whop checkout API request error, using fallback:', err);
    }
  }

  // Fallback: Hosted Whop checkout
  const fallbackUrl = new URL(checkoutBase || 'https://whop.com');
  fallbackUrl.searchParams.set('redirect_url', redirectUrl);
  return { checkoutUrl: fallbackUrl.toString(), sessionId };
}

/**
 * Verifies Whop webhook signature.
 * Whop headers: 'webhook-signature' or 'whop-signature'
 */
export function verifyWhopWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string
): boolean {
  if (!secret) {
    // If no secret configured in test/dev environment, allow for testing
    return process.env.NODE_ENV !== 'production';
  }

  if (!signatureHeader) return false;

  try {
    // Handle "t=timestamp,v1=signature" format
    let timestamp = '';
    let signature = signatureHeader;

    if (signatureHeader.includes('v1=')) {
      const parts = signatureHeader.split(',');
      for (const part of parts) {
        const [k, v] = part.split('=');
        if (k.trim() === 't') timestamp = v.trim();
        if (k.trim() === 'v1') signature = v.trim();
      }
    }

    const payloadToSign = timestamp ? `${timestamp}.${rawBody}` : rawBody;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payloadToSign)
      .digest('hex');

    const sigBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (sigBuffer.length !== expectedBuffer.length) return false;
    return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
  } catch (err) {
    console.error('Error verifying webhook signature:', err);
    return false;
  }
}

