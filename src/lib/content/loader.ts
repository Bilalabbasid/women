import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { parse as parseYaml } from 'yaml';
import {
  frontmatterSchema,
  sourceSchema,
  personSchema,
  REQUIRED_FIELDS,
  isMedicalPageType,
  type Frontmatter,
  type Source,
  type Person,
} from './schema';

export interface ContentPage {
  fm: Frontmatter;
  body: string;
  /** Site path with trailing slash, derived from the file path. */
  url: string;
  /** Path relative to the repo root, for error messages. */
  file: string;
  isMedical: boolean;
  /** sha256 of the reviewable content (see contentHash). */
  hash: string;
}

export interface ContentError {
  file: string;
  message: string;
}

export interface ContentStore {
  pages: ContentPage[];
  sources: Map<string, Source>;
  people: Map<string, Person>;
  errors: ContentError[];
}

/** CONTENT_ROOT lets tests and previews point at fixtures. Production uses ./content. */
export const DEFAULT_CONTENT_ROOT = process.env.CONTENT_ROOT
  ? path.resolve(process.env.CONTENT_ROOT)
  : path.join(process.cwd(), 'content');

const FM_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

export function splitFrontmatter(raw: string): { data: unknown; body: string } | null {
  const m = FM_RE.exec(raw);
  if (!m) return null;
  return { data: parseYaml(m[1]), body: m[2] };
}

/**
 * Hash of everything a clinician reviews. Workflow metadata (status, reviewer,
 * dates, change log, approved_hash) is excluded, so stamping an approval does
 * not change the hash, but any edit to medical content does.
 */
export function contentHash(fm: Frontmatter, body: string): string {
  const reviewable = {
    title: fm.title,
    meta_description: fm.meta_description,
    body: body.replace(/\r\n/g, '\n').trim(),
    claims: fm.claims,
    evidence_grade: fm.evidence_grade,
    sources: fm.sources,
    faq: fm.faq ?? [],
    safety_flags: fm.safety_flags,
    audience_limits: fm.audience_limits,
  };
  return crypto.createHash('sha256').update(JSON.stringify(reviewable)).digest('hex');
}

/** content/pages/symptoms/hot-flashes.md → /symptoms/hot-flashes/ ; …/symptoms/index.md → /symptoms/ */
export function urlFromFile(relFromPages: string): string {
  const parts = relFromPages.replace(/\\/g, '/').replace(/\.md$/, '').split('/');
  if (parts[parts.length - 1] === 'index') parts.pop();
  return parts.length === 0 ? '/' : `/${parts.join('/')}/`;
}

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return e.name.startsWith('_') ? [] : walk(p);
    return e.name.endsWith('.md') ? [p] : [];
  });
}

function readYamlList<T>(
  file: string,
  schema: { safeParse: (v: unknown) => { success: true; data: T } | { success: false; error: { issues: Array<{ path: PropertyKey[]; message: string }> } } },
  rootForErrors: string,
  errors: ContentError[],
): T[] {
  if (!fs.existsSync(file)) return [];
  const rel = path.relative(rootForErrors, file);
  const data = parseYaml(fs.readFileSync(file, 'utf8')) ?? [];
  if (!Array.isArray(data)) {
    errors.push({ file: rel, message: 'must be a YAML list' });
    return [];
  }
  const out: T[] = [];
  data.forEach((item, i) => {
    const r = schema.safeParse(item);
    if (r.success) out.push(r.data);
    else
      for (const issue of r.error.issues)
        errors.push({ file: rel, message: `item ${i} (${(item as { id?: string })?.id ?? '?'}): ${issue.path.join('.') || '(root)'}: ${issue.message}` });
  });
  return out;
}

export function loadContent(root: string = DEFAULT_CONTENT_ROOT): ContentStore {
  const errors: ContentError[] = [];
  const repoRoot = path.dirname(root);
  const pagesDir = path.join(root, 'pages');
  const pages: ContentPage[] = [];

  for (const abs of walk(pagesDir)) {
    const file = path.relative(repoRoot, abs).replace(/\\/g, '/');
    const split = splitFrontmatter(fs.readFileSync(abs, 'utf8'));
    if (!split || typeof split.data !== 'object' || split.data === null) {
      errors.push({ file, message: 'missing YAML frontmatter block' });
      continue;
    }
    const data = split.data as Record<string, unknown>;
    const missing = REQUIRED_FIELDS.filter((k) => !(k in data));
    if (missing.length) {
      errors.push({ file, message: `missing required frontmatter: ${missing.join(', ')}` });
      continue;
    }
    const parsed = frontmatterSchema.safeParse(data);
    if (!parsed.success) {
      for (const issue of parsed.error.issues)
        errors.push({ file, message: `${issue.path.join('.') || '(root)'}: ${issue.message}` });
      continue;
    }
    const fm = parsed.data;
    const url = urlFromFile(path.relative(pagesDir, abs));
    const lastSegment = url.split('/').filter(Boolean).pop() ?? '';
    if (fm.slug !== lastSegment) {
      errors.push({ file, message: `slug "${fm.slug}" must match the URL segment "${lastSegment}"` });
    }
    pages.push({ fm, body: split.body, url, file, isMedical: isMedicalPageType(fm.page_type), hash: contentHash(fm, split.body) });
  }

  const sourcesList = readYamlList<Source>(path.join(root, '_sources', 'sources.yaml'), sourceSchema, repoRoot, errors);
  const peopleList = readYamlList<Person>(path.join(root, '_people', 'people.yaml'), personSchema, repoRoot, errors);

  const sources = new Map<string, Source>();
  for (const s of sourcesList) {
    if (sources.has(s.id)) errors.push({ file: 'content/_sources/sources.yaml', message: `duplicate source id "${s.id}"` });
    sources.set(s.id, s);
  }
  const people = new Map<string, Person>();
  for (const p of peopleList) {
    if (people.has(p.id)) errors.push({ file: 'content/_people/people.yaml', message: `duplicate person id "${p.id}"` });
    people.set(p.id, p);
  }

  const seen = new Map<string, string>();
  for (const p of pages) {
    const prev = seen.get(p.url);
    if (prev) errors.push({ file: p.file, message: `URL ${p.url} is also produced by ${prev}` });
    seen.set(p.url, p.file);
  }

  return { pages, sources, people, errors };
}

let cached: ContentStore | null = null;

/** Memoised store for the Next.js build. Throws on any content error, which fails the build. */
export function getContent(): ContentStore {
  if (cached) return cached;
  const store = loadContent();
  if (store.errors.length) {
    const lines = store.errors.map((e) => `  ${e.file}: ${e.message}`).join('\n');
    throw new Error(`Content validation failed (${store.errors.length}):\n${lines}`);
  }
  cached = store;
  return store;
}
