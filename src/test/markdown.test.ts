/** @vitest-environment node */
import { describe, it, expect } from 'vitest';
import { renderMarkdown } from '@/lib/content/markdown';

const known = new Set(['/symptoms/hot-flashes/']);
const render = (md: string) => renderMarkdown(md, { knownPaths: known, staticPaths: new Set(['/tools/']) });

describe('markdown renderer', () => {
  it('numbers citations in first-use order and links them to the reference list', () => {
    const r = render('One [@b-source]. Two [@a-source]. Again [@b-source].');
    expect(r.citations).toEqual(['b-source', 'a-source']);
    expect(r.html).toContain('href="#ref-1"');
    expect(r.html).toContain('href="#ref-2"');
    expect(r.html.match(/href="#ref-1"/g)).toHaveLength(2);
  });

  it('drops links to pages that are not in this build, keeping the words', () => {
    const r = render('See [night sweats](/symptoms/night-sweats/) and [hot flashes](/symptoms/hot-flashes/).');
    expect(r.html).not.toContain('/symptoms/night-sweats/');
    expect(r.html).toContain('night sweats');
    expect(r.html).toContain('href="/symptoms/hot-flashes/"');
    expect(r.links.find((l) => l.href === '/symptoms/night-sweats/')?.dropped).toBe(true);
  });

  it('marks /go/ links as sponsored nofollow and leaves external links followed', () => {
    const r = render('[Partner](/go/partner-x/) and [NHS](https://www.nhs.uk/).');
    expect(r.html).toMatch(/href="\/go\/partner-x\/" rel="sponsored nofollow"/);
    expect(r.html).toMatch(/href="https:\/\/www\.nhs\.uk\/">/);
  });

  it('marks urgent sections and records links inside them', () => {
    const r = render(':::urgent\nCall 911. [Partner](/go/x/)\n:::\n\nOutside [Partner](/go/y/).');
    expect(r.urgentSections).toBe(1);
    expect(r.html).toContain('data-urgent="true"');
    expect(r.links.find((l) => l.href === '/go/x/')?.inUrgent).toBe(true);
    expect(r.links.find((l) => l.href === '/go/y/')?.inUrgent).toBe(false);
  });

  it('collects h2/h3 headings with ids for the table of contents, and detects body h1s', () => {
    const r = render('# Not allowed\n\n## Why it happens\n\n### Hormones');
    expect(r.hasH1).toBe(true);
    expect(r.headings).toEqual([
      { depth: 2, id: 'why-it-happens', text: 'Why it happens' },
      { depth: 3, id: 'hormones', text: 'Hormones' },
    ]);
  });

  it('drops raw HTML so content cannot inject scripts', () => {
    const r = render('Hello <script>alert(1)</script> <img src=x onerror=alert(1)>');
    expect(r.html).not.toContain('<script');
    expect(r.html).not.toContain('onerror');
  });

  it('rejects unknown directives', () => {
    expect(() => render(':::buy-now\nx\n:::')).toThrow(/Unknown content directive/);
  });
});
