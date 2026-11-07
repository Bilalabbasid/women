/**
 * Site configuration for MenoVerdict (https://menoverdict.com).
 *
 * Environments (SITE_ENV):
 *  - production: drafts excluded, pages indexable, canonical origin https://menoverdict.com.
 *  - staging:    drafts shown with a banner, everything noindex, HTTP auth required.
 *  - preview:    drafts excluded, everything noindex (e.g. when SITE_ENV=preview or VERCEL_ENV=preview).
 *  - development:`next dev` -> drafts shown, noindex.
 */

export type SiteEnv = 'production' | 'staging' | 'preview' | 'development';

export function getSiteEnv(env: NodeJS.ProcessEnv = process.env): SiteEnv {
  if (env.SITE_ENV === 'production' || env.SITE_ENV === 'staging' || env.SITE_ENV === 'preview' || env.SITE_ENV === 'development') {
    return env.SITE_ENV;
  }
  if (env.VERCEL_ENV === 'preview' || env.VERCEL_ENV === 'development') {
    return 'preview';
  }
  return env.NODE_ENV === 'development' ? 'development' : 'production';
}

const clean = (v: string | undefined): string | null => {
  const t = v?.trim();
  return t && !/^\{\{.*\}\}$/.test(t) ? t : null;
};

export interface SiteConfig {
  name: string;
  tagline: string;
  /** Canonical origin, no trailing slash: https://menoverdict.com */
  url: string;
  contactEmail: string | null;
  legalEntity: string | null;
  emailProvider: string | null;
  /** Google Search Console HTML-tag verification code (GSC_VERIFICATION). */
  gscVerification: string | null;
  defaultLocale: 'en-US';
  env: SiteEnv;
}

export function readSiteConfig(env: NodeJS.ProcessEnv = process.env): SiteConfig {
  const siteEnv = getSiteEnv(env);
  const url = clean(env.SITE_URL)?.replace(/\/+$/, '') ?? 'https://menoverdict.com';
  return {
    name: clean(env.SITE_NAME) ?? 'MenoVerdict',
    tagline: clean(env.SITE_TAGLINE) ?? 'Menopause answers, graded by evidence.',
    url,
    contactEmail: clean(env.CONTACT_EMAIL),
    legalEntity: clean(env.LEGAL_ENTITY),
    emailProvider: clean(env.EMAIL_PROVIDER),
    gscVerification: clean(env.GSC_VERIFICATION),
    defaultLocale: 'en-US',
    env: siteEnv,
  };
}

/** Validates that the canonical URL is a valid https:// origin. */
export function missingProductionConfig(env: NodeJS.ProcessEnv = process.env): string[] {
  const cfg = readSiteConfig(env);
  const missing: string[] = [];
  if (!cfg.name) missing.push('SITE_NAME');
  if (!cfg.url || !/^https:\/\//.test(cfg.url)) missing.push('SITE_URL (must be https://)');
  return missing;
}

export const SITE: SiteConfig = readSiteConfig();

/** Drafts are only ever visible on a local dev server or authenticated staging. */
export function showDrafts(siteEnv: SiteEnv = SITE.env): boolean {
  return siteEnv === 'development' || siteEnv === 'staging';
}

/** Only production may be indexed. Every other environment sends noindex. */
export function isIndexable(siteEnv: SiteEnv = SITE.env): boolean {
  return siteEnv === 'production';
}

export function absoluteUrl(path: string, config: SiteConfig = SITE): string {
  return new URL(path, `${config.url}/`).toString();
}
