import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { parseQuotes } from '@/lib/content/quotes';
import { contentPageLd } from '@/lib/seo/jsonld';
import { loadContent } from '@/lib/content/loader';

describe('reader quotes', () => {
  it('ships empty, so the section is hidden', () => {
    expect(parseQuotes(fs.readFileSync(path.join(process.cwd(), 'content/_quotes.yaml'), 'utf8'))).toEqual([]);
  });
  it('rejects quotes without permission', () => {
    expect(() => parseQuotes('quotes:\n  - text: "x"\n    page: /a/\n    received: "2026-01-01"\n    permission: false\n')).toThrow();
  });
});

describe('byline in structured data', () => {
  it('names the editorial team as author and claims no review on unreviewed pages', () => {
    const store = loadContent();
    const page = [...store.pages.values()].find((p) => p.isMedical && !p.fm.reviewer);
    expect(page).toBeDefined();
    const ld = contentPageLd(page!, store) as Record<string, unknown>;
    expect(ld.author).toMatchObject({ '@type': 'Organization', name: 'MenoVerdict editorial team' });
    expect(ld.reviewedBy).toBeUndefined();
  });
});
