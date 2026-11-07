/**
 * npm run validate:content
 *
 * Fails the build when (AGENTS.md "Automated checks"):
 *  - any frontmatter field is missing or malformed, or a registry entry is invalid
 *  - a page claims approval (clinician_approved / owner_approved / published) but fails the publish gate
 *  - a cited source ID doesn't exist, or a published page cites an unverified source
 *  - a frontmatter claim has no source, or a [@citation] isn't listed in `sources`
 *  - two published pages share a primary keyword without an explicit override
 *  - titles or descriptions are missing or duplicated, or the body contains an H1
 *  - banned phrases appear without a reasoned override
 *  - a published page's review date has passed (the owner must update or unpublish)
 *  - a content URL collides with a code route or the private tracker
 */
import { loadContent, DEFAULT_CONTENT_ROOT } from '../src/lib/content/loader';
import { publishProblems, isPublishable } from '../src/lib/content/gate';
import { renderMarkdown } from '../src/lib/content/markdown';
import { findBannedPhrases } from '../src/lib/content/banned-phrases';
import { STATIC_PUBLIC_PATHS } from '../src/lib/content/site-data';
import { loadToolLogic, toolApprovalProblems } from '../src/lib/tools/logic';
import { URGENT_TRIGGERS } from '../src/lib/safety/urgent-triggers';
import { Report } from './lib/report';
import { GRADE_REGISTRY } from '../src/lib/grades/registry';
import { EVIDENCE_GRADES } from '../src/lib/content/schema';

const today = process.env.VALIDATE_TODAY ?? new Date().toISOString().slice(0, 10);
const r = new Report('validate:content');
const store = loadContent(DEFAULT_CONTENT_ROOT);

for (const e of store.errors) r.error(e.file, e.message);

/** [what the description promises, what a heading must mention to deliver it, label] */
const DESCRIPTION_PROMISES: Array<[RegExp, RegExp, string]> = [
  [/\bsafety\b|\bsafe\b/i, /safe|risk|caution|side effect|who should|avoid|interaction|warning|harm/i, 'safety'],
  [/side effects?/i, /side effect|risk|safe/i, 'side effects'],
  [/\b(cost|costs|price|prices|pricing)\b/i, /cost|price|pricing|pay|insurance|afford/i, 'cost'],
  [/\bdos(e|es|age|ing)\b/i, /dose|dosage|dosing|how much/i, 'dosage'],
  [/\binteractions?\b/i, /interaction|medication|drug/i, 'interactions'],
  [/\bhow long\b/i, /how long|duration|last|timeline/i, 'how long'],
  [/\balternatives?\b/i, /alternative|instead|what (else|works|helps)|options/i, 'alternatives'],
  [/when to (see|call|get)/i, /when to|doctor|get help|urgent|appointment/i, 'when to see a doctor'],
];

const claimsApproval = (s: string) => ['clinician_approved', 'owner_approved', 'published'].includes(s);
const published = store.pages.filter((p) => isPublishable(p, store));
const allPaths = new Set(store.pages.map((p) => p.url));

for (const page of store.pages) {
  const { fm, file } = page;
  const isPub = published.includes(page);

  // Approval claimed but the gate disagrees.
  if (claimsApproval(fm.status)) {
    for (const p of publishProblems(page, store)) r.error(file, `status "${fm.status}" but: ${p}`);
  }
  if (page.isMedical && fm.status === 'owner_approved') r.error(file, 'medical pages cannot use owner_approved');
  if (!page.isMedical && (fm.status === 'clinician_approved' || fm.status === 'evidence_checked')) {
    r.error(file, `non-medical page (${fm.page_type}) must use the owner_approved flow`);
  }

  // Sources and claims.
  for (const id of fm.sources) {
    const s = store.sources.get(id);
    if (!s) r.error(file, `cited source "${id}" is not in content/_sources/sources.yaml`);
    else if (isPub && !s.verified) r.error(file, `published page cites unverified source "${id}"`);
  }
  for (const c of fm.claims) {
    if (c.sources.length === 0) r.error(file, `claim "${c.id}" has no source`);
    for (const id of c.sources) {
      if (!fm.sources.includes(id)) r.error(file, `claim "${c.id}" cites "${id}", which is missing from the page's sources list`);
    }
  }

  // Body checks.
  let rendered;
  try {
    rendered = renderMarkdown(page.body, { knownPaths: allPaths, isAlwaysValid: () => true });
  } catch (err) {
    r.error(file, (err as Error).message);
    continue;
  }
  if (rendered.hasH1) r.error(file, 'body contains an H1: the title is the only H1');
  for (const id of rendered.citations) {
    if (!fm.sources.includes(id)) r.error(file, `body cites [@${id}] but it is not in the page's sources list`);
  }
  if (rendered.text.split(/\s+/).length < 40 && fm.page_type !== 'hub') r.warn(file, 'body is very short');

  // Banned phrases across everything a reader sees.
  const visibleText = [fm.title, fm.meta_description, rendered.text, ...(fm.faq ?? []).flatMap((f) => [f.q, f.a])].join('\n');
  for (const hit of findBannedPhrases(visibleText, fm.banned_phrase_overrides)) {
    r.error(file, `banned phrase "${hit.match}" (${hit.why}). Remove it, or add a reasoned banned_phrase_overrides entry`);
  }

  // The meta description must not promise a topic the page has no section for
  // (e.g. "safety considerations" on a page with no safety heading).
  const headingText = [fm.title, ...rendered.headings.map((h) => h.text)].join(' | ');
  for (const [promise, covered, topic] of DESCRIPTION_PROMISES) {
    if (promise.test(fm.meta_description) && !covered.test(headingText)) {
      r.warn(file, `meta description promises "${topic}" but no heading covers it`);
    }
  }

  // Structure.
  if ((STATIC_PUBLIC_PATHS as readonly string[]).includes(page.url) || page.url.startsWith('/app/')) {
    r.error(file, `URL ${page.url} is reserved for a code route or the private tracker`);
  }
  if (fm.hub && !allPaths.has(fm.hub) && !(STATIC_PUBLIC_PATHS as readonly string[]).includes(fm.hub)) {
    r.warn(file, `hub ${fm.hub} has no page yet`);
  }
  for (const rel of fm.related) if (!allPaths.has(rel)) r.warn(file, `related page ${rel} does not exist`);

  // Review dates.
  if (isPub && fm.review_due && fm.review_due < today) {
    r.error(file, `review_due ${fm.review_due} has passed: the owner must update or unpublish this page`);
  }
  if (fm.reviewed_at && fm.reviewed_at > today) r.error(file, `reviewed_at ${fm.reviewed_at} is in the future`);
}

// Uniqueness across pages: errors among published pages, warnings among drafts.
function dupes(key: (p: (typeof store.pages)[number]) => string, label: string, allowOverride = false) {
  const groups = new Map<string, typeof store.pages>();
  for (const p of store.pages) {
    const k = key(p).trim().toLowerCase();
    if (!k) continue;
    groups.set(k, [...(groups.get(k) ?? []), p]);
  }
  for (const [k, ps] of groups) {
    if (ps.length < 2) continue;
    const pubs = ps.filter((p) => published.includes(p));
    const overridden = allowOverride && ps.every((p) => p.fm.keyword_override);
    const where = ps.map((p) => p.file).join(', ');
    if (overridden) r.note(`${label} "${k}" shared by override: ${where}`);
    else if (pubs.length >= 2) r.error(where, `duplicate ${label} "${k}" across published pages`);
    else r.warn(where, `duplicate ${label} "${k}" (fix before publishing)`);
  }
}
dupes((p) => p.fm.primary_keyword, 'primary keyword', true);
dupes((p) => p.fm.title, 'title / H1');
dupes((p) => p.fm.seo_title, 'SEO title');
dupes((p) => p.fm.meta_description, 'meta description');

// Tool logic files (content/_tools/): schema, code files, sources, triggers, approval.
const { tools, errors: toolErrors } = loadToolLogic();
for (const e of toolErrors) r.error('content/_tools', e);
const triggerIds = new Set(URGENT_TRIGGERS.map((t) => t.id));
for (const t of tools) {
  for (const id of t.logic.sources) if (!store.sources.has(id)) r.error(t.file, `source "${id}" is not in the registry`);
  for (const id of t.logic.urgent_triggers) if (!triggerIds.has(id)) r.error(t.file, `unknown urgent trigger "${id}"`);
  const problems = toolApprovalProblems(t);
  if (t.logic.status === 'clinician_approved') {
    for (const p of problems) r.error(t.file, `marked clinician_approved but: ${p}`);
    const rev = t.logic.reviewer ? store.people.get(t.logic.reviewer) : undefined;
    if (!rev?.verified || !rev.roles.includes('clinical_reviewer')) r.error(t.file, `reviewer "${t.logic.reviewer}" is not a verified clinical reviewer`);
  } else {
    r.note(`tool "${t.logic.id}" logic is ${t.logic.status}: hidden in production until a clinician approves it`);
  }
}

// The one grade registry (content/_grades/grades.json).
{
  const REG = 'content/_grades/grades.json';
  const seen = new Set<string>();
  const pagesByUrl = new Map(store.pages.map((p) => [p.url, p]));
  for (const g of GRADE_REGISTRY) {
    if (seen.has(g.id)) r.error(REG, `duplicate grade id "${g.id}"`);
    seen.add(g.id);
    // JSON isn't type-checked, so check the value really is on the scale (and isn't "per_option").
    if (!(EVIDENCE_GRADES as readonly string[]).includes(g.grade) || (g.grade as string) === 'per_option') {
      r.error(REG, `${g.id}: "${g.grade}" is not a grade on our scale`);
    }
    if (!g.treatment || !g.use) r.error(REG, `${g.id}: a grade needs a treatment and a use`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(g.last_checked)) r.error(REG, `${g.id}: last_checked must be YYYY-MM-DD`);
    for (const id of g.sources) if (!store.sources.has(id)) r.error(REG, `${g.id}: source "${id}" is not in the source registry`);
    for (const url of g.pages ?? []) {
      const p = pagesByUrl.get(url);
      if (!p) r.error(REG, `${g.id}: page ${url} does not exist`);
      else if (p.fm.evidence_grade !== g.grade) {
        r.error(p.file, `evidence_grade is "${p.fm.evidence_grade}" but the grade registry says "${g.grade}" (${g.id})`);
      }
    }
  }
}

// Grades are written as :grade{id="..."} so they come from the registry, never typed by hand.
const TYPED_GRADE = /\|\s*\*\*(Strong|Moderate|Limited|Not supported|Harm concern|Comfort only)[^*]*\*\*\s*\||\*\*(Strong|Moderate|Limited) evidence\*\*|\*\*(Not supported|Harm concern|Comfort only)\*\*/;
for (const page of store.pages) {
  if (['evidence', 'legal', 'about'].includes(page.fm.page_type)) continue; // the grading method defines the words
  page.body.split(/\r?\n/).forEach((line, i) => {
    if (TYPED_GRADE.test(line)) {
      r.error(page.file, `line ${i + 1}: a grade is typed by hand; use :grade{id="..."} from content/_grades/grades.json`);
    }
  });
}

// Summary.
const byStatus = new Map<string, number>();
const byCluster = new Map<string, number>();
for (const p of store.pages) {
  byStatus.set(p.fm.status, (byStatus.get(p.fm.status) ?? 0) + 1);
  byCluster.set(p.fm.cluster, (byCluster.get(p.fm.cluster) ?? 0) + 1);
}
r.note(`${store.pages.length} page(s), ${published.length} publishable, ${store.sources.size} source(s), ${store.people.size} people`);
r.note(`by status: ${[...byStatus].map(([k, v]) => `${k}=${v}`).join(' ') || 'none'}`);
r.note(`by cluster: ${[...byCluster].map(([k, v]) => `${k}=${v}`).join(' ') || 'none'}`);
r.finish();
