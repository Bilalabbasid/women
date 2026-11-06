import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { parseDocument } from 'yaml';

export const amazonProductSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  brand: z.string().min(1),
  asin: z.string().min(1),
  short_link: z.string().url(),
  amazon_url: z.string().url(),
  tracking_id: z.string().min(1),
  best_for: z.string().min(5),
  why_included: z.string().min(10),
  what_it_wont_do: z.string().min(10),
  who_should_check_first: z.string().min(10),
  allowed_topics: z.array(z.string()).default([]),
  banned_contexts: z.array(z.string()).default([]),
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

