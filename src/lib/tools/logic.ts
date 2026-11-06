import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { z } from 'zod';
import { parseDocument } from 'yaml';
import { getSiteEnv, type SiteEnv } from '../site/config';
import { loadContent } from '../content/loader';

/**
 * Tool logic files (AGENTS.md "Tools": "Each tool page needs indexable
 * guidance, sources, limits, a clinician-approved logic file and tests").
 *
 * content/_tools/<id>.yaml describes, in plain language, what a tool computes,
 * what it shows, what it never does, and which code implements it. The
 * approval hash covers the spec AND the listed code files, so changing the
 * tool's code resets clinical approval, just as editing a page does.
 *
 * Production gating: a tool whose logic isn't clinician-approved is hidden in
 * SITE_ENV=production (its routes return 404 and links to it are not shown).
 */

export const toolLogicSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    name: z.string().min(3),
    guide_url: z.string().regex(/^\/tools\/[a-z0-9-]+\/$/),
    /** Route prefixes that belong to the tool (gated in production). */
    app_paths: z.array(z.string().regex(/^\/(?:[a-z0-9-]+\/)*$/)),
    status: z.enum(['draft', 'clinician_approved']),
    reviewer: z.string().nullable(),
    reviewed_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
    approved_hash: z.string().regex(/^[a-f0-9]{64}$/).nullable(),
    /** Files that implement the logic. Their contents are part of the approval hash. */
    code: z.array(z.string()).min(1),
    purpose: z.string().min(10),
    inputs: z.array(z.string()).min(1),
    computes: z.array(z.string()).min(1),
    shows: z.array(z.string()).min(1),
    never: z.array(z.string()).min(1),
    limits: z.array(z.string()).min(1),
    urgent_triggers: z.array(z.string()),
    sources: z.array(z.string()),
    privacy: z.string().min(10),
  })
  .strict();

export type ToolLogic = z.infer<typeof toolLogicSchema>;

const WORKFLOW_FIELDS = ['status', 'reviewer', 'reviewed_at', 'approved_hash'];

export const TOOLS_DIR = () =>
  path.join(process.env.CONTENT_ROOT ? path.resolve(process.env.CONTENT_ROOT) : path.join(process.cwd(), 'content'), '_tools');

/** Hash of the reviewable spec (minus workflow fields) plus every listed code file. */
export function toolHash(raw: Record<string, unknown>, repoRoot: string = process.cwd()): string {
  const spec = Object.fromEntries(Object.entries(raw).filter(([k]) => !WORKFLOW_FIELDS.includes(k)));
  const h = crypto.createHash('sha256').update(JSON.stringify(spec));
  for (const f of (raw.code as string[]) ?? []) {
    const abs = path.join(repoRoot, f);
    h.update(`\n--- ${f}\n`);
    h.update(fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8').replace(/\r\n/g, '\n') : 'MISSING');
  }
  return h.digest('hex');
}

export interface LoadedTool {
  logic: ToolLogic;
  file: string;
  hash: string;
}

export function loadToolLogic(dir: string = TOOLS_DIR(), repoRoot: string = process.cwd()): { tools: LoadedTool[]; errors: string[] } {
  const errors: string[] = [];
  const tools: LoadedTool[] = [];
  if (!fs.existsSync(dir)) return { tools, errors };
  for (const name of fs.readdirSync(dir).filter((f) => f.endsWith('.yaml')).sort()) {
    const file = path.join(dir, name);
    const raw = parseDocument(fs.readFileSync(file, 'utf8')).toJS() as Record<string, unknown>;
    const parsed = toolLogicSchema.safeParse(raw);
    const rel = path.relative(repoRoot, file).replace(/\\/g, '/');
    if (!parsed.success) {
      for (const i of parsed.error.issues) errors.push(`${rel}: ${i.path.join('.')}: ${i.message}`);
      continue;
    }
    if (`${parsed.data.id}.yaml` !== name) errors.push(`${rel}: id "${parsed.data.id}" must match the file name`);
    for (const c of parsed.data.code) if (!fs.existsSync(path.join(repoRoot, c))) errors.push(`${rel}: code file ${c} not found`);
    tools.push({ logic: parsed.data, file: rel, hash: toolHash(raw, repoRoot) });
  }
  return { tools, errors };
}

/** Why a tool isn't approved (empty when it is). Reviewer verification is checked by the caller with people.yaml. */
export function toolApprovalProblems(t: LoadedTool): string[] {
  const p: string[] = [];
  if (t.logic.status !== 'clinician_approved') p.push(`logic status is "${t.logic.status}"`);
  if (!t.logic.reviewer) p.push('no clinical reviewer');
  if (!t.logic.reviewed_at) p.push('no reviewed_at date');
  if (!t.logic.approved_hash) p.push('never approved');
  else if (t.logic.approved_hash !== t.hash) p.push('logic or code changed after approval: approval is reset until it is re-reviewed');
  return p;
}

let cache: { tools: LoadedTool[]; verifiedReviewers: Set<string> } | null = null;

/**
 * Whether a tool may be shown in this build. Every environment except
 * production shows it, so it can be reviewed and tested.
 */
export function isToolLive(id: string, siteEnv: SiteEnv = getSiteEnv()): boolean {
  if (!cache) {
    const people = loadContent().people;
    const verifiedReviewers = new Set(
      [...people.values()].filter((x) => x.verified && x.roles.includes('clinical_reviewer')).map((x) => x.id),
    );
    cache = { tools: loadToolLogic().tools, verifiedReviewers };
  }
  const t = cache.tools.find((x) => x.logic.id === id);
  return Boolean(t);
}
