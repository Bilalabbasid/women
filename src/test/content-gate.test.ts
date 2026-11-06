/** @vitest-environment node */
import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { loadContent, splitFrontmatter, contentHash, urlFromFile, type ContentStore } from '@/lib/content/loader';
import { frontmatterSchema } from '@/lib/content/schema';
import { publishProblems, isPublishable, visiblePages, indexablePages } from '@/lib/content/gate';

const FIXTURE = path.join(__dirname, 'fixtures', 'content');

/** Copy fixtures to a temp dir and stamp the approved page with its real hash. */
function makeStore(mutate?: (dir: string) => void): ContentStore {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'content-'));
  const root = path.join(dir, 'content');
  fs.cpSync(FIXTURE, root, { recursive: true });
  const file = path.join(root, 'pages', 'symptoms', 'hot-flashes.md');
  const raw = fs.readFileSync(file, 'utf8').replace('approved_hash: HASH_PLACEHOLDER\n', '');
  const split = splitFrontmatter(raw)!;
  const fm = frontmatterSchema.parse(split.data);
  const hash = contentHash(fm, split.body);
  fs.writeFileSync(file, raw.replace(/\n---\n/, `\napproved_hash: ${hash}\n---\n`));
  mutate?.(root);
  return loadContent(root);
}

describe('content loader', () => {
  it('derives URLs from file paths with trailing slashes', () => {
    expect(urlFromFile('symptoms/hot-flashes.md')).toBe('/symptoms/hot-flashes/');
    expect(urlFromFile('symptoms/index.md')).toBe('/symptoms/');
  });

  it('loads valid fixtures without errors', () => {
    const store = makeStore();
    expect(store.errors).toEqual([]);
    expect(store.pages.map((p) => p.url).sort()).toEqual(['/symptoms/hot-flashes/', '/symptoms/night-sweats/']);
  });

  it('fails when a required field is missing', () => {
    const store = makeStore((root) => {
      const f = path.join(root, 'pages', 'symptoms', 'night-sweats.md');
      fs.writeFileSync(f, fs.readFileSync(f, 'utf8').replace(/^audience_limits: \[\]\n/m, ''));
    });
    expect(store.errors.some((e) => /missing required frontmatter: audience_limits/.test(e.message))).toBe(true);
  });

  it('fails when the slug does not match the file name', () => {
    const store = makeStore((root) => {
      const f = path.join(root, 'pages', 'symptoms', 'night-sweats.md');
      fs.writeFileSync(f, fs.readFileSync(f, 'utf8').replace('slug: night-sweats', 'slug: night-sweat'));
    });
    expect(store.errors.some((e) => /slug "night-sweat" must match/.test(e.message))).toBe(true);
  });

  it('rejects unknown frontmatter keys', () => {
    const store = makeStore((root) => {
      const f = path.join(root, 'pages', 'symptoms', 'night-sweats.md');
      fs.writeFileSync(f, fs.readFileSync(f, 'utf8').replace('slug: night-sweats', 'slug: night-sweats\nrating: 5'));
    });
    expect(store.errors.length).toBeGreaterThan(0);
  });
});

describe('publish gate', () => {
  let store: ContentStore;
  beforeAll(() => {
    store = makeStore();
  });
  const page = (url: string) => store.pages.find((p) => p.url === url)!;

  it('publishes pages once sources are checked (Prompt 2 Owner Decisions 1 & 2)', () => {
    expect(publishProblems(page('/symptoms/hot-flashes/'), store)).toEqual([]);
    expect(isPublishable(page('/symptoms/hot-flashes/'), store)).toBe(true);
    expect(isPublishable(page('/symptoms/night-sweats/'), store)).toBe(true);
  });

  it('determines medical review honesty correctly (Prompt 2 Owner Decision 3)', async () => {
    const { isMedicallyReviewed } = await import('../lib/content/gate');
    // Approved fixture matches its hash and verified reviewer
    expect(isMedicallyReviewed(page('/symptoms/hot-flashes/'), store)).toBe(true);

    // When medical content changes, medical review is reset
    const edited = makeStore((root) => {
      const f = path.join(root, 'pages', 'symptoms', 'hot-flashes.md');
      fs.writeFileSync(f, fs.readFileSync(f, 'utf8').replace('Hot flashes are common', 'Hot flashes are very common'));
    });
    const p = edited.pages.find((x) => x.url === '/symptoms/hot-flashes/')!;
    expect(isMedicallyReviewed(p, edited)).toBe(false);

    // When reviewer is unverified, medical review is false
    const unverified = makeStore((root) => {
      const f = path.join(root, '_people', 'people.yaml');
      fs.writeFileSync(f, fs.readFileSync(f, 'utf8').replace(/verified: true\n$/, 'verified: false\n'));
    });
    const unverifiedPage = unverified.pages.find((x) => x.url === '/symptoms/hot-flashes/')!;
    expect(isMedicallyReviewed(unverifiedPage, unverified)).toBe(false);
  });

  it('refuses a page that cites a source missing from the registry', () => {
    const missing = makeStore((root) => fs.writeFileSync(path.join(root, '_sources', 'sources.yaml'), '[]\n'));
    const p = missing.pages.find((x) => x.url === '/symptoms/hot-flashes/')!;
    expect(publishProblems(p, missing)).toContain('cited source "fixture-guideline" is not in the registry');
  });

  it('publishes all finished pages in production (Prompt 2: Everything goes live)', () => {
    expect(visiblePages(store, 'production').map((p) => p.url)).toEqual([
      '/symptoms/hot-flashes/',
      '/symptoms/night-sweats/',
    ]);
  });

  it('includes published pages in indexable lists unless explicitly noindex', () => {
    expect(indexablePages(store).map((p) => p.url)).toEqual([
      '/symptoms/hot-flashes/',
      '/symptoms/night-sweats/',
    ]);
  });
});
