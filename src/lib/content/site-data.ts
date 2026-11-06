import { getContent, type ContentPage, type ContentStore } from './loader';
import { visiblePages, publishProblems } from './gate';
import { renderMarkdown, type RenderResult } from './markdown';
import type { Crumb } from '../seo/jsonld';

/**
 * Public routes defined in code (not content). Content pages must not use
 * these URLs (validate:content checks for collisions).
 */
export const STATIC_PUBLIC_PATHS = ['/', '/tools/', '/urgent-help/', '/search/'] as const;

/** Link targets that are always valid from content: code routes and the private tracker. */
export function isStaticTarget(path: string): boolean {
  return (STATIC_PUBLIC_PATHS as readonly string[]).includes(path) || path.startsWith('/app/');
}

export const CLUSTER_LABELS: Record<string, string> = {
  perimenopause: 'Perimenopause',
  menopause: 'Menopause',
  postmenopause: 'Postmenopause',
  symptoms: 'Symptoms',
  treatments: 'Treatments',
  'does-it-work': 'Does it work?',
  compare: 'Compare care',
  care: 'Getting care',
  tools: 'Tools',
  groups: 'Specific situations',
  evidence: 'Evidence',
  site: 'About',
};

/** Primary navigation hubs, in display order. Shown only when the hub page exists in this build. */
export const NAV_HUBS = ['/perimenopause/', '/symptoms/', '/treatments/', '/does-it-work/'] as const;

export interface SiteData {
  store: ContentStore;
  pages: ContentPage[];
  byUrl: Map<string, ContentPage>;
  knownPaths: Set<string>;
}

let cached: SiteData | null = null;

export function getSiteData(): SiteData {
  if (cached) return cached;
  const store = getContent();
  const pages = visiblePages(store);
  const byUrl = new Map(pages.map((p) => [p.url, p]));
  cached = { store, pages, byUrl, knownPaths: new Set(pages.map((p) => p.url)) };
  return cached;
}

const renderCache = new Map<string, RenderResult>();

export function renderPage(page: ContentPage): RenderResult {
  const hit = renderCache.get(page.url);
  if (hit) return hit;
  const { knownPaths } = getSiteData();
  const result = renderMarkdown(page.body, { knownPaths, isAlwaysValid: isStaticTarget });
  renderCache.set(page.url, result);
  return result;
}

/** Home > parent hubs that exist > this page. Hubs that don't exist in this build appear as plain text. */
export function breadcrumbsFor(page: ContentPage): Array<Crumb & { linked: boolean }> {
  const { byUrl } = getSiteData();
  const crumbs: Array<Crumb & { linked: boolean }> = [{ name: 'Home', path: '/', linked: true }];
  const segs = page.url.split('/').filter(Boolean);
  for (let i = 1; i < segs.length; i++) {
    const path = `/${segs.slice(0, i).join('/')}/`;
    const parent = byUrl.get(path);
    // Code routes such as /tools/ are real pages too, so they are linked.
    crumbs.push({ name: parent?.fm.title ?? CLUSTER_LABELS[segs[i - 1]] ?? segs[i - 1], path, linked: Boolean(parent) || isStaticTarget(path) });
  }
  crumbs.push({ name: page.fm.title, path: page.url, linked: false });
  return crumbs;
}

export function navHubs(): Array<{ href: string; label: string }> {
  const { byUrl } = getSiteData();
  return NAV_HUBS.filter((h) => byUrl.has(h)).map((h) => ({
    href: h,
    label: CLUSTER_LABELS[h.replaceAll('/', '')] ?? byUrl.get(h)!.fm.title,
  }));
}

export function draftProblems(page: ContentPage): string[] {
  return publishProblems(page, getSiteData().store);
}

/** Visible pages that name this page as their hub. */
export function childrenOf(hubUrl: string): ContentPage[] {
  return getSiteData()
    .pages.filter((p) => p.fm.hub === hubUrl && p.url !== hubUrl)
    .sort((a, b) => a.fm.title.localeCompare(b.fm.title));
}

/**
 * Related pages: editorial `related` first (only those in this build), then
 * pages sharing symptom/stage tags or cluster. Never includes drafts in production.
 */
export function relatedFor(page: ContentPage, limit = 6): ContentPage[] {
  const { pages, byUrl } = getSiteData();
  return relatedFrom(page, pages, byUrl, limit);
}

/** Pure version used by the site and by scripts/link-audit.ts. */
export function relatedFrom(
  page: ContentPage,
  pages: ContentPage[],
  byUrl: Map<string, ContentPage>,
  limit = 6,
): ContentPage[] {
  const chosen: ContentPage[] = [];
  for (const u of page.fm.related) {
    const p = byUrl.get(u);
    if (p && p.url !== page.url) chosen.push(p);
  }
  const score = (p: ContentPage) =>
    p.fm.symptom_tags.filter((t) => page.fm.symptom_tags.includes(t)).length * 3 +
    p.fm.stage_tags.filter((t) => page.fm.stage_tags.includes(t)).length +
    (p.fm.cluster === page.fm.cluster ? 1 : 0);
  const rest = pages
    .filter((p) => p.url !== page.url && !chosen.includes(p))
    .map((p) => ({ p, s: score(p) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || a.p.fm.title.localeCompare(b.p.fm.title))
    .map((x) => x.p);
  return [...chosen, ...rest].slice(0, limit);
}
