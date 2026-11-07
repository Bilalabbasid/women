/** @vitest-environment node */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { HONESTY_FOOTER, HONESTY_FULL, HONESTY_SHORT } from '@/lib/site/honesty';

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8');

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === 'node_modules' || e.name === 'fixtures' ? [] : walk(p);
    return /\.(tsx?|md|ya?ml)$/.test(e.name) ? [p] : [];
  });
}

describe('honesty notice copy', () => {
  it('says plainly that we are not doctors and that AI helped', () => {
    expect(HONESTY_SHORT.text).toContain('not by a doctor');
    expect(HONESTY_SHORT.text).toContain('AI');
    expect(HONESTY_FOOTER).toContain('not a medical service');
    expect(HONESTY_FULL.lead).toContain('We are not doctors');
    expect(HONESTY_FULL.lead).toContain('no doctor wrote this page');
  });

  it('the reviewer variant still says no doctor wrote the page, and that the check is not personal advice', () => {
    const t = HONESTY_FULL.leadReviewed({ name: 'A Person', credentials: 'MD', date: 'November 7, 2026' });
    expect(t).toContain('No doctor wrote this page');
    expect(t).toContain('not personal medical advice');
  });

  it('lives in one file: the footer and app shell import it rather than copying it', () => {
    expect(read('src/components/site/site-chrome.tsx')).toContain('HONESTY_FOOTER');
    expect(read('src/components/site/honesty-notice.tsx')).toContain('HONESTY_FULL');
  });

  it('the old "based on what you searched for" wording is gone from code and content', () => {
    const files = [...walk(path.join(process.cwd(), 'src')), ...walk(path.join(process.cwd(), 'content'))];
    for (const f of files) {
      if (f.endsWith('notice.test.ts')) continue;
      expect(fs.readFileSync(f, 'utf8'), f).not.toMatch(/based on what you searched for|the symptoms you searched for/);
    }
  });
});
