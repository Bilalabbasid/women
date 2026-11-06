/**
 * Records an approval for ONE page, stamping the hash of its current content.
 *
 *   npx tsx scripts/approve-page.ts content/pages/symptoms/hot-flashes.md --reviewer jane-doe-md [--date 2026-11-20]
 *   npx tsx scripts/approve-page.ts content/pages/about.md --owner [--date 2026-11-20]
 *
 * Use it ONLY after the named clinician (or, for non-medical pages, the owner)
 * has actually reviewed this exact version (AGENTS.md rules 3 and 4). It does
 * not review anything itself. Any later edit to the content changes the hash,
 * and the publish gate then withholds the page until it is approved again.
 *
 * Medical pages: status → clinician_approved, reviewer, reviewed_at, review_due
 * (12 months later), approved_hash. The reviewer must exist in
 * content/_people/people.yaml as a verified clinical reviewer.
 */
import fs from 'node:fs';
import path from 'node:path';
import { parseDocument } from 'yaml';
import { loadContent, DEFAULT_CONTENT_ROOT } from '../src/lib/content/loader';

const args = process.argv.slice(2);
const file = args.find((a) => a.endsWith('.md'));
const reviewerId = args.includes('--reviewer') ? args[args.indexOf('--reviewer') + 1] : null;
const asOwner = args.includes('--owner');
const date = args.includes('--date') ? args[args.indexOf('--date') + 1] : new Date().toISOString().slice(0, 10);

function fail(msg: string): never {
  console.error(`approve-page: ${msg}`);
  process.exit(1);
}

if (!file) fail('pass the page file, for example content/pages/symptoms/hot-flashes.md');
if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) fail('--date must be YYYY-MM-DD');

const store = loadContent(DEFAULT_CONTENT_ROOT);
const abs = path.resolve(file);
const page = store.pages.find((p) => path.resolve(path.dirname(DEFAULT_CONTENT_ROOT), p.file) === abs);
if (!page) fail(`${file} isn't a valid content page (run validate:content to see why)`);

const raw = fs.readFileSync(abs, 'utf8');
const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(raw)!;
const doc = parseDocument(m[1]);

if (page.isMedical) {
  if (asOwner) fail('medical pages need a clinician: use --reviewer <id>');
  if (!reviewerId) fail('medical pages need --reviewer <id>');
  const reviewer = store.people.get(reviewerId);
  if (!reviewer?.roles.includes('clinical_reviewer')) fail(`"${reviewerId}" is not a clinical reviewer in people.yaml`);
  if (!reviewer.verified) fail(`"${reviewerId}" is not verified by the owner yet`);
  const due = new Date(`${date}T12:00:00Z`);
  due.setUTCFullYear(due.getUTCFullYear() + 1);
  doc.set('status', 'clinician_approved');
  doc.set('reviewer', reviewerId);
  doc.set('reviewed_at', date);
  doc.set('review_due', due.toISOString().slice(0, 10));
} else {
  if (!asOwner) fail('non-medical pages are approved by the owner: use --owner');
  doc.set('status', 'owner_approved');
}
doc.set('approved_hash', page.hash);

fs.writeFileSync(abs, `---\n${doc.toString().trimEnd()}\n---\n${m[2]}`);
console.log(`approve-page: ${page.url} approved (${page.isMedical ? `reviewer ${reviewerId}` : 'owner'}), hash ${page.hash.slice(0, 12)}…`);
