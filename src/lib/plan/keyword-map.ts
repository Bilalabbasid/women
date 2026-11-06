import { z } from 'zod';
import { CLUSTERS, PAGE_TYPES, STAGE_TAGS } from '../content/schema';
import { parseTable } from './csv';

/** Column order exactly as AGENTS.md lists it. */
export const MAP_COLUMNS = [
  'url',
  'title_working',
  'cluster',
  'page_type',
  'primary_keyword',
  'secondary_keywords',
  'questions',
  'search_intent',
  'funnel_stage',
  'volume',
  'difficulty',
  'data_source',
  'data_date',
  'priority',
  'symptom_tags',
  'stage_tags',
  'cta_profile',
  'hub_url',
  'status',
] as const;

const list = z.string().transform((s) =>
  s
    .split('|')
    .map((x) => x.trim())
    .filter(Boolean),
);
const optNumber = z
  .string()
  .refine((s) => s === '' || /^\d+(\.\d+)?$/.test(s), 'must be a number or blank')
  .transform((s) => (s === '' ? null : Number(s)));

export const mapRowSchema = z
  .object({
    url: z.string().regex(/^\/(?:[a-z0-9-]+\/)*$/, 'lowercase, hyphenated, leading and trailing slash'),
    title_working: z.string().min(3),
    cluster: z.enum(CLUSTERS),
    page_type: z.enum(PAGE_TYPES),
    primary_keyword: z.string().min(2),
    secondary_keywords: list,
    questions: list,
    search_intent: z.enum(['informational', 'commercial', 'transactional', 'navigational']),
    funnel_stage: z.enum(['learn', 'worried', 'evaluating', 'comparing', 'sceptical']),
    volume: optNumber,
    difficulty: optNumber,
    data_source: z.string(),
    data_date: z.string().refine((s) => s === '' || /^\d{4}-\d{2}-\d{2}$/.test(s), 'YYYY-MM-DD or blank'),
    priority: z.enum(['1', '2', '3']).transform(Number),
    symptom_tags: list,
    stage_tags: list.pipe(z.array(z.enum(STAGE_TAGS))),
    cta_profile: z.string().regex(/^[a-z0-9_]+$/),
    hub_url: z.string().refine((s) => s === '' || /^\/(?:[a-z0-9-]+\/)*$/.test(s), 'site path or blank'),
    status: z.enum(['planned', 'drafted', 'merged', 'dropped']),
  })
  .strict();

export type MapRow = z.infer<typeof mapRowSchema>;

export function parseKeywordMap(text: string): { rows: MapRow[]; errors: string[] } {
  const raw = parseTable(text);
  const errors: string[] = [];
  const rows: MapRow[] = [];
  const header = text.split(/\r?\n/, 1)[0].split(',').map((h) => h.trim());
  if (header.join(',') !== MAP_COLUMNS.join(',')) {
    errors.push(`header must be exactly: ${MAP_COLUMNS.join(',')}`);
  }
  raw.forEach((r, i) => {
    const parsed = mapRowSchema.safeParse(r);
    if (parsed.success) rows.push(parsed.data);
    else for (const issue of parsed.error.issues) errors.push(`row ${i + 2} (${r.url ?? '?'}): ${issue.path.join('.')}: ${issue.message}`);
  });
  return { rows, errors };
}

// ---------------------------------------------------------------- cannibalisation

const STOP = new Set(
  'a an and are can do does for i in is it my of on or the to what when why how you your with at vs versus'.split(' '),
);

/** Lowercase, strip punctuation, collapse whitespace. Used for exact-duplicate checks and imports. */
export function normalizeKeyword(k: string): string {
  return k
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9+]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

/** Content-bearing tokens, with a light plural fold (flashes→flash, utis→uti). */
export function keywordTokens(k: string): Set<string> {
  return new Set(
    normalizeKeyword(k)
      .split(' ')
      .filter((t) => t && !STOP.has(t))
      .map((t) => (t.length > 4 && t.endsWith('es') ? t.slice(0, -2) : t.length > 3 && t.endsWith('s') ? t.slice(0, -1) : t)),
  );
}

export function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  return inter / (a.size + b.size - inter);
}

export interface CannibalIssue {
  level: 'error' | 'warning';
  urls: string[];
  message: string;
}

/** Overlaps between active rows (not merged or dropped). */
export function findCannibalisation(rows: MapRow[], nearThreshold = 0.75): CannibalIssue[] {
  const active = rows.filter((r) => r.status !== 'merged' && r.status !== 'dropped');
  const issues: CannibalIssue[] = [];

  const byUrl = new Map<string, MapRow[]>();
  for (const r of rows) byUrl.set(r.url, [...(byUrl.get(r.url) ?? []), r]);
  for (const [url, rs] of byUrl) if (rs.length > 1) issues.push({ level: 'error', urls: [url], message: `URL appears ${rs.length} times` });

  const primaries = new Map<string, MapRow>();
  for (const r of active) {
    const k = normalizeKeyword(r.primary_keyword);
    const prev = primaries.get(k);
    if (prev) issues.push({ level: 'error', urls: [prev.url, r.url], message: `same primary keyword "${r.primary_keyword}"` });
    else primaries.set(k, r);
  }

  for (const r of active) {
    for (const s of r.secondary_keywords) {
      const owner = primaries.get(normalizeKeyword(s));
      if (owner && owner.url !== r.url) {
        issues.push({ level: 'error', urls: [r.url, owner.url], message: `secondary keyword "${s}" is the primary keyword of ${owner.url}` });
      }
    }
  }

  const secondaryOwners = new Map<string, string[]>();
  for (const r of active) {
    for (const s of r.secondary_keywords) {
      const k = normalizeKeyword(s);
      secondaryOwners.set(k, [...(secondaryOwners.get(k) ?? []), r.url]);
    }
  }
  for (const [k, urls] of secondaryOwners) {
    if (urls.length > 1) issues.push({ level: 'warning', urls, message: `secondary keyword "${k}" is targeted by ${urls.length} pages` });
  }

  for (let i = 0; i < active.length; i++) {
    for (let j = i + 1; j < active.length; j++) {
      const a = active[i];
      const b = active[j];
      const score = jaccard(keywordTokens(a.primary_keyword), keywordTokens(b.primary_keyword));
      if (score >= nearThreshold && normalizeKeyword(a.primary_keyword) !== normalizeKeyword(b.primary_keyword)) {
        issues.push({
          level: 'warning',
          urls: [a.url, b.url],
          message: `near-duplicate primary keywords "${a.primary_keyword}" / "${b.primary_keyword}" (overlap ${score.toFixed(2)}): confirm the intents differ`,
        });
      }
    }
  }
  return issues;
}
