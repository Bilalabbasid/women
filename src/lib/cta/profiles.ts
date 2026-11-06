import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { parse as parseYaml } from 'yaml';

/**
 * CTA profiles (AGENTS.md "CTA engine"). A page's `cta_profile` decides which
 * free next steps it offers and which commercial categories are allowed or
 * banned. The selection engine (Phase 6) reads these. Partners come later in
 * content/_cta/partners.yaml, and a partner can only be shown under a profile
 * that allows its category.
 *
 * Selection order is fixed: safety → understand → act for free → get care or buy.
 */

export const COMMERCIAL_CATEGORIES = [
  'telehealth',
  'sexual_health_telehealth',
  'clinician_led_specialist_care',
  'therapy_service',
  'cbt_program',
  'cbt_i_program',
  'comfort_bedding',
  'lubricants_moisturizers',
  'strength_program',
  'strength_equipment',
  'mobility_products',
  'dermatology_care',
  'books',
  'vetted_product_with_claim_limits',
  'evidence_backed_alternative',
] as const;

/** Things the brief's matrix says never to offer. Names describe the claim or product type. */
export const BANNED_CATEGORIES = [
  'supplement_as_treatment',
  'cooling_product_as_treatment',
  'sleep_supplement',
  'energy_supplement',
  'mood_supplement',
  'nootropic',
  'diet_pills',
  'detox',
  'goal_weight_tool',
  'before_after_claims',
  'weight_drug_promotion',
  'collagen_claims',
  'anti_inflammatory_supplement',
  'vaginal_rejuvenation',
  'libido_supplement',
  'cranberry_cure_claims',
  'hair_growth_promise',
  'generic_supplement',
  'hormone_products',
  'hormone_tests',
  'hormone_pellets',
  'compounded_hormones',
  'buy_link_for_not_supported_item',
  'ranking_by_commission',
  'offer_that_may_delay_assessment',
  'claims_beyond_evidence',
] as const;

/** Banned on every profile, whatever the profile file says. */
export const GLOBAL_NEVER: ReadonlyArray<(typeof BANNED_CATEGORIES)[number]> = [
  'hormone_tests',
  'hormone_pellets',
  'compounded_hormones',
  'diet_pills',
  'detox',
  'goal_weight_tool',
  'before_after_claims',
  'ranking_by_commission',
  'claims_beyond_evidence',
];

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
    commercial_allowed: z.array(z.enum(COMMERCIAL_CATEGORIES)),
    commercial_never: z.array(z.enum(BANNED_CATEGORIES)),
    /**
     * Where a commercial block may appear:
     *  - none: never on this profile
     *  - after_evidence: after the opening answer and the evidence sections
     *  - after_section: only after the section whose heading id is `after_section_id`
     */
    placement: z.enum(['none', 'after_evidence', 'after_section']),
    after_section_id: z.string().optional(),
    max_commercial_blocks: z.number().int().min(0).max(10),
    /** A clinician must approve each commercial placement on pages with this profile. */
    clinician_approval_required: z.boolean(),
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

/**
 * The brief's CTA matrix, as a test oracle. Each listed profile must exist and
 * must ban at least these categories. Profiles may be stricter, never looser.
 */
export const MATRIX_REQUIRED_NEVER: Record<string, Array<(typeof BANNED_CATEGORIES)[number]>> = {
  vasomotor: ['supplement_as_treatment', 'cooling_product_as_treatment'],
  sleep: ['sleep_supplement'],
  fatigue: ['energy_supplement'],
  mood: ['mood_supplement'],
  cognitive: ['nootropic'],
  cardio_urgent: ['supplement_as_treatment'],
  weight: ['diet_pills', 'detox', 'goal_weight_tool', 'before_after_claims', 'weight_drug_promotion'],
  musculoskeletal: ['collagen_claims', 'anti_inflammatory_supplement'],
  genitourinary_vaginal: ['vaginal_rejuvenation'],
  libido: ['libido_supplement'],
  urinary: ['cranberry_cure_claims', 'supplement_as_treatment'],
  skin_hair: ['collagen_claims', 'hair_growth_promise'],
  bleeding: ['offer_that_may_delay_assessment'],
  specialist_group: ['generic_supplement'],
  cancer_history: ['hormone_products', 'generic_supplement'],
  diw_supported: ['claims_beyond_evidence'],
  diw_not_supported: ['buy_link_for_not_supported_item'],
  care_comparison: ['ranking_by_commission'],
};

/** Profiles that must never carry a commercial block. */
export const MATRIX_NO_COMMERCIAL = ['bleeding', 'cancer_history', 'diw_pending', 'tool', 'site_none'];

export function profileProblems(profiles: Record<string, CtaProfile>): string[] {
  const problems: string[] = [];
  for (const [name, p] of Object.entries(profiles)) {
    const never = new Set<string>([...p.commercial_never, ...GLOBAL_NEVER]);
    for (const a of p.commercial_allowed) if (never.has(a)) problems.push(`${name}: "${a}" is both allowed and banned`);
    if (p.placement === 'none' && (p.commercial_allowed.length || p.max_commercial_blocks)) {
      problems.push(`${name}: placement "none" but commercial categories or blocks are allowed`);
    }
    if (p.placement !== 'none' && p.commercial_allowed.length === 0) problems.push(`${name}: placement set but nothing is allowed`);
    if (p.placement === 'after_section' && !p.after_section_id) problems.push(`${name}: after_section needs after_section_id`);
    if (p.max_commercial_blocks > 1 && name !== 'care_comparison') problems.push(`${name}: at most one commercial block per article`);
    if (p.sticky_mobile_cta && name !== 'care_comparison') problems.push(`${name}: sticky mobile CTAs are for comparison pages only`);
    for (const f of p.free) {
      if (f.kind !== 'email_sequence' && !f.target.startsWith('/')) problems.push(`${name}: free CTA target "${f.target}" must be a site path`);
      if (f.target.startsWith('/go/')) problems.push(`${name}: a free CTA cannot point to /go/`);
    }
  }
  for (const [name, required] of Object.entries(MATRIX_REQUIRED_NEVER)) {
    const p = profiles[name];
    if (!p) {
      problems.push(`missing profile "${name}" required by the CTA matrix`);
      continue;
    }
    for (const c of required) if (!p.commercial_never.includes(c)) problems.push(`${name}: must ban "${c}" (CTA matrix)`);
  }
  for (const name of MATRIX_NO_COMMERCIAL) {
    const p = profiles[name];
    if (!p) problems.push(`missing profile "${name}"`);
    else if (p.placement !== 'none') problems.push(`${name}: must never carry commercial content`);
  }
  if (profiles.cardio_urgent && !profiles.cardio_urgent.clinician_approval_required) {
    problems.push('cardio_urgent: commercial content needs clinician approval (CTA matrix)');
  }
  return problems;
}
