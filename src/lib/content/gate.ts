import type { ContentPage, ContentStore } from './loader';
import { showDrafts, type SiteEnv, SITE } from '../site/config';

/**
 * PUBLISH GATE (AGENTS.md rules 3 and 4).
 *
 * A medical page is publishable only when ALL of these hold:
 *  - status is clinician_approved or published
 *  - a reviewer is named, exists in people.yaml as a verified clinical reviewer
 *  - reviewed_at and review_due are set
 *  - an evidence grade is set and at least one source is cited
 *  - every cited source exists in the registry
 *  - approved_hash matches the current content (an edit resets approval)
 *
 * A non-medical page (legal, about, evidence method) needs owner_approved or
 * published and a matching approved_hash.
 *
 * Production builds include only publishable pages. Drafts render only on a
 * local dev server or authenticated staging, always with a draft banner.
 */
export function publishProblems(page: ContentPage, store: Pick<ContentStore, 'sources' | 'people'>): string[] {
  const { fm } = page;
  const problems: string[] = [];

  if (page.isMedical) {
    if (fm.status !== 'clinician_approved' && fm.status !== 'published') {
      problems.push(`status is "${fm.status}", needs clinician_approved or published`);
    }
    if (!fm.reviewer) problems.push('no clinical reviewer named');
    else {
      const reviewer = store.people.get(fm.reviewer);
      if (!reviewer) problems.push(`reviewer "${fm.reviewer}" is not in people.yaml`);
      else if (!reviewer.roles.includes('clinical_reviewer')) problems.push(`"${fm.reviewer}" is not a clinical reviewer`);
      else if (!reviewer.verified) problems.push(`reviewer "${fm.reviewer}" is not verified by the owner`);
    }
    if (!fm.reviewed_at) problems.push('no reviewed_at date');
    if (!fm.review_due) problems.push('no review_due date');
    if (!fm.evidence_grade) problems.push('no evidence grade');
    if (fm.sources.length === 0) problems.push('no sources cited');
  } else if (fm.status !== 'owner_approved' && fm.status !== 'published') {
    problems.push(`status is "${fm.status}", needs owner_approved or published`);
  }

  for (const id of fm.sources) {
    if (!store.sources.has(id)) problems.push(`cited source "${id}" is not in the registry`);
  }

  if (!fm.approved_hash) problems.push('no approved_hash (never approved)');
  else if (fm.approved_hash !== page.hash) {
    problems.push('content changed after approval: approval is reset until it is re-reviewed');
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
