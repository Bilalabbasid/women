import type { ContentPage, ContentStore } from '../content/loader';
import { isMedicallyReviewed } from '../content/gate';
import { SITE, absoluteUrl, type SiteConfig } from '../site/config';
import type { Person } from '../content/schema';

/**
 * Shared JSON-LD generator. Rules (AGENTS.md "Technical SEO"):
 *  - Organization and WebSite site-wide.
 *  - MedicalWebPage (medical) or Article/WebPage (other) on content pages, plus
 *    author and BreadcrumbList.
 *  - reviewedBy and lastReviewed ONLY when the page passes the publish gate
 *    with a verified clinical reviewer (never fake review).
 *  - No dateModified/datePublished (owner decision, 2026-11-06, see
 *    DECISIONS.md): a freshness date on ~90+ pages launching in the same
 *    short window would read identically across the whole site in search
 *    results, which can look like batch-produced content. Omitted for
 *    everyone, not hidden from crawlers only (that would be cloaking) and
 *    not faked with invented dates (that would be fabrication, rule 1).
 *  - FAQPage only for FAQs rendered visibly on the page.
 *  - WebApplication on tools where accurate.
 *  - Never Review, AggregateRating or Product ratings. assertNoRatings() enforces this.
 */

type Json = Record<string, unknown>;
const CTX = 'https://schema.org';

export const orgId = (c: SiteConfig = SITE) => `${c.url}/#organization`;
export const siteId = (c: SiteConfig = SITE) => `${c.url}/#website`;

export function organizationLd(c: SiteConfig = SITE): Json {
  return {
    '@context': CTX,
    '@type': 'Organization',
    '@id': orgId(c),
    name: c.name,
    url: `${c.url}/`,
    logo: absoluteUrl('/icons/icon-512.png', c),
    ...(c.legalEntity ? { legalName: c.legalEntity } : {}),
    ...(c.contactEmail ? { email: c.contactEmail } : {}),
  };
}

export function websiteLd(c: SiteConfig = SITE): Json {
  return {
    '@context': CTX,
    '@type': 'WebSite',
    '@id': siteId(c),
    name: c.name,
    url: `${c.url}/`,
    inLanguage: c.defaultLocale,
    publisher: { '@id': orgId(c) },
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${c.url}/search/?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  };
}

export interface Crumb {
  name: string;
  path: string;
}

export function breadcrumbLd(crumbs: Crumb[], c: SiteConfig = SITE): Json {
  return {
    '@context': CTX,
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((cr, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: cr.name,
      item: absoluteUrl(cr.path, c),
    })),
  };
}

function personOrOrg(p: Person | undefined, c: SiteConfig): Json {
  if (!p || p.kind === 'organization') return { '@id': orgId(c) };
  return {
    '@type': 'Person',
    name: p.name,
    ...(p.credentials ? { description: p.credentials } : {}),
    ...(p.url ? { url: p.url } : {}),
  };
}

export function contentPageLd(page: ContentPage, store: Pick<ContentStore, 'sources' | 'people'>, c: SiteConfig = SITE): Json {
  const { fm } = page;
  const url = absoluteUrl(page.url, c);
  const type = page.isMedical ? 'MedicalWebPage' : fm.page_type === 'legal' ? 'WebPage' : 'Article';
  const reviewer = fm.reviewer ? store.people.get(fm.reviewer) : undefined;
  // isMedicallyReviewed() is the single source of truth for this — never imply review from
  // "is this page live" (AGENTS.md rule 4). See gate.ts.
  const reviewIsReal = isMedicallyReviewed(page, store) && reviewer?.kind === 'person';

  const ld: Json = {
    '@context': CTX,
    '@type': type,
    '@id': `${url}#page`,
    url,
    name: fm.title,
    headline: fm.title,
    description: fm.meta_description,
    inLanguage: fm.locale ?? c.defaultLocale,
    isPartOf: { '@id': siteId(c) },
    publisher: { '@id': orgId(c) },
    author: personOrOrg(store.people.get(fm.author), c),
  };
  if (reviewIsReal) {
    ld.lastReviewed = fm.reviewed_at;
    ld.reviewedBy = personOrOrg(reviewer, c);
  }
  return ld;
}

/** Only call with FAQs that are rendered visibly on the same page. */
export function faqLd(faq: Array<{ q: string; a: string }>): Json | null {
  if (faq.length === 0) return null;
  return {
    '@context': CTX,
    '@type': 'FAQPage',
    mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };
}

export function webApplicationLd(opts: { name: string; path: string; description: string }, c: SiteConfig = SITE): Json {
  return {
    '@context': CTX,
    '@type': 'WebApplication',
    name: opts.name,
    url: absoluteUrl(opts.path, c),
    description: opts.description,
    applicationCategory: 'HealthApplication',
    operatingSystem: 'Any (runs in a web browser)',
    isAccessibleForFree: true,
    publisher: { '@id': orgId(c) },
  };
}

const BANNED_TYPES = new Set(['Review', 'AggregateRating', 'Rating', 'Product']);

/** Throws if any banned schema type appears anywhere in the graph. */
export function assertNoRatings(value: unknown): void {
  if (Array.isArray(value)) return value.forEach(assertNoRatings);
  if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      if (k === '@type' && typeof v === 'string' && BANNED_TYPES.has(v)) {
        throw new Error(`JSON-LD type "${v}" is not allowed (no review or rating schema without real, visible data)`);
      }
      if (k === 'aggregateRating' || k === 'review') throw new Error(`JSON-LD property "${k}" is not allowed`);
      assertNoRatings(v);
    }
  }
}

/** Safe serialisation for <script type="application/ld+json">. */
export function serializeLd(ld: Json | Json[]): string {
  assertNoRatings(ld);
  return JSON.stringify(ld).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
}
