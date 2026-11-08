import crypto from 'node:crypto';
import { SHOP_CONFIG } from './config';

export interface TokenPayload {
  orderId: string;
  email: string;
  issuedAt: number;
  nonce: string;
}

/**
 * Generates an unguessable, cryptographically signed token for secure file download.
 * Structure: base64url(payload) + '.' + hmacSha256Signature
 */
export function generateDownloadToken(orderId: string, email: string): string {
  const payload: TokenPayload = {
    orderId,
    email: email.toLowerCase().trim(),
    issuedAt: Date.now(),
    nonce: crypto.randomBytes(16).toString('hex'),
  };

  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', SHOP_CONFIG.shopSecret)
    .update(encodedPayload)
    .digest('base64url');

  return `${encodedPayload}.${signature}`;
}

export interface TokenVerificationResult {
  valid: boolean;
  orderId?: string;
  email?: string;
  issuedAt?: number;
  error?: 'invalid_format' | 'tampered' | 'expired' | 'corrupt';
}

/**
 * Verifies that a download token has not been tampered with and has not expired.
 */
export function verifyDownloadToken(token: string): TokenVerificationResult {
  if (!token || typeof token !== 'string') {
    return { valid: false, error: 'invalid_format' };
  }

  const parts = token.split('.');
  if (parts.length !== 2) {
    return { valid: false, error: 'invalid_format' };
  }

  const [encodedPayload, signature] = parts;

  // Verify HMAC signature
  const expectedSignature = crypto
    .createHmac('sha256', SHOP_CONFIG.shopSecret)
    .update(encodedPayload)
    .digest('base64url');

  // Constant-time comparison to prevent timing attacks
  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
    return { valid: false, error: 'tampered' };
  }

  // Parse payload
  try {
    const rawPayload = Buffer.from(encodedPayload, 'base64url').toString('utf8');
    const payload: TokenPayload = JSON.parse(rawPayload);

    // Check expiration (7 days in milliseconds)
    const expiryMs = SHOP_CONFIG.downloadLinkExpiryDays * 24 * 60 * 60 * 1000;
    if (Date.now() - payload.issuedAt > expiryMs) {
      return { valid: false, error: 'expired', orderId: payload.orderId, email: payload.email };
    }

    return {
      valid: true,
      orderId: payload.orderId,
      email: payload.email,
      issuedAt: payload.issuedAt,
    };
  } catch {
    return { valid: false, error: 'corrupt' };
  }
}
