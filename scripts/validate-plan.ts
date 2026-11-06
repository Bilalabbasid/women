/**
 * npm run validate:plan
 *
 * Checks content/_plan/keyword-map.csv:
 *  - header and every row match the schema (columns exactly as AGENTS.md lists them)
 *  - no duplicate URLs or primary keywords; no secondary keyword that is another page's primary (errors)
 *  - near-duplicate primary keywords and shared secondary keywords (warnings: confirm intents differ)
 *  - every cta_profile exists in content/_cta/profiles.yaml
 *  - every hub_url is a row in the map or a code route
 *  - volume/difficulty only with data_source AND data_date (never estimated)
 *  - every content page has a matching row (same primary keyword, cluster, page type and CTA profile)
 */
import fs from 'node:fs';
import path from 'node:path';
import { parseKeywordMap, findCannibalisation, normalizeKeyword } from '../src/lib/plan/keyword-map';
import { loadCtaProfiles } from '../src/lib/cta/profiles';
import { loadContent, DEFAULT_CONTENT_ROOT } from '../src/lib/content/loader';
import { STATIC_PUBLIC_PATHS } from '../src/lib/content/site-data';
import { Report } from './lib/report';

const r = new Report('validate:plan');
const mapFile = path.join(DEFAULT_CONTENT_ROOT, '_plan', 'keyword-map.csv');
if (!fs.existsSync(mapFile)) {
  r.error('content/_plan', 'keyword-map.csv not found');
  r.finish();
  process.exit();
}

const { rows, errors } = parseKeywordMap(fs.readFileSync(mapFile, 'utf8'));
for (const e of errors) r.error('keyword-map.csv', e);

for (const issue of findCannibalisation(rows)) {
  (issue.level === 'error' ? r.error.bind(r) : r.warn.bind(r))(issue.urls.join(' + '), issue.message);
}

const { profiles, errors: profileErrors } = loadCtaProfiles();
for (const e of profileErrors) r.error('content/_cta', e);
const urls = new Set(rows.map((x) => x.url));
const codeRoutes = new Set<string>(STATIC_PUBLIC_PATHS);

for (const row of rows) {
  if (Object.keys(profiles).length && !profiles[row.cta_profile]) r.error(row.url, `unknown cta_profile "${row.cta_profile}"`);
  if (row.hub_url && !urls.has(row.hub_url) && !codeRoutes.has(row.hub_url)) r.error(row.url, `hub_url ${row.hub_url} is not in the map`);
  if ((row.volume !== null || row.difficulty !== null) && (!row.data_source || !row.data_date)) {
    r.error(row.url, 'volume/difficulty set without data_source and data_date (values must come from a checked export)');
  }
  if (codeRoutes.has(row.url)) r.error(row.url, 'URL is a code route; content cannot use it');
  if (row.page_type !== 'hub' && row.hub_url === '' && !['site', 'evidence', 'compare'].includes(row.cluster)) {
    r.warn(row.url, 'no hub_url');
  }
}

// Content pages must match their plan row.
const store = loadContent(DEFAULT_CONTENT_ROOT);
const byUrl = new Map(rows.map((x) => [x.url, x]));
for (const page of store.pages) {
  const row = byUrl.get(page.url);
  if (!row) {
    r.error(page.file, `no row in keyword-map.csv for ${page.url}`);
    continue;
  }
  if (normalizeKeyword(row.primary_keyword) !== normalizeKeyword(page.fm.primary_keyword)) {
    r.error(page.file, `primary_keyword "${page.fm.primary_keyword}" differs from the map ("${row.primary_keyword}")`);
  }
  if (row.cluster !== page.fm.cluster) r.error(page.file, `cluster "${page.fm.cluster}" differs from the map ("${row.cluster}")`);
  if (row.page_type !== page.fm.page_type) r.error(page.file, `page_type "${page.fm.page_type}" differs from the map ("${row.page_type}")`);
  if (row.cta_profile !== page.fm.cta_profile) r.error(page.file, `cta_profile "${page.fm.cta_profile}" differs from the map ("${row.cta_profile}")`);
  if (row.status === 'planned') r.warn(page.file, 'content exists but the map row is still "planned": set it to "drafted"');
}
for (const row of rows.filter((x) => x.status === 'drafted')) {
  if (!store.pages.some((p) => p.url === row.url)) r.error(row.url, 'map says "drafted" but no content file exists');
}

const counts = new Map<string, number>();
for (const row of rows) counts.set(row.cluster, (counts.get(row.cluster) ?? 0) + 1);
const withData = rows.filter((x) => x.volume !== null).length;
r.note(`${rows.length} rows: ${[...counts].map(([k, v]) => `${k}=${v}`).join(' ')}`);
r.note(`priority 1: ${rows.filter((x) => x.priority === 1).length}, 2: ${rows.filter((x) => x.priority === 2).length}, 3: ${rows.filter((x) => x.priority === 3).length}`);
r.note(`keyword data: ${withData}/${rows.length} rows have volume (from imports only)`);
r.finish();
