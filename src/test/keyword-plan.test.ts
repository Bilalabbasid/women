/** @vitest-environment node */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { parseDelimited, decodeText, toCsv } from '@/lib/plan/csv';
import { parseKeywordMap, findCannibalisation, normalizeKeyword, MAP_COLUMNS, type MapRow } from '@/lib/plan/keyword-map';
import { readExport, mergeKeywordData, parseMetric } from '@/lib/plan/import';

const row = (over: Partial<Record<string, string>>): Record<string, string> => ({
  url: '/symptoms/x/',
  title_working: 'Example page',
  cluster: 'symptoms',
  page_type: 'symptom',
  primary_keyword: 'example keyword',
  secondary_keywords: '',
  questions: '',
  search_intent: 'informational',
  funnel_stage: 'worried',
  volume: '',
  difficulty: '',
  data_source: '',
  data_date: '',
  priority: '2',
  symptom_tags: '',
  stage_tags: 'perimenopause',
  cta_profile: 'vasomotor',
  hub_url: '/symptoms/',
  status: 'planned',
  ...over,
});
const mapOf = (rows: Array<Record<string, string>>) => parseKeywordMap(toCsv(MAP_COLUMNS, rows));

describe('CSV', () => {
  it('handles quotes, escaped quotes and embedded commas and newlines', () => {
    expect(parseDelimited('a,b\n"x, y","he said ""hi""\nthere"\n')).toEqual([
      ['a', 'b'],
      ['x, y', 'he said "hi"\nthere'],
    ]);
  });

  it('decodes UTF-16LE tab-separated Keyword Planner exports', () => {
    const text = 'Keyword Stats 2026\nAll locations\nKeyword\tAvg. monthly searches\nhot flashes\t1000\n';
    const buf = Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(text, 'utf16le')]);
    const { data } = readExport(buf, 'google-planner-2026-11-20.csv', '2026-11-21');
    expect(data).toEqual([
      { keyword: 'hot flashes', volume: 1000, difficulty: null, source: 'Google Keyword Planner (google-planner-2026-11-20.csv)', date: '2026-11-20' },
    ]);
    expect(decodeText(Buffer.from('﻿a,b', 'utf8'))).toBe('a,b');
  });
});

describe('keyword map', () => {
  it('parses list cells and validates columns', () => {
    const { rows, errors } = mapOf([row({ secondary_keywords: 'a | b', symptom_tags: 'hot-flashes' })]);
    expect(errors).toEqual([]);
    expect(rows[0].secondary_keywords).toEqual(['a', 'b']);
  });

  it('rejects unknown stage tags and bad URLs', () => {
    const { errors } = mapOf([row({ url: '/Symptoms/X', stage_tags: 'teen' })]);
    expect(errors.length).toBeGreaterThanOrEqual(2);
  });

  it('the committed map is valid and free of cannibalisation errors', () => {
    const text = fs.readFileSync(path.join(process.cwd(), 'content', '_plan', 'keyword-map.csv'), 'utf8');
    const { rows, errors } = parseKeywordMap(text);
    expect(errors).toEqual([]);
    expect(rows.length).toBeGreaterThan(140);
    expect(findCannibalisation(rows).filter((i) => i.level === 'error')).toEqual([]);
    expect(rows.every((r) => r.volume === null || (r.data_source && r.data_date))).toBe(true);
  });
});

describe('cannibalisation', () => {
  const parse = (rows: Array<Record<string, string>>) => mapOf(rows).rows as MapRow[];

  it('errors on duplicate primary keywords after normalising', () => {
    const issues = findCannibalisation(
      parse([row({ url: '/a/', primary_keyword: 'Menopause Anxiety' }), row({ url: '/b/', primary_keyword: 'menopause  anxiety' })]),
    );
    expect(issues.some((i) => i.level === 'error' && /same primary keyword/.test(i.message))).toBe(true);
  });

  it("errors when a secondary keyword is another page's primary", () => {
    const issues = findCannibalisation(
      parse([row({ url: '/a/', primary_keyword: 'menopause anxiety' }), row({ url: '/b/', primary_keyword: 'panic', secondary_keywords: 'menopause anxiety' })]),
    );
    expect(issues.some((i) => i.level === 'error' && /is the primary keyword of \/a\//.test(i.message))).toBe(true);
  });

  it('warns on near-duplicates, folding plurals and stop words', () => {
    const issues = findCannibalisation(
      parse([row({ url: '/a/', primary_keyword: 'hot flashes at night' }), row({ url: '/b/', primary_keyword: 'night hot flash' })]),
    );
    expect(issues.some((i) => i.level === 'warning' && /near-duplicate/.test(i.message))).toBe(true);
  });

  it('ignores merged and dropped rows', () => {
    const issues = findCannibalisation(
      parse([row({ url: '/a/', primary_keyword: 'x y' }), row({ url: '/b/', primary_keyword: 'x y', status: 'merged' })]),
    );
    expect(issues.filter((i) => i.level === 'error')).toEqual([]);
  });
});

describe('keyword import', () => {
  it('never estimates: ranges and junk stay blank', () => {
    expect(parseMetric('1,900')).toBe(1900);
    expect(parseMetric('1.9K')).toBe(1900);
    expect(parseMetric('1K – 10K')).toBeNull();
    expect(parseMetric('n/a')).toBeNull();
  });

  it('fills only exact matches and keeps newer data', () => {
    const rows = [row({ url: '/a/', primary_keyword: 'menopause anxiety' })];
    const first = mergeKeywordData(rows, [
      { keyword: 'Menopause Anxiety', volume: 500, difficulty: 30, source: 'Semrush (new.csv)', date: '2026-11-20' },
      { keyword: 'menopause anxiety symptoms', volume: 90, difficulty: null, source: 'Semrush (new.csv)', date: '2026-11-20' },
    ]);
    expect(first.updated).toEqual(['/a/']);
    expect(first.unmatched.map((u) => u.keyword)).toEqual(['menopause anxiety symptoms']);
    mergeKeywordData(rows, [{ keyword: 'menopause anxiety', volume: 1, difficulty: 1, source: 'old', date: '2025-01-01' }]);
    expect(rows[0].volume).toBe('500');
    expect(rows[0].data_date).toBe('2026-11-20');
    expect(normalizeKeyword("Doctors' advice")).toBe('doctors advice');
  });
});
