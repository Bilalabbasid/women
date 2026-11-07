/**
 * npm run validate:honesty (run after `npm run build`)
 *
 * The site's first rule: say plainly, everywhere, that we are not doctors and
 * that AI helped. This fails the build when:
 *  - any built page (home, hubs, legal pages, 404, the app) lacks the footer line
 *  - any article, tool or comparison page lacks the short notice under its H1
 *    or the full "How this page was made" notice
 *  - the retired "based on what you searched for" wording reappears
 *  - a page shows "medically reviewed" without a verified clinician approval
 */
import fs from 'node:fs';
import path from 'node:path';
import { Report } from './lib/report';
import { getContent } from '../src/lib/content/loader';
import { isPublishable, isMedicallyReviewed } from '../src/lib/content/gate';
import { NAV_HUBS } from '../src/lib/content/site-data';
import { HONESTY_ANCHOR, HONESTY_FOOTER, HONESTY_SHORT } from '../src/lib/site/honesty';

const r = new Report('validate:honesty');
const root = path.join(process.cwd(), '.next', 'server', 'app');

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : e.name.endsWith('.html') ? [p] : [];
  });
}

/** .next/server/app/symptoms/hot-flashes.html -> /symptoms/hot-flashes/ */
function urlOf(file: string): string {
  const rel = path.relative(root, file).replace(/\\/g, '/').replace(/\.html$/, '');
  return rel === 'index' ? '/' : `/${rel}/`;
}

// React escapes nothing in these strings, but HTML may wrap the em dash; compare on text.
const decode = (html: string) =>
  html
    .replace(/<!-- -->/g, '')
    .replace(/&#x27;|&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"');

// Framework-only error shells that never render site chrome.
const SKIP = new Set(['/_global-error/']);

const files = walk(root);
if (files.length === 0) {
  r.error('.next', 'no build output: run `npm run build` first');
  r.finish();
}

const store = getContent();
const byUrl = new Map(store.pages.map((p) => [p.url, p]));
let checked = 0;
let full = 0;

for (const f of files) {
  const url = urlOf(f);
  if (SKIP.has(url)) continue;
  const html = decode(fs.readFileSync(f, 'utf8'));
  checked++;

  if (!html.includes(HONESTY_FOOTER)) r.error(url, 'missing the footer honesty line');
  if (/based on what you searched for|the symptoms you searched for/.test(html)) {
    r.error(url, 'contains the retired "based on what you searched for" wording');
  }

  const page = byUrl.get(url);
  if (!page || !isPublishable(page, store)) continue;

  const needsFull = page.isMedical && !(NAV_HUBS as readonly string[]).includes(url);
  if (needsFull) {
    full++;
    if (!html.includes(HONESTY_SHORT.text)) r.error(url, 'missing the short honesty notice under the H1');
    if (!html.includes(`id="${HONESTY_ANCHOR}"`)) r.error(url, 'missing the full "How this page was made" notice');
  }

  if (/medically reviewed by/i.test(html) && !isMedicallyReviewed(page, store)) {
    r.error(url, 'says "medically reviewed" without a verified clinician approval of this exact version');
  }
}

r.note(`checked ${checked} built pages; ${full} article, tool and comparison pages carry the full notice`);
r.finish();
