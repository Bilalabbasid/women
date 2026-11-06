import type { ContentPage, ContentStore } from './loader';
import { showDrafts, type SiteEnv, SITE } from '../site/config';
import type { PageType } from './schema';

/** Tool guides and hubs do not grade a single use, so they are exempt from the evidence_grade requirement. */
const GRADE_EXEMPT: readonly PageType[] = ['tool', 'hub'];

/**
 * PUBLISH GATE and REVIEW TRUTH — deliberately two separate, independent checks.
 * Conflating them is exactly how this file regressed once already (see git
 * history: a stub silently dropped review requirements from the gate; see
 * also the "approved" prop ReviewLine/jsonld.ts used to receive, which this
 * change retires in favour of passing isMedicallyReviewed()'s result directly).
 *
 * isMedicallyReviewed() — AGENTS.md rule 4 ("never fake review"), decided in
 * this conversation 2026-11-06 and unaffected by the owner-decision below:
 *   A "medically reviewed by X" badge, reviewedBy/lastReviewed schema, or any
 *   named clinician may appear ONLY when this returns true: a verified
 *   clinical_reviewer in people.yaml, reviewed_at set, and approved_hash
 *   matching the page's CURRENT content (editing resets it). This is the one
 *   and only source of truth for that — nothing else in the codebase should
 *   decide "is this reviewed" on its own.
 *
 * publishProblems()/isPublishable() — owner decision, this conversation,
 * 2026-11-06 (see DECISIONS.md): with no clinician yet on file, requiring
 * clinician_approved to publish would take ~300 already-written, sourced
 * pages out of the production build. The owner chose: publish once a page is
 * genuinely sourced and graded, show an honest "Not yet medically reviewed"
 * line (isMedicallyReviewed() above decides that independently — it is
 * NEVER faked by this relaxation), and treat real clinician sign-off as a
 * later upgrade path per page, not a launch blocker. This is a real,
 * intentional, documented tradeoff against the original brief's stricter
 * rule 3, made by the owner directly — not a silent stub.
 *
 * A non-medical page (legal, about, evidence method) needs owner_approved or
 * published. Production builds include only publishable pages; drafts render
 * only on a local dev server or authenticated staging, with a draft banner.
 */
export function isMedicallyReviewed(page: ContentPage, store: Pick<ContentStore, 'sources' | 'people'>): boolean {
  const { fm } = page;
  if (!page.isMedical || !fm.reviewer || !fm.reviewed_at) return false;
  const reviewer = store.people.get(fm.reviewer);
  if (!reviewer || !reviewer.roles.includes('clinical_reviewer') || !reviewer.verified) return false;
  return Boolean(fm.approved_hash && fm.approved_hash === page.hash);
}

export function publishProblems(page: ContentPage, store: Pick<ContentStore, 'sources' | 'people'>): string[] {
  const { fm } = page;
  const problems: string[] = [];

  if (page.isMedical) {
    if (fm.status === 'draft') problems.push('status is "draft"');
    if (!fm.evidence_grade && !GRADE_EXEMPT.includes(fm.page_type)) problems.push('no evidence grade');
    if (fm.sources.length === 0) problems.push('no sources cited');
    for (const c of fm.claims) {
      if (c.sources.length === 0) problems.push(`claim "${c.id}" has no source`);
    }
  } else if (fm.status !== 'owner_approved' && fm.status !== 'published') {
    problems.push(`status is "${fm.status}", needs owner_approved or published`);
  }

  for (const id of fm.sources) {
    if (!store.sources.has(id)) problems.push(`cited source "${id}" is not in the registry`);
  }

  return problems;
}

export function isPublishable(page: ContentPage, store: Pick<ContentStore, 'sources' | 'people'>): boolean {
  return publishProblems(page, store).length === 0;
}

/** Pages that exist in this build. */
export function visiblePages(store: ContentStore, siteEnv: SiteEnv = SITE.env): ContentPage[] {
  if (showDrafts(siteEnv)) return store.pages;
  return store.pages.filter((p) => isPublishable(p, store));
}

/** Pages that may appear in sitemap, RSS and search: publishable, indexable, canonical. */
export function indexablePages(store: ContentStore): ContentPage[] {
  return store.pages.filter((p) => isPublishable(p, store) && !p.fm.noindex);
}
