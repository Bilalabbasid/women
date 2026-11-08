import { describe, it, expect, beforeEach } from 'vitest';
import { generateDownloadToken, verifyDownloadToken } from '@/lib/shop/tokens';
import {
  recordOrder,
  getOrderById,
  getOrderByProviderRef,
  getPaidOrdersByEmail,
  recordDownload,
  markOrderRefunded,
} from '@/lib/shop/orders';
import { SHOP_CONFIG } from '@/lib/shop/config';
import { verifyWhopWebhookSignature } from '@/lib/shop/whop';
import fs from 'node:fs';

describe('Digital Shop & Secure PDF Delivery System', () => {
  const testOrderId = `test_ord_${Date.now()}`;
  const testEmail = 'patient@example.com';
  const testProviderRef = `whop_pay_${Date.now()}`;

  beforeEach(() => {
    // Reset / ensure state
  });

  describe('Configuration & Price Integrity', () => {
    it('enforces $8.99 price and USD currency strictly on the server', () => {
      expect(SHOP_CONFIG.productPriceCents).toBe(899);
      expect(SHOP_CONFIG.productPriceFormatted).toBe('$8.99');
      expect(SHOP_CONFIG.currency).toBe('USD');
      expect(SHOP_CONFIG.downloadLinkExpiryDays).toBe(7);
      expect(SHOP_CONFIG.maxDownloadsPerToken).toBe(10);
    });

    it('ensures private storage path is outside the public directory', () => {
      expect(SHOP_CONFIG.filePath).not.toContain('/public/');
      expect(SHOP_CONFIG.filePath).not.toContain('\\public\\');
      expect(fs.existsSync(SHOP_CONFIG.filePath)).toBe(true);
    });
  });

  describe('Order Processing & Idempotency', () => {
    it('creates exactly one confirmed order from a payment confirmation', () => {
      const order = recordOrder({
        orderId: testOrderId,
        email: testEmail,
        providerReference: testProviderRef,
        amount: 899,
        currency: 'USD',
        status: 'confirmed',
      });

      expect(order.orderId).toBe(testOrderId);
      expect(order.email).toBe(testEmail);
      expect(order.status).toBe('confirmed');
      expect(order.amount).toBe(899);
      expect(order.downloadCount).toBe(0);

      const retrieved = getOrderById(testOrderId);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.email).toBe(testEmail);
    });

    it('handles duplicate webhooks idempotently without creating a second order', () => {
      const first = recordOrder({
        email: testEmail,
        providerReference: testProviderRef,
        status: 'confirmed',
      });

      const duplicate = recordOrder({
        email: testEmail,
        providerReference: testProviderRef,
        status: 'confirmed',
      });

      expect(duplicate.orderId).toBe(first.orderId);
      expect(getOrderByProviderRef(testProviderRef)?.orderId).toBe(first.orderId);
    });

    it('does not grant download access for pending or failed payments', () => {
      const failedRef = `whop_failed_${Date.now()}`;
      const failedOrder = recordOrder({
        email: 'failed@example.com',
        providerReference: failedRef,
        status: 'failed',
      });

      const check = recordDownload(failedOrder.orderId);
      expect(check.allowed).toBe(false);
      expect(check.reason).toBe('not_paid');
    });

    it('immediately disables download access when an order is refunded', () => {
      const refundRef = `whop_ref_${Date.now()}`;
      const order = recordOrder({
        email: 'refund@example.com',
        providerReference: refundRef,
        status: 'confirmed',
      });

      // Verify access granted before refund
      const beforeRefund = recordDownload(order.orderId);
      expect(beforeRefund.allowed).toBe(true);

      // Process refund
      const marked = markOrderRefunded(refundRef);
      expect(marked).toBe(true);

      // Verify access revoked after refund
      const afterRefund = recordDownload(order.orderId);
      expect(afterRefund.allowed).toBe(false);
      expect(afterRefund.reason).toBe('refunded');
    });
  });

  describe('Cryptographic Download Token Security', () => {
    it('generates an unguessable HMAC signed token containing order and email', () => {
      const token = generateDownloadToken(testOrderId, testEmail);
      expect(token).toBeDefined();
      expect(token.split('.').length).toBe(2);

      const verification = verifyDownloadToken(token);
      expect(verification.valid).toBe(true);
      expect(verification.orderId).toBe(testOrderId);
      expect(verification.email).toBe(testEmail);
    });

    it('rejects tampered or forged download tokens', () => {
      const token = generateDownloadToken(testOrderId, testEmail);
      const [payload, sig] = token.split('.');
      const tamperedToken = `${payload}x.${sig}`;

      const verification = verifyDownloadToken(tamperedToken);
      expect(verification.valid).toBe(false);
      expect(verification.error).toBe('tampered');
    });

    it('enforces the 7-day token expiration rule', () => {
      // Mock an expired token
      const oldPayload = {
        orderId: testOrderId,
        email: testEmail,
        issuedAt: Date.now() - 8 * 24 * 60 * 60 * 1000, // 8 days ago
        nonce: 'mocknonce123',
      };
      const encoded = Buffer.from(JSON.stringify(oldPayload)).toString('base64url');
      const crypto = require('node:crypto');
      const sig = crypto.createHmac('sha256', SHOP_CONFIG.shopSecret).update(encoded).digest('base64url');
      const expiredToken = `${encoded}.${sig}`;

      const verification = verifyDownloadToken(expiredToken);
      expect(verification.valid).toBe(false);
      expect(verification.error).toBe('expired');
    });

    it('enforces the 10 download limit per order', () => {
      const limitRef = `whop_limit_${Date.now()}`;
      const limitOrder = recordOrder({
        email: 'limit@example.com',
        providerReference: limitRef,
        status: 'confirmed',
      });

      // Download 10 times
      for (let i = 0; i < 10; i++) {
        const res = recordDownload(limitOrder.orderId);
        expect(res.allowed).toBe(true);
      }

      // 11th download should be blocked
      const excessRes = recordDownload(limitOrder.orderId);
      expect(excessRes.allowed).toBe(false);
      expect(excessRes.reason).toBe('limit_reached');
    });
  });

  describe('Download Recovery (Resend Form)', () => {
    it('finds paid orders by email case-insensitively', () => {
      const resendEmail = `patient_${Date.now()}@example.com`;
      recordOrder({
        email: resendEmail,
        providerReference: `ref_${Date.now()}`,
        status: 'confirmed',
      });

      const found = getPaidOrdersByEmail(resendEmail.toUpperCase());
      expect(found.length).toBeGreaterThanOrEqual(1);
      expect(found[0].email).toBe(resendEmail.toLowerCase());
    });

    it('returns empty list for emails with no confirmed orders', () => {
      const nonExistent = getPaidOrdersByEmail('unknown_random_person@example.com');
      expect(nonExistent).toEqual([]);
    });
  });

  describe('Webhook Signature Verification', () => {
    it('verifies valid HMAC signatures and rejects invalid ones', () => {
      const secret = 'whop_test_secret_key_12345';
      const rawPayload = JSON.stringify({ action: 'payment.succeeded', id: 'pay_123' });
      const crypto = require('node:crypto');
      const validSig = crypto.createHmac('sha256', secret).update(rawPayload).digest('hex');

      expect(verifyWhopWebhookSignature(rawPayload, validSig, secret)).toBe(true);
      expect(verifyWhopWebhookSignature(rawPayload, 'invalidsignature123', secret)).toBe(false);
    });
  });
});

