import path from 'node:path';

/**
 * Shop configuration for digital products.
 * All prices and limits are strictly enforced on the server.
 */
export const SHOP_CONFIG = {
  productId: 'menopause-symptom-journal',
  productTitle: 'Menopause Symptom Journal & Doctor Visit Toolkit (Printable PDF)',
  productPriceCents: 899, // $8.99 USD in cents
  productPriceFormatted: '$8.99',
  currency: 'USD',
  filename: 'MenoVerdict-Symptom-Journal-and-Doctor-Visit-Toolkit.pdf',
  
  // Storage path outside public directory
  filePath: process.env.SHOP_PDF_PATH || path.join(process.cwd(), 'storage', 'products', 'MenoVerdict-Symptom-Journal-and-Doctor-Visit-Toolkit.pdf'),
  
  // Security & download link rules
  downloadLinkExpiryDays: 7, // Links expire after 7 days
  maxDownloadsPerToken: 10,   // Up to 10 downloads per purchase token
  
  // Whop credentials & endpoints
  whop: {
    apiKey: process.env.WHOP_API_KEY || '',
    webhookSecret: process.env.WHOP_WEBHOOK_SECRET || '',
    checkoutUrl: process.env.WHOP_CHECKOUT_URL || '',
    apiBase: process.env.WHOP_API_BASE || 'https://api.whop.com',
  },
  
  // Secret used to sign HMAC tokens for tamper-proof download validation
  shopSecret: process.env.SHOP_SECRET_KEY || 'menoverdict_hmac_shop_secret_key_default',
};

