import { describe, it, expect } from 'vitest';
import { loadContent } from '@/lib/content/loader';
import { START_HERE_PATHS, STAGE_QUIZ_CTA } from '@/lib/site/start-here';

describe('start-here paths', () => {
  const store = loadContent();
  const urls = new Set([...store.pages.values()].filter((p) => p.fm.status === 'published').map((p) => p.url));

  it('has four paths of 3 to 5 steps', () => {
    expect(START_HERE_PATHS).toHaveLength(4);
    for (const p of START_HERE_PATHS) {
      expect(p.steps.length).toBeGreaterThanOrEqual(3);
      expect(p.steps.length).toBeLessThanOrEqual(5);
    }
  });

  it('links only to published pages', () => {
    const hrefs = [STAGE_QUIZ_CTA.href, ...START_HERE_PATHS.flatMap((p) => p.steps.map((s) => s.href))];
    expect(hrefs.filter((h) => !urls.has(h))).toEqual([]);
  });
});
