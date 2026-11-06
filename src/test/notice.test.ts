/** @vitest-environment node */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { STANDARD_NOTICE } from '@/lib/site/notice';

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8');

describe('standard medical notice', () => {
  it('is exactly the owner-approved wording', () => {
    expect(STANDARD_NOTICE).toBe(
      "General information based on published sources and the symptoms you searched for. This isn't medical or legal advice, a diagnosis or a treatment plan. Please consult a doctor about your own symptoms. If your symptoms are severe or sudden, seek urgent care.",
    );
  });

  it('is used by the article notice and the footer, with no other copy of the old wording', () => {
    expect(read('src/components/site/standard-notice.tsx')).toContain('STANDARD_NOTICE');
    expect(read('src/components/site/site-chrome.tsx')).toContain('STANDARD_NOTICE');
    for (const f of ['src/components/site/standard-notice.tsx', 'src/components/site/site-chrome.tsx']) {
      expect(read(f)).not.toMatch(/aren(&apos;|')t doctors, and this/);
    }
  });

  it('matches the medical disclaimer page', () => {
    expect(read('content/pages/medical-disclaimer.md')).toContain(STANDARD_NOTICE);
  });
});
