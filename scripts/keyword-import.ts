/**
 * npm run plan:import
 *
 * Merges keyword-tool exports in content/_plan/imports/ into keyword-map.csv.
 * Only exact primary-keyword matches are filled. Unmatched keywords go to
 * imports/unmatched-keywords.csv for a person to review (they may suggest a
 * new secondary keyword or FAQ, but never a page automatically).
 */
import fs from 'node:fs';
import path from 'node:path';
import { DEFAULT_CONTENT_ROOT } from '../src/lib/content/loader';
import { parseTable, toCsv } from '../src/lib/plan/csv';
import { MAP_COLUMNS, parseKeywordMap } from '../src/lib/plan/keyword-map';
import { readExport, mergeKeywordData, type KeywordDatum } from '../src/lib/plan/import';

const planDir = path.join(DEFAULT_CONTENT_ROOT, '_plan');
const mapFile = path.join(planDir, 'keyword-map.csv');
const importDir = path.join(planDir, 'imports');

const files = fs.existsSync(importDir)
  ? fs.readdirSync(importDir).filter((f) => /\.(csv|tsv|txt)$/i.test(f) && f !== 'unmatched-keywords.csv')
  : [];
if (files.length === 0) {
  console.log(`plan:import: no exports in ${path.relative(process.cwd(), importDir)}. Nothing to do.`);
  process.exit(0);
}

const mapText = fs.readFileSync(mapFile, 'utf8');
const rows = parseTable(mapText);
const all: KeywordDatum[] = [];
for (const f of files.sort()) {
  const abs = path.join(importDir, f);
  const mtime = fs.statSync(abs).mtime.toISOString().slice(0, 10);
  const { data, skipped } = readExport(fs.readFileSync(abs), f, mtime);
  console.log(`  ${f}: ${data.length} keyword(s)`);
  for (const s of skipped) console.log(`    note: ${s}`);
  all.push(...data);
}
all.sort((a, b) => a.date.localeCompare(b.date)); // oldest first, so newer data is applied last

const { rows: merged, updated, unmatched } = mergeKeywordData(rows, all);
const out = toCsv(MAP_COLUMNS, merged);
const check = parseKeywordMap(out);
if (check.errors.length) {
  console.error('plan:import: merged map would be invalid, so nothing was written:\n' + check.errors.join('\n'));
  process.exit(1);
}
fs.writeFileSync(mapFile, out);
fs.writeFileSync(
  path.join(importDir, 'unmatched-keywords.csv'),
  toCsv(
    ['keyword', 'volume', 'difficulty', 'source', 'date'],
    unmatched.map((u) => ({ keyword: u.keyword, volume: String(u.volume ?? ''), difficulty: String(u.difficulty ?? ''), source: u.source, date: u.date })),
  ),
);
console.log(`plan:import: updated ${new Set(updated).size} row(s); ${unmatched.length} unmatched keyword(s) listed in imports/unmatched-keywords.csv`);
