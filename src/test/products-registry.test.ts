/** @vitest-environment node */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { parseDocument } from 'yaml';
import { amazonProductSchema, isCleanAmazonUrl } from '@/lib/products/products';

const raw = parseDocument(
  fs.readFileSync(path.join(process.cwd(), 'content', '_products', 'products.yaml'), 'utf8'),
).toJS() as Record<string, unknown>;

describe('affiliate product registry', () => {
  it('every product parses (a product that fails is silently dropped from the site)', () => {
    for (const [id, data] of Object.entries(raw)) {
      const parsed = amazonProductSchema.safeParse(data);
      expect(parsed.success, `${id}: ${parsed.success ? '' : JSON.stringify(parsed.error.issues)}`).toBe(true);
    }
  });

  it('carries only the affiliate tag: no SiteStripe tracking parameters', () => {
    expect(isCleanAmazonUrl('https://www.amazon.com/dp/B000P9WSMY?tag=x-20', 'x-20')).toBe(true);
    expect(
      isCleanAmazonUrl('https://www.amazon.com/dp/B000P9WSMY?tag=x-20&ascsubtag=srctok-1&btn_ref=srctok-1', 'x-20'),
    ).toBe(false);
    expect(isCleanAmazonUrl('https://www.amazon.com/dp/B000P9WSMY?tag=y-20', 'x-20')).toBe(false);
  });
});
