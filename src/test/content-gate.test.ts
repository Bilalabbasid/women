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

  it('publishes a clinician-approved page whose content matches its approval hash', () => {
    expect(publishProblems(page('/symptoms/hot-flashes/'), store)).toEqual([]);
  });

  it('never publishes a draft', () => {
    expect(isPublishable(page('/symptoms/night-sweats/'), store)).toBe(false);
  });

  it('resets approval when the medical content changes', () => {
    const edited = makeStore((root) => {
      const f = path.join(root, 'pages', 'symptoms', 'hot-flashes.md');
      fs.writeFileSync(f, fs.readFileSync(f, 'utf8').replace('Hot flashes are common', 'Hot flashes are very common'));
    });
    const p = edited.pages.find((x) => x.url === '/symptoms/hot-flashes/')!;
    expect(publishProblems(p, edited)).toContain('content changed after approval: approval is reset until it is re-reviewed');
  });

  it('refuses an unverified or unknown reviewer', () => {
    const unverified = makeStore((root) => {
      const f = path.join(root, '_people', 'people.yaml');
      fs.writeFileSync(f, fs.readFileSync(f, 'utf8').replace(/verified: true\n$/, 'verified: false\n'));
    });
    const p = unverified.pages.find((x) => x.url === '/symptoms/hot-flashes/')!;
    expect(publishProblems(p, unverified)).toContain('reviewer "test-clinician" is not verified by the owner');
  });

  it('refuses a page that cites a source missing from the registry', () => {
    const missing = makeStore((root) => fs.writeFileSync(path.join(root, '_sources', 'sources.yaml'), '[]\n'));
    const p = missing.pages.find((x) => x.url === '/symptoms/hot-flashes/')!;
    expect(publishProblems(p, missing)).toContain('cited source "fixture-guideline" is not in the registry');
  });

  it('shows drafts only in development and staging', () => {
    expect(visiblePages(store, 'production').map((p) => p.url)).toEqual(['/symptoms/hot-flashes/']);
    expect(visiblePages(store, 'preview').map((p) => p.url)).toEqual(['/symptoms/hot-flashes/']);
    expect(visiblePages(store, 'staging')).toHaveLength(2);
    expect(visiblePages(store, 'development')).toHaveLength(2);
  });

  it('keeps drafts and noindex pages out of indexable lists', () => {
    expect(indexablePages(store).map((p) => p.url)).toEqual(['/symptoms/hot-flashes/']);
  });
});
