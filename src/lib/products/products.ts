import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { parseDocument } from 'yaml';

/**
 * True when an affiliate URL carries only the network's own tag. SiteStripe
 * copies add tracking (ascsubtag, btn_ref, gaOptInStatus, ref_, linkId…) that
 * we never send.
 */
export function isCleanAmazonUrl(url: string, tag: string): boolean {
  try {
    const u = new URL(url);
    const keys = [...u.searchParams.keys()];
    return u.hostname === 'www.amazon.com' && keys.length === 1 && u.searchParams.get('tag') === tag;
  } catch {
    return false;
  }
}

export const amazonProductSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    brand: z.string().min(1),
    asin: z.string().min(1),
    amazon_url: z.string().url(),
    tracking_id: z.string().min(1),
    best_for: z.string().min(5),
    why_included: z.string().min(10),
    what_it_wont_do: z.string().min(10),
    who_should_check_first: z.string().min(10),
    allowed_topics: z.array(z.string()).default([]),
    banned_contexts: z.array(z.string()).default([]),
  })
  .refine((p) => isCleanAmazonUrl(p.amazon_url, p.tracking_id), {
    message: 'amazon_url must be https://www.amazon.com/dp/{ASIN}?tag={tracking_id} with no other parameters',
    path: ['amazon_url'],
  });

export type AmazonProduct = z.infer<typeof amazonProductSchema>;

let cachedProducts: Map<string, AmazonProduct> | null = null;

export function loadAmazonProducts(repoRoot: string = process.cwd()): Map<string, AmazonProduct> {
  if (cachedProducts) return cachedProducts;

  const filePath = path.join(
    process.env.CONTENT_ROOT ? path.resolve(process.env.CONTENT_ROOT) : path.join(repoRoot, 'content'),
    '_products',
    'products.yaml'
  );

  const products = new Map<string, AmazonProduct>();
  if (!fs.existsSync(filePath)) {
    cachedProducts = products;
    return products;
  }

  const raw = parseDocument(fs.readFileSync(filePath, 'utf8')).toJS() as Record<string, unknown>;
  for (const [id, data] of Object.entries(raw || {})) {
    const parsed = amazonProductSchema.safeParse(data);
    if (parsed.success) {
      products.set(id, parsed.data);
    } else {
      console.warn(`Invalid product in products.yaml for id "${id}":`, parsed.error.issues);
    }
  }

  cachedProducts = products;
  return products;
}

export function getAmazonProduct(id: string): AmazonProduct | undefined {
  return loadAmazonProducts().get(id);
}

