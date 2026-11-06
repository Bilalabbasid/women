import { z } from 'zod';

/**
 * Content frontmatter schema. Every field listed as required in AGENTS.md
 * ("Required frontmatter") must be present on every page, even if empty or
 * null. The build fails on any missing or malformed field.
 */

export const CLUSTERS = [
  'home',
  'perimenopause',
  'menopause',
  'postmenopause',
  'symptoms',
  'treatments',
  'does-it-work',
  'compare',
  'care',
  'tools',
  'groups',
  'evidence',
  'site',
] as const;

export const PAGE_TYPES = [
  'hub',
  'symptom',
  'treatment',
  'does_it_work',
  'comparison',
  'review',
  'guide',
  'tool',
  'group',
  'evidence',
  'legal',
  'about',
] as const;
export type PageType = (typeof PAGE_TYPES)[number];

/** Non-medical page types use the owner_approved flow. Everything else is medical. */
export const NON_MEDICAL_PAGE_TYPES: readonly PageType[] = ['legal', 'about', 'evidence'];
export const isMedicalPageType = (t: PageType) => !NON_MEDICAL_PAGE_TYPES.includes(t);

export const MEDICAL_STATUSES = ['draft', 'evidence_checked', 'clinician_approved', 'published', 'review_due'] as const;
export const NON_MEDICAL_STATUSES = ['draft', 'owner_approved', 'published'] as const;
export const ALL_STATUSES = [...new Set([...MEDICAL_STATUSES, ...NON_MEDICAL_STATUSES])] as [string, ...string[]];

/**
 * Evidence grades (AGENTS.md "Evidence grades"). `per_option` is for pages whose
 * options are graded individually in a table (for example a symptom page's
 * "What can help").
 */
export const EVIDENCE_GRADES = ['strong', 'moderate', 'limited', 'not_supported', 'harm_concern', 'per_option'] as const;
export type EvidenceGrade = (typeof EVIDENCE_GRADES)[number];

export const SAFETY_FLAGS = [
  'urgent_symptoms',
  'crisis',
  'bleeding',
  'cancer_history',
  'pregnancy',
  'medication_interactions',
] as const;

export const STAGE_TAGS = ['perimenopause', 'menopause', 'postmenopause', 'surgical', 'early', 'all'] as const;

const slugRe = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'must be a YYYY-MM-DD date');
const sitePath = z.string().regex(/^\/(?:[a-z0-9-]+\/)*$/, 'must be a site path like /symptoms/hot-flashes/');
const sourceId = z.string().regex(slugRe, 'source IDs are lowercase-hyphenated');

export const frontmatterSchema = z
  .object({
    title: z.string().min(5),
    seo_title: z.string().min(5),
    meta_description: z.string().min(50),
    cluster: z.enum(CLUSTERS),
    primary_keyword: z.string().min(2),
    slug: z.string().regex(slugRe),
    page_type: z.enum(PAGE_TYPES),
    secondary_keywords: z.array(z.string()),
    search_intent: z.enum(['informational', 'commercial', 'transactional', 'navigational']),
    funnel_stage: z.enum(['learn', 'worried', 'evaluating', 'comparing', 'sceptical']),
    symptom_tags: z.array(z.string().regex(slugRe)),
    stage_tags: z.array(z.enum(STAGE_TAGS)),
    audience_limits: z.array(z.string()),
    reviewed_at: isoDate.nullable(),
    review_due: isoDate.nullable(),
    status: z.enum(ALL_STATUSES),
    author: z.string().regex(slugRe),
    reviewer: z.string().regex(slugRe).nullable(),
    updated_at: isoDate,
    change_log: z
      .array(z.object({ date: isoDate, summary: z.string().min(3), material: z.boolean() }))
      .min(1),
    evidence_grade: z.enum(EVIDENCE_GRADES).nullable(),
    claims: z.array(
      z.object({
        id: z.string().regex(slugRe),
        text: z.string().min(5),
        sources: z.array(sourceId),
      }),
    ),
    safety_flags: z.array(z.enum(SAFETY_FLAGS)),
    cta_profile: z.string().regex(/^[a-z0-9_]+$/),
    hub: sitePath.nullable(),
    sources: z.array(sourceId),
    related: z.array(sitePath),
    affiliate_disclosure: z.boolean(),

    // Optional fields.
    /** sha256 of the approved content. Changing the content invalidates approval. */
    approved_hash: z.string().regex(/^[a-f0-9]{64}$/).nullable().optional(),
    faq: z.array(z.object({ q: z.string().min(5), a: z.string().min(5) })).optional(),
    noindex: z.boolean().optional(),
    /** Reason two pages may share a primary keyword. */
    keyword_override: z.string().min(10).optional(),
    /** Explicit, reasoned exceptions to the banned-phrase list (for example, quoted debunking). */
    banned_phrase_overrides: z.array(z.object({ phrase: z.string(), reason: z.string().min(10) })).optional(),
    locale: z.enum(['en-US', 'en-GB']).optional(),
  })
  .strict();

export type Frontmatter = z.infer<typeof frontmatterSchema>;

/** The required frontmatter keys, exactly as AGENTS.md lists them. */
export const REQUIRED_FIELDS = [
  'title',
  'seo_title',
  'meta_description',
  'cluster',
  'primary_keyword',
  'slug',
  'page_type',
  'secondary_keywords',
  'search_intent',
  'funnel_stage',
  'symptom_tags',
  'stage_tags',
  'audience_limits',
  'reviewed_at',
  'review_due',
  'status',
  'author',
  'reviewer',
  'updated_at',
  'change_log',
  'evidence_grade',
  'claims',
  'safety_flags',
  'cta_profile',
  'hub',
  'sources',
  'related',
  'affiliate_disclosure',
] as const;

// ---------------------------------------------------------------- sources

export const SOURCE_TYPES = [
  'regulator_label',
  'regulator_statement',
  'guideline',
  'position_statement',
  'systematic_review',
  'rct',
  'cohort',
  'small_study',
  'preprint',
  'brand_funded',
  'patient_information',
  'other',
] as const;

export type SourceType = (typeof SOURCE_TYPES)[number];

export const sourceSchema = z
  .object({
    id: sourceId,
    title: z.string().min(5),
    authors: z.array(z.string()),
    publisher: z.string().min(2),
    year: z.number().int().min(1950).max(2100),
    type: z.enum(SOURCE_TYPES),
    url: z.string().url().nullable(),
    doi: z.string().regex(/^10\.\d{4,}\/\S+$/).nullable(),
    accessed: isoDate,
    population: z.string(),
    key_finding: z.string().min(10),
    funding_conflict: z.string().nullable(),
    /** True only once a person has opened the source and confirmed the key finding. */
    verified: z.boolean(),
    notes: z.string().optional(),
  })
  .strict()
  .refine((s) => s.url !== null || s.doi !== null, { message: 'a source needs a URL or a DOI' });

export type Source = z.infer<typeof sourceSchema>;

// ---------------------------------------------------------------- people

export const personSchema = z
  .object({
    id: z.string().regex(slugRe),
    kind: z.enum(['person', 'organization']),
    /** null for the site's own editorial team: rendered as "<site name> editorial team". */
    name: z.string().nullable(),
    roles: z.array(z.enum(['author', 'editor', 'clinical_reviewer'])).min(1),
    credentials: z.string().nullable(),
    bio: z.string(),
    url: z.string().url().nullable(),
    /** True only once the owner has confirmed identity and credentials. */
    verified: z.boolean(),
  })
  .strict()
  .refine((p) => !p.roles.includes('clinical_reviewer') || (p.kind === 'person' && p.credentials), {
    message: 'a clinical reviewer must be a person with stated credentials',
  });

export type Person = z.infer<typeof personSchema>;
