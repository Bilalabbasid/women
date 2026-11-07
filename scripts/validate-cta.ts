/**
 * npm run validate:cta
 *
 *  - CTA profiles pass their rules, and each page names a real profile.
 *  - Tool, tracker and urgent-guidance code carries no commercial content.
 * MenoVerdict carries no ads, affiliate links or sponsored content; built pages
 * are also checked by scripts/validate-free.ts.
 */
import fs from 'node:fs';
import path from 'node:path';
import { loadContent, DEFAULT_CONTENT_ROOT } from '../src/lib/content/loader';
import { loadCtaProfiles, profileProblems } from '../src/lib/cta/profiles';
import { Report } from './lib/report';

const r = new Report('validate:cta');
const store = loadContent(DEFAULT_CONTENT_ROOT);

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

// CTA profiles: schema, matrix invariants, and every page's profile must exist.
const { profiles, errors: profileErrors } = loadCtaProfiles();
for (const e of profileErrors) r.error('content/_cta', e);
for (const p of profileProblems(profiles)) r.error('content/_cta/profiles.yaml', p);
for (const page of store.pages) {
  const profile = profiles[page.fm.cta_profile];
  if (!profile) r.error(page.file, `unknown cta_profile "${page.fm.cta_profile}"`);
}
r.note(`${Object.keys(profiles).length} CTA profile(s) checked`);
r.finish();
