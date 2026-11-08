import { SHOP_CONFIG } from './config';

/**
 * Sends order receipt and secure download link via Resend if configured.
 * Never throws if email service is unconfigured or fails (fallback thank-you page still works).
 */
export async function sendOrderReceiptEmail(params: {
  toEmail: string;
  orderId: string;
  downloadUrl: string;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.FORMS_NOTIFY_FROM || 'orders@menoverdict.com';

  if (!apiKey) {
    console.info('[Shop] RESEND_API_KEY not configured; email delivery skipped. Order available on thank-you page.');
    return false;
  }

  const subject = `Your MenoVerdict Symptom Journal & Doctor Visit Toolkit (Download Link)`;
  const text = `Thank you for purchasing the MenoVerdict Symptom Journal & Doctor Visit Toolkit!

Order ID: ${params.orderId}
Product: ${SHOP_CONFIG.productTitle}
Amount: ${SHOP_CONFIG.productPriceFormatted} ${SHOP_CONFIG.currency}

Your Secure Download Link:
${params.downloadUrl}

Important Notes:
• Your download link is valid for ${SHOP_CONFIG.downloadLinkExpiryDays} days and up to ${SHOP_CONFIG.maxDownloadsPerToken} downloads.
• If you ever lose your link, you can request a new one anytime using your purchase email at https://menoverdict.com/shop/resend/.
• If you have any questions or need help opening your PDF, reply directly to this email or visit https://menoverdict.com/contact/.

Refund Policy:
If the file doesn't download or open, or you're unhappy with it, email us within 14 days for a full refund.

Warmly,
The MenoVerdict Team
https://menoverdict.com`;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [params.toEmail],
        subject,
        text,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn('[Shop] Resend email delivery failed:', res.status, errText);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Shop] Error sending receipt email:', err);
    return false;
  }
}

