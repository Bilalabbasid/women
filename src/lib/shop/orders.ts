import fs from 'node:fs';
import path from 'node:path';
import { SHOP_CONFIG } from './config';

export type OrderStatus = 'pending' | 'confirmed' | 'refunded' | 'failed';

export interface Order {
  orderId: string;
  email: string;
  product: string;
  amount: number;       // In cents (899 = $8.99)
  currency: string;     // USD
  providerReference: string; // Whop payment/checkout id
  status: OrderStatus;
  createdAt: string;    // ISO string
  updatedAt: string;
  downloadCount: number;
}

const ORDERS_FILE = path.join(process.cwd(), 'storage', 'orders.json');

// In-memory cache to guarantee fast access and serverless safety
const memoryOrders = new Map<string, Order>();

function ensureStorageDir() {
  const dir = path.dirname(ORDERS_FILE);
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch {
      // Ignore if filesystem is read-only in certain serverless environments
    }
  }
}

function loadOrders(): void {
  try {
    ensureStorageDir();
    if (fs.existsSync(ORDERS_FILE)) {
      const data = JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8'));
      if (Array.isArray(data)) {
        for (const order of data) {
          memoryOrders.set(order.orderId, order);
        }
      }
    }
  } catch (err) {
    console.error('Error loading orders file, using in-memory store:', err);
  }
}

function persistOrders(): void {
  try {
    ensureStorageDir();
    const data = Array.from(memoryOrders.values());
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Could not write orders file (running in memory):', err);
  }
}

// Initial load
loadOrders();

/**
 * Creates or updates an order idempotently.
 * Never creates duplicate orders for the same providerReference.
 */
export function recordOrder(data: {
  orderId?: string;
  email: string;
  product?: string;
  amount?: number;
  currency?: string;
  providerReference: string;
  status: OrderStatus;
}): Order {
  loadOrders();

  // Check if order already exists for this providerReference (idempotency check)
  const existingByRef = Array.from(memoryOrders.values()).find(
    (o) => o.providerReference === data.providerReference
  );

  const now = new Date().toISOString();

  if (existingByRef) {
    existingByRef.status = data.status;
    existingByRef.updatedAt = now;
    if (data.email) existingByRef.email = data.email.toLowerCase().trim();
    persistOrders();
    return existingByRef;
  }

  const orderId = data.orderId || `ord_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const newOrder: Order = {
    orderId,
    email: data.email.toLowerCase().trim(),
    product: data.product || SHOP_CONFIG.productId,
    amount: data.amount !== undefined ? data.amount : SHOP_CONFIG.productPriceCents,
    currency: data.currency || SHOP_CONFIG.currency,
    providerReference: data.providerReference,
    status: data.status,
    createdAt: now,
    updatedAt: now,
    downloadCount: 0,
  };

  memoryOrders.set(orderId, newOrder);
  persistOrders();
  return newOrder;
}

export function getOrderById(orderId: string): Order | null {
  loadOrders();
  return memoryOrders.get(orderId) || null;
}

export function getOrderByProviderRef(providerReference: string): Order | null {
  loadOrders();
  return (
    Array.from(memoryOrders.values()).find(
      (o) => o.providerReference === providerReference
    ) || null
  );
}

export function getPaidOrdersByEmail(email: string): Order[] {
  loadOrders();
  const normalized = email.toLowerCase().trim();
  return Array.from(memoryOrders.values()).filter(
    (o) => o.email === normalized && o.status === 'confirmed'
  );
}

/**
 * Checks whether an order is eligible for download and increments the download count.
 */
export function recordDownload(orderId: string): {
  allowed: boolean;
  reason?: 'order_not_found' | 'not_paid' | 'refunded' | 'limit_reached';
  downloadsRemaining?: number;
} {
  loadOrders();
  const order = memoryOrders.get(orderId);

  if (!order) {
    return { allowed: false, reason: 'order_not_found' };
  }

  if (order.status === 'refunded') {
    return { allowed: false, reason: 'refunded' };
  }

  if (order.status !== 'confirmed') {
    return { allowed: false, reason: 'not_paid' };
  }

  if (order.downloadCount >= SHOP_CONFIG.maxDownloadsPerToken) {
    return { allowed: false, reason: 'limit_reached', downloadsRemaining: 0 };
  }

  order.downloadCount += 1;
  order.updatedAt = new Date().toISOString();
  persistOrders();

  return {
    allowed: true,
    downloadsRemaining: SHOP_CONFIG.maxDownloadsPerToken - order.downloadCount,
  };
}

/**
 * Marks an order refunded upon receipt of refund webhook.
 * Immediately revokes download access.
 */
export function markOrderRefunded(providerReference: string): boolean {
  loadOrders();
  const order = Array.from(memoryOrders.values()).find(
    (o) => o.providerReference === providerReference
  );

  if (order) {
    order.status = 'refunded';
    order.updatedAt = new Date().toISOString();
    persistOrders();
    return true;
  }
  return false;
}

