import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { parseDocument } from 'yaml';

export const productItemSchema = z.object({
  name: z.string().min(1),
  brand: z.string().min(1),
  why_included: z.string().min(5),
  url: z.string().min(1),
  image: z.string().optional(),
  best_for: z.string().optional(),
  not_for: z.string().optional(),
  price_note: z.string().optional(),
  last_checked: z.string().optional(),
  partner_id: z.string().optional(),
  active: z.boolean().default(true),
  cautions: z.string().optional(),
});

export const productSlotSchema = z.object({
  category: z.string().min(1),
  reader_need: z.string().min(5),
  allowed_clusters: z.array(z.string()).min(1),
  claim_limit: z.string().min(5),
  choose_by: z.array(z.string()).min(1),
  disclosure: z.literal('required'),
  status: z.enum(['empty', 'filled']),
  products: z.array(productItemSchema).default([]),
});

export type ProductItem = z.infer<typeof productItemSchema>;
export type ProductSlot = z.infer<typeof productSlotSchema> & { id: string };

let cachedSlots: Map<string, ProductSlot> | null = null;

export function loadProductSlots(repoRoot: string = process.cwd()): Map<string, ProductSlot> {
  if (cachedSlots) return cachedSlots;
  const filePath = path.join(
    process.env.CONTENT_ROOT ? path.resolve(process.env.CONTENT_ROOT) : path.join(repoRoot, 'content'),
    '_products',
    'slots.yaml'
  );

  const slots = new Map<string, ProductSlot>();
  if (!fs.existsSync(filePath)) {
    cachedSlots = slots;
    return slots;
  }

  const raw = parseDocument(fs.readFileSync(filePath, 'utf8')).toJS() as Record<string, unknown>;
  for (const [id, data] of Object.entries(raw || {})) {
    const parsed = productSlotSchema.safeParse(data);
    if (parsed.success) {
      slots.set(id, { ...parsed.data, id });
    }
  }

  cachedSlots = slots;
  return slots;
}

export function getProductSlot(id: string): ProductSlot | undefined {
  return loadProductSlots().get(id);
}
