/**
 * npm run validate:cta
 *
 * Phase 2 scope: the safety rules that must hold before any commercial layer exists.
 *  - No /go/ (commercial) link inside an urgent section.            → error
 *  - No /go/ link anywhere on a page flagged crisis.                  → error
 *  - /go/ links only with affiliate_disclosure: true.                 → error
 *  - No /go/ link, partner URL or affiliate wording in tool results,
 *    tracker screens or urgent guidance code.                         → error
 * The full CTA matrix (content/_cta/) and banned combinations are added in
 * Phase 6. Until content/_cta/ exists, cta_profile values are only listed.
 */
import fs from 'node:fs';
import path from 'node:path';
import { loadContent, DEFAULT_CONTENT_ROOT } from '../src/lib/content/loader';
import { renderMarkdown } from '../src/lib/content/markdown';
import { Report } from './lib/report';

const r = new Report('validate:cta');
const store = loadContent(DEFAULT_CONTENT_ROOT);
const all = new Set(store.pages.map((p) => p.url));

for (const page of store.pages) {
  let rendered;
  try {
    rendered = renderMarkdown(page.body, { knownPaths: all, isAlwaysValid: () => true });
  } catch {
    continue; // validate:content reports render errors
  }
  const go = rendered.links.filter((l) => l.sponsored);
  for (const l of go.filter((x) => x.inUrgent)) r.error(page.file, `commercial link ${l.href} inside an urgent section`);
  if (page.fm.safety_flags.includes('crisis') && go.length) r.error(page.file, 'commercial links on a page flagged crisis');
  if (go.length && !page.fm.affiliate_disclosure) r.error(page.file, 'commercial links without affiliate_disclosure');
  // Placement: no commercial link before the first heading (the opening answer and evidence come first).
  const firstHeading = rendered.html.search(/<h2/);
  const firstGo = rendered.html.search(/href="\/go\//);
  if (firstGo !== -1 && (firstHeading === -1 || firstGo < firstHeading)) {
    r.error(page.file, 'commercial link appears above the opening answer (before the first section heading)');
  }
}

// Tool, tracker and urgent-guidance code must never carry commercial content.
const NO_COMMERCE_DIRS = ['src/app/app', 'src/components/app', 'src/components/safety', 'src/lib/safety'];
const COMMERCE = /\/go\/|affiliate|sponsored|utm_|commission|promo code|discount code/i;
function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(path.join(dir, e.name)) : /\.(tsx?|js)$/.test(e.name) ? [path.join(dir, e.name)] : [],
  );
}
for (const dir of NO_COMMERCE_DIRS) {
  for (const f of walk(dir)) {
    const lines = fs.readFileSync(f, 'utf8').split('\n');
    lines.forEach((line, i) => {
      if (COMMERCE.test(line) && !/^\s*(\/\/|\*|\/\*)/.test(line)) {
        r.error(`${f.replace(/\\/g, '/')}:${i + 1}`, `commercial content in a tool or urgent-guidance file: ${line.trim().slice(0, 80)}`);
      }
    });
  }
}

const profiles = [...new Set(store.pages.map((p) => p.fm.cta_profile))];
if (!fs.existsSync(path.join(DEFAULT_CONTENT_ROOT, '_cta'))) {
  r.note(`content/_cta/ not built yet (Phase 6). cta_profile values in use: ${profiles.join(', ') || 'none'}`);
}
r.finish();
