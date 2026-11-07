import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { parse as parseYaml } from 'yaml';

/**
 * CTA profiles. A page's `cta_profile` decides which free next steps it offers
 * (a tool, a question list, an article, an optional email sequence or urgent
 * guidance). MenoVerdict carries no ads, affiliate links or sponsored content,
 * so every next step is free.
 *
 * Selection order is fixed: safety → understand → act for free → get care.
 */

const freeCta = z
  .object({
    kind: z.enum(['tool', 'question_list', 'article', 'email_sequence', 'urgent_guidance']),
    /** Site path, or an email topic for email_sequence. */
    target: z.string().min(1),
    purpose: z.string().min(5),
  })
  .strict();

export const profileSchema = z
  .object({
    label: z.string().min(3),
    /** The brief's matrix row this profile implements. */
    matrix_row: z.string().min(3),
    free: z.array(freeCta).min(1),
    sticky_mobile_cta: z.boolean(),
    copy_examples: z.array(z.string()).optional(),
    notes: z.string().optional(),
  })
  .strict();

export type CtaProfile = z.infer<typeof profileSchema>;

export const profilesFileSchema = z.object({ profiles: z.record(z.string().regex(/^[a-z0-9_]+$/), profileSchema) }).strict();

export const DEFAULT_CTA_DIR = path.join(process.env.CONTENT_ROOT ? path.resolve(process.env.CONTENT_ROOT) : path.join(process.cwd(), 'content'), '_cta');

export function loadCtaProfiles(dir: string = DEFAULT_CTA_DIR): { profiles: Record<string, CtaProfile>; errors: string[] } {
  const file = path.join(dir, 'profiles.yaml');
  if (!fs.existsSync(file)) return { profiles: {}, errors: [`${file} not found`] };
  const parsed = profilesFileSchema.safeParse(parseYaml(fs.readFileSync(file, 'utf8')));
  if (!parsed.success) {
    return { profiles: {}, errors: parsed.error.issues.map((i) => `profiles.yaml: ${i.path.join('.')}: ${i.message}`) };
  }
  return { profiles: parsed.data.profiles, errors: [] };
}

/** Profiles every page type relies on. Each must exist. */
export const REQUIRED_PROFILES = [
  'vasomotor',
  'sleep',
  'fatigue',
  'mood',
  'cognitive',
  'cardio_urgent',
  'weight',
  'musculoskeletal',
  'genitourinary_vaginal',
  'libido',
  'urinary',
  'skin_hair',
  'bleeding',
  'specialist_group',
  'cancer_history',
  'diw_supported',
  'diw_not_supported',
  'diw_pending',
  'care_comparison',
  'tool',
  'site_none',
];

export function profileProblems(profiles: Record<string, CtaProfile>): string[] {
  const problems: string[] = [];
  for (const [name, p] of Object.entries(profiles)) {
    if (p.sticky_mobile_cta && name !== 'care_comparison') problems.push(`${name}: sticky mobile CTAs are for comparison pages only`);
    for (const f of p.free) {
      if (f.kind !== 'email_sequence' && !f.target.startsWith('/')) problems.push(`${name}: free CTA target "${f.target}" must be a site path`);
    }
  }
  for (const name of REQUIRED_PROFILES) if (!profiles[name]) problems.push(`missing profile "${name}"`);
  return problems;
}
