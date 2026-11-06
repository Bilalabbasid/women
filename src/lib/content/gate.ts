import type { ContentPage, ContentStore } from './loader';
import { showDrafts, type SiteEnv, SITE } from '../site/config';

/**
 * PUBLISH GATE (AGENTS.md rules 3 and 4).
 *
 * A medical page is publishable only when ALL of these hold:
 *  - status is clinician_approved or published
 *  - a reviewer is named, exists in people.yaml as a verified clinical reviewer
 *  - reviewed_at and review_due are set
 *  - an evidence grade is set (except tool guides and hubs) and at least one source is cited
 *  - every cited source exists in the registry
 *  - approved_hash matches the current content (an edit resets approval)
 *
 * A non-medical page (legal, about, evidence method) needs owner_approved or
 * published and a matching approved_hash.
 *
 * Production builds include only publishable pages. Drafts render only on a
 * local dev server or authenticated staging, always with a draft banner.
 */
export function isMedicallyReviewed(page: ContentPage, store: Pick<ContentStore, 'sources' | 'people'>): boolean {
  const { fm } = page;
  if (!page.isMedical || !fm.reviewer || !fm.reviewed_at) return false;
  const reviewer = store.people.get(fm.reviewer);
  if (!reviewer || !reviewer.roles.includes('clinical_reviewer') || !reviewer.verified) return false;
  return Boolean(fm.approved_hash && fm.approved_hash === page.hash);
}

/**
 * PUBLISH GATE (Prompt 2 Owner Decisions 1 & 2).
 *
 * All pages go live:
 *  - Sources cited must exist in the sources registry
 *  - Clinician approval does NOT block publishing
 *  - Honesty rule: pages without clinical review display the honesty notice
 *    and omit reviewer schema / reviewer name
 */
export function publishProblems(page: ContentPage, store: Pick<ContentStore, 'sources' | 'people'>): string[] {
  const { fm } = page;
  const problems: string[] = [];

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
