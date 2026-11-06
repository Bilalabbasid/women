/**
 * npm run validate:links   (scripts/link-audit.ts)
 *
 * Builds the internal link graph as production renders it (published pages
 * only; pass --all for the staging view with drafts) and reports:
 *  - orphan pages (no inbound link from another page)        → error when published
 *  - click depth from the homepage greater than 3            → error when published
 *  - broken internal links (target missing entirely)         → error
 *  - links suppressed because the target is a draft          → warning
 *  - links to redirected paths (redirect chains)             → error
 *  - weak hubs (fewer than 3 child pages)                    → warning
 *  - over-used anchors (same text for many links, or one text for different pages) → warning
 *  - pages without a tool link or a "Does it work" link where one exists → warning
 * Sponsored /go/ links are excluded from the graph (they never pass authority).
 *
 * It also writes content/_review/link-suggestions.md: older pages that share
 * tags with newer pages but don't link to them. Suggestions only. Nothing is
 * inserted into medical copy automatically.
 */
import fs from 'node:fs';
import path from 'node:path';
import { loadContent, DEFAULT_CONTENT_ROOT, type ContentPage } from '../src/lib/content/loader';
import { isPublishable } from '../src/lib/content/gate';
import { renderMarkdown } from '../src/lib/content/markdown';
import { NAV_HUBS, isStaticTarget, relatedFrom } from '../src/lib/content/site-data';
import { LEGACY_APP_REDIRECTS } from '../src/lib/routes';
import { parseKeywordMap } from '../src/lib/plan/keyword-map';
import { Report } from './lib/report';

const includeDrafts = process.argv.includes('--all');
const r = new Report(`validate:links (${includeDrafts ? 'staging view, drafts included' : 'production view'})`);
const store = loadContent(DEFAULT_CONTENT_ROOT);
if (store.errors.length) {
  r.error('content', `${store.errors.length} content error(s): run validate:content first`);
  r.finish();
  process.exit();
}

const pages = includeDrafts ? store.pages : store.pages.filter((p) => isPublishable(p, store));
const byUrl = new Map(pages.map((p) => [p.url, p]));
const allContentUrls = new Set(store.pages.map((p) => p.url));
const known = new Set(pages.map((p) => p.url));
// Pages planned in the keyword map but not written yet: links to them are dropped at render time.
const mapFile = path.join(DEFAULT_CONTENT_ROOT, '_plan', 'keyword-map.csv');
const plannedUrls = new Set(fs.existsSync(mapFile) ? parseKeywordMap(fs.readFileSync(mapFile, 'utf8')).rows.map((x) => x.url) : []);
const redirectSources = new Set(LEGACY_APP_REDIRECTS.flatMap((x) => [x.source, `${x.source}/`]));

type Edge = { from: string; to: string; anchor: string; kind: 'nav' | 'body' | 'hub' | 'related' | 'children' };
const edges: Edge[] = [];
const add = (from: string, to: string, anchor: string, kind: Edge['kind']) => edges.push({ from, to, anchor, kind });

// Site chrome: every page links to the nav hubs that exist, Tools and Urgent help.
const navTargets = [...NAV_HUBS.filter((h) => byUrl.has(h)), '/tools/', '/urgent-help/'];
for (const t of navTargets) add('/', t, `nav:${t}`, 'nav');
// Home lists the six most recently updated pages.
[...pages]
  .filter((p) => p.fm.page_type !== 'legal')
  .sort((a, b) => b.fm.updated_at.localeCompare(a.fm.updated_at))
  .slice(0, 6)
  .forEach((p) => add('/', p.url, p.fm.title, 'nav'));
// Footer: site and evidence pages.
for (const p of pages) {
  if ((p.fm.cluster === 'site' || p.fm.cluster === 'evidence') && p.url.split('/').filter(Boolean).length <= 2) {
    add('/', p.url, `footer:${p.fm.title}`, 'nav');
  }
}
// Tools hub lists tool guides.
for (const p of pages) if (p.fm.page_type === 'tool') add('/tools/', p.url, p.fm.title, 'children');

const anchorUse = new Map<string, Set<string>>();
const anchorCount = new Map<string, number>();

for (const page of pages) {
  const rendered = renderMarkdown(page.body, { knownPaths: known, isAlwaysValid: isStaticTarget });
  for (const l of rendered.links) {
    if (!l.internal) continue; // /go/ and external links are not part of the graph
    const target = l.href.split('#')[0].split('?')[0];
    if (redirectSources.has(target)) r.error(page.file, `links to ${target}, which redirects: link to the final URL`);
    if (l.dropped) {
      if (allContentUrls.has(target)) r.warn(page.file, `link to ${target} suppressed: that page isn't published yet`);
      else if (plannedUrls.has(target)) r.note(`${page.file}: link to ${target} suppressed until that planned page is written`);
      else if (!isStaticTarget(target)) r.error(page.file, `broken link to ${target} (not a page, a planned page or a code route)`);
      continue;
    }
    add(page.url, target, l.text, 'body');
    const key = l.text.trim().toLowerCase();
    anchorUse.set(key, (anchorUse.get(key) ?? new Set()).add(target));
    anchorCount.set(`${key}→${target}`, (anchorCount.get(`${key}→${target}`) ?? 0) + 1);
  }
  if (page.fm.hub && byUrl.has(page.fm.hub)) add(page.url, page.fm.hub, 'breadcrumb', 'hub');
  if (page.fm.page_type === 'hub') {
    for (const c of pages.filter((p) => p.fm.hub === page.url && p.url !== page.url)) add(page.url, c.url, c.fm.title, 'children');
  }
  for (const rel of relatedFrom(page, pages, byUrl)) add(page.url, rel.url, rel.fm.title, 'related');

  // Every published page should link to a tool and, where one exists, a Does-it-work page.
  const bodyTargets = rendered.links.filter((l) => l.internal && !l.dropped).map((l) => l.href);
  if (!['legal', 'about', 'tool'].includes(page.fm.page_type)) {
    if (!bodyTargets.some((h) => h.startsWith('/tools/') || h.startsWith('/app/'))) r.warn(page.file, 'no link to a tool');
    const diw = pages.filter((p) => p.fm.page_type === 'does_it_work' && p.fm.symptom_tags.some((t) => page.fm.symptom_tags.includes(t)));
    if (diw.length && !bodyTargets.some((h) => h.startsWith('/does-it-work/')) && page.fm.page_type !== 'does_it_work') {
      r.warn(page.file, `no link to a relevant "Does it work" page (for example ${diw[0].url})`);
    }
  }
  const contextual = rendered.links.filter((l) => l.internal && !l.dropped).length;
  if (page.fm.page_type !== 'legal' && contextual < 3) r.warn(page.file, `only ${contextual} contextual link(s) in the body (aim for 3 to 8)`);
}

// Orphans: no inbound edge from a different page (nav counts as the homepage linking).
for (const p of pages) {
  const inbound = edges.filter((e) => e.to === p.url && e.from !== p.url);
  if (inbound.length === 0) r.error(p.file, 'orphan page: nothing links to it');
}

// Click depth from home (BFS over all edge kinds).
const depth = new Map<string, number>([['/', 0]]);
const queue = ['/'];
while (queue.length) {
  const cur = queue.shift()!;
  for (const e of edges.filter((x) => x.from === cur)) {
    if (!depth.has(e.to)) {
      depth.set(e.to, depth.get(cur)! + 1);
      queue.push(e.to);
    }
  }
}
for (const p of pages) {
  const d = depth.get(p.url);
  if (d === undefined) r.error(p.file, 'not reachable from the homepage');
  else if (d > 3) r.error(p.file, `click depth ${d} (must be 3 or less)`);
}

// Weak hubs.
for (const hub of pages.filter((p) => p.fm.page_type === 'hub')) {
  const n = pages.filter((p) => p.fm.hub === hub.url && p.url !== hub.url).length;
  if (n < 3) r.warn(hub.file, `weak hub: only ${n} child page(s)`);
}

// Anchors.
for (const [anchor, targets] of anchorUse) {
  if (targets.size > 1 && anchor.length > 3) r.warn('anchors', `"${anchor}" points to ${targets.size} different pages`);
}
for (const [key, n] of anchorCount) if (n > 5) r.warn('anchors', `exact anchor "${key}" used ${n} times: vary the wording`);

// Suggestions for new pages (written to a report, never inserted).
const firstDate = (p: ContentPage) => [...p.fm.change_log].map((c) => c.date).sort()[0] ?? p.fm.updated_at;
const newest = [...store.pages].sort((a, b) => firstDate(b).localeCompare(firstDate(a))).slice(0, 10);
const lines = ['# Link suggestions', '', `Generated ${new Date().toISOString().slice(0, 10)} by scripts/link-audit.ts. Suggestions only: a person decides whether a link helps the reader.`, ''];
for (const n of newest) {
  const candidates = store.pages.filter(
    (o) =>
      o.url !== n.url &&
      firstDate(o) <= firstDate(n) &&
      o.fm.symptom_tags.some((t) => n.fm.symptom_tags.includes(t)) &&
      !o.body.includes(`](${n.url}`),
  );
  if (candidates.length) {
    lines.push(`## ${n.fm.title} (${n.url})`, '', ...candidates.map((c) => `- Consider linking from ${c.file}`), '');
  }
}
const outFile = path.join(DEFAULT_CONTENT_ROOT, '_review', 'link-suggestions.md');
fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, `${lines.join('\n')}\n`);

r.note(`${pages.length} page(s) in graph, ${edges.length} internal edge(s); suggestions → ${path.relative(process.cwd(), outFile)}`);
r.finish();
