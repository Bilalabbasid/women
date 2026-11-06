import { parseTable, decodeText } from './csv';
import { normalizeKeyword } from './keyword-map';

/** One keyword measurement from a third-party export. */
export interface KeywordDatum {
  keyword: string;
  volume: number | null;
  difficulty: number | null;
  source: string;
  date: string;
}

const KEYWORD_COLS = ['keyword', 'keywords', 'search term', 'query'];
const VOLUME_COLS = ['volume', 'search volume', 'avg. monthly searches', 'avg monthly searches', 'monthly volume'];
const DIFFICULTY_COLS = ['keyword difficulty', 'kd', 'kd %', 'difficulty', 'keyword difficulty index'];

const pick = (row: Record<string, string>, names: string[]) => {
  for (const [k, v] of Object.entries(row)) if (names.includes(k.trim().toLowerCase())) return v;
  return undefined;
};

/** "1,900", "1.9K", "10K – 100K" (ranges are rejected, not averaged). */
export function parseMetric(v: string | undefined): number | null {
  if (!v) return null;
  const s = v.replace(/[,\s]/g, '').toLowerCase();
  if (/[–-]/.test(s.replace(/^-/, ''))) return null; // a range: Keyword Planner without an active campaign. Never guess a midpoint.
  const m = /^(\d+(?:\.\d+)?)(k|m)?%?$/.exec(s);
  if (!m) return null;
  const n = Number(m[1]) * (m[2] === 'k' ? 1_000 : m[2] === 'm' ? 1_000_000 : 1);
  return Math.round(n);
}

/** Source name and date from the file name, for example "semrush-us-2026-11-20.csv". */
export function describeExport(fileName: string, fallbackDate: string): { source: string; date: string } {
  const date = /(\d{4}-\d{2}-\d{2})/.exec(fileName)?.[1] ?? fallbackDate;
  const lower = fileName.toLowerCase();
  const tool = lower.includes('semrush')
    ? 'Semrush'
    : lower.includes('ahrefs')
      ? 'Ahrefs'
      : lower.includes('planner') || lower.includes('gkp') || lower.includes('google')
        ? 'Google Keyword Planner'
        : 'export';
  return { source: `${tool} (${fileName})`, date };
}

export function readExport(buf: Buffer, fileName: string, fallbackDate: string): { data: KeywordDatum[]; skipped: string[] } {
  const text = decodeText(buf);
  const rows = parseTable(text, (cells) => cells.some((c) => KEYWORD_COLS.includes(c.trim().toLowerCase())));
  const { source, date } = describeExport(fileName, fallbackDate);
  const data: KeywordDatum[] = [];
  const skipped: string[] = [];
  for (const row of rows) {
    const keyword = pick(row, KEYWORD_COLS);
    if (!keyword) continue;
    const rawVol = pick(row, VOLUME_COLS);
    const volume = parseMetric(rawVol);
    const difficulty = parseMetric(pick(row, DIFFICULTY_COLS));
    if (rawVol && volume === null) skipped.push(`${keyword}: volume "${rawVol}" is a range or unreadable, so it was left blank`);
    data.push({ keyword, volume, difficulty, source, date });
  }
  return { data, skipped };
}

export interface MergeResult {
  rows: Array<Record<string, string>>;
  updated: string[];
  unmatched: KeywordDatum[];
}

/**
 * Fills volume/difficulty on rows whose primary keyword matches exactly
 * (after normalising case and punctuation). Newer data wins; older data never
 * overwrites newer. Nothing is estimated or interpolated.
 */
export function mergeKeywordData(rows: Array<Record<string, string>>, data: KeywordDatum[]): MergeResult {
  const byKw = new Map(rows.map((r) => [normalizeKeyword(r.primary_keyword), r]));
  const updated: string[] = [];
  const unmatched: KeywordDatum[] = [];
  for (const d of data) {
    const row = byKw.get(normalizeKeyword(d.keyword));
    if (!row) {
      unmatched.push(d);
      continue;
    }
    if (d.volume === null && d.difficulty === null) continue;
    if (row.data_date && row.data_date > d.date) continue;
    row.volume = d.volume === null ? '' : String(d.volume);
    row.difficulty = d.difficulty === null ? '' : String(d.difficulty);
    row.data_source = d.source;
    row.data_date = d.date;
    updated.push(row.url);
  }
  return { rows, updated, unmatched };
}
