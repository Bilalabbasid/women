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
import { getGrade } from '../src/lib/grades/registry';
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

/** Editor-only notes that must never be published. */
const EDITOR_NOTES = [/Replace with/, /\bTODO\b/, /\bFIXME\b/, /not yet reviewed/i];

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
let gradeBadges = 0;

for (const f of files) {
  const url = urlOf(f);
  if (SKIP.has(url)) continue;
  const html = decode(fs.readFileSync(f, 'utf8'));
  checked++;

  if (!html.includes(HONESTY_FOOTER)) r.error(url, 'missing the footer honesty line');

  // Published-output hygiene: nothing meant for editors may reach readers.
  const visible = html.replace(/<script\b[\s\S]*?<\/script>/gi, ' ');
  if (visible.includes('[@')) r.error(url, 'raw citation key "[@" in the page (the citation renderer missed it)');
  for (const note of EDITOR_NOTES) {
    if (note.test(visible)) r.error(url, `editor note published: ${note}`);
  }
  for (const m of visible.matchAll(/:<\/p>/gi)) {
    // The next element that opens, skipping closing tags (an island such as a product card
    // starts right after the text block that introduces it closes).
    const after = visible.slice(m.index! + m[0].length);
    const next = after.match(/^(?:\s|<\/[a-z]+>|<!--[\s\S]*?-->)*(<[a-z]+[^>]*>)?/i)?.[1] ?? '';
    // A colon may introduce a list, table, quote, a doctor-questions box or numbered sub-steps.
    if (!/^<(ul|ol|table|blockquote|aside|pre|h3|h4)\b|^<div class="(table-wrap|doctor-questions)/.test(next)) {
      r.error(url, `a paragraph ends with ":" but nothing follows it (next: ${next.slice(0, 40) || 'end'})`);
    }
  }
  if (/based on what you searched for|the symptoms you searched for/.test(html)) {
    r.error(url, 'contains the retired "based on what you searched for" wording');
  }

  // Every registry badge on the page shows exactly the registry's grade.
  for (const m of visible.matchAll(/class="grade grade-([a-z_]+)" data-grade-id="([a-z0-9-]+)"/g)) {
    const entry = getGrade(m[2]);
    if (!entry) r.error(url, `grade badge for unknown registry id "${m[2]}"`);
    else if (entry.grade !== m[1]) r.error(url, `"${m[2]}" shows "${m[1]}" but the registry says "${entry.grade}"`);
    gradeBadges++;
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

r.note(`checked ${checked} built pages; ${full} article, tool and comparison pages carry the full notice; ${gradeBadges} registry grade badges match the registry`);
r.finish();
