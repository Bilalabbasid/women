/**
 * npm run validate:free (runs automatically after `npm run build`)
 *
 * MenoVerdict is free: no ads, no affiliate links, no sponsors, no product
 * recommendations. This fails the build if any built page or generated file
 * (HTML, plus route output such as the feed, sitemap and robots.txt) contains
 * affiliate or commercial markers.
 *
 * Exceptions are exact phrases only, listed in ALLOWED with the reason. Add one
 * only when a source citation or a required statement genuinely needs the word.
 */
import fs from 'node:fs';
import path from 'node:path';
import { Report } from './lib/report';

const r = new Report('validate:free');
const base = path.join(process.cwd(), '.next', 'server', 'app');

/** Markers that must never appear in built output. Matched case-insensitively. */
export const BANNED: Array<{ label: string; re: RegExp }> = [
  { label: 'amazon.com', re: /amazon\.com/i },
  { label: 'amzn.to', re: /amzn\.to/i },
  { label: 'tag=', re: /[?&;]tag=/i },
  { label: 'linkCode=', re: /linkCode=/i },
  { label: 'Amazon Associate', re: /amazon\s+associate/i },
  { label: 'affiliate', re: /\baffiliates?\b/i },
  { label: 'commission', re: /\bcommissions?\b/i },
  { label: 'paid link', re: /paid\s+links?/i },
  { label: 'rel="sponsored"', re: /rel=(?:\\?["'])[^"'\\]*\bsponsored\b/i },
  { label: '/go/', re: /(?:href=\\?["']|["'(\s])\/go\//i },
  { label: 'awin', re: /\bawin\b/i },
];

/** Exact phrases removed before checking, each with the reason it is allowed. */
export const ALLOWED: Array<{ phrase: string; reason: string }> = [
  {
    phrase: 'Federal Trade Commission',
    reason: 'US regulator: publisher of a cited source (FTC health-products guidance) on /evidence/products-we-wont-recommend/',
  },
  {
    phrase: 'carries no ads, affiliate links or sponsored content',
    reason: 'Required independence statement (editorial policy, grading method)',
  },
  {
    phrase: 'no ads, no affiliate links and no sponsors',
    reason: 'Required funding statement (/about/how-we-make-money/, homepage)',
  },
];

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const ALLOWED_RE = ALLOWED.map((a) => new RegExp(escapeRe(a.phrase).replace(/ /g, '\\s+'), 'gi'));

function decode(text: string): string {
  return text
    .replace(/<!-- -->/g, '')
    .replace(/&#x27;|&apos;|&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"');
}

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : /\.(html|body)$/.test(e.name) ? [p] : [];
  });
}

const files = walk(base);
if (files.length === 0) {
  r.error('.next', 'no build output: run `npm run build` first');
  r.finish();
}

const allowedHits = new Map<string, number>();
for (const file of files) {
  const rel = path.relative(process.cwd(), file).replace(/\\/g, '/');
  let text = decode(fs.readFileSync(file, 'utf8'));
  ALLOWED_RE.forEach((re, i) => {
    text = text.replace(re, () => {
      allowedHits.set(ALLOWED[i].phrase, (allowedHits.get(ALLOWED[i].phrase) ?? 0) + 1);
      return ' ';
    });
  });
  for (const { label, re } of BANNED) {
    const m = re.exec(text);
    if (m) {
      const at = m.index;
      const context = text.slice(Math.max(0, at - 60), at + 60).replace(/\s+/g, ' ');
      r.error(rel, `contains "${label}": …${context}…`);
    }
  }
}

r.note(`${files.length} built file(s) checked for ${BANNED.length} commercial markers`);
for (const a of ALLOWED) r.note(`allowed "${a.phrase}" (${allowedHits.get(a.phrase) ?? 0} hit(s)): ${a.reason}`);
r.finish();
