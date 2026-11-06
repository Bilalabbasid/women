/**
 * Site configuration. The AGENTS.md placeholders ({{SITE_NAME}}, {{DOMAIN}},
 * {{CONTACT_EMAIL}}, {{LEGAL_ENTITY}}, {{EMAIL_PROVIDER}}) live here as env
 * values. Nothing is invented: unset values stay null, and a production build
 * refuses to run while any required value is missing (DECISIONS.md D-005).
 *
 * Environments (SITE_ENV):
 *  - production: drafts excluded, pages indexable, all placeholders required.
 *  - staging:    drafts shown with a banner, everything noindex, HTTP auth required.
 *  - (unset)     `next dev` → development (drafts shown, noindex);
 *                `next build` → preview (drafts excluded, everything noindex).
 */

export type SiteEnv = 'production' | 'staging' | 'preview' | 'development';

export function getSiteEnv(env: NodeJS.ProcessEnv = process.env): SiteEnv {
  if (env.SITE_ENV === 'production' || env.SITE_ENV === 'staging') return env.SITE_ENV;
  return env.NODE_ENV === 'development' ? 'development' : 'preview';
}

const clean = (v: string | undefined): string | null => {
  const t = v?.trim();
  return t && !/^\{\{.*\}\}$/.test(t) ? t : null;
};

export interface SiteConfig {
  name: string;
  /** Canonical origin, no trailing slash, for example https://example.com */
  url: string;
  contactEmail: string | null;
  legalEntity: string | null;
  emailProvider: string | null;
  defaultLocale: 'en-US';
  env: SiteEnv;
  flags: {
    login: boolean;
    aiPromotion: boolean;
    appDownloadPromotion: boolean;
  };
}

export function readSiteConfig(env: NodeJS.ProcessEnv = process.env): SiteConfig {
  const siteEnv = getSiteEnv(env);
  const url = clean(env.SITE_URL)?.replace(/\/+$/, '') ?? 'http://localhost:3000';
  return {
    name: clean(env.SITE_NAME) ?? 'MenoWell',
    url,
    contactEmail: clean(env.CONTACT_EMAIL),
    legalEntity: clean(env.LEGAL_ENTITY),
    emailProvider: clean(env.EMAIL_PROVIDER),
    defaultLocale: 'en-US',
    env: siteEnv,
    flags: {
      login: env.FEATURE_LOGIN === 'true',
      aiPromotion: env.FEATURE_AI_PROMOTION === 'true',
      appDownloadPromotion: env.FEATURE_APP_DOWNLOAD_PROMOTION === 'true',
    },
  };
}

/** Required before a production build. Returns the names of missing values. */
export function missingProductionConfig(env: NodeJS.ProcessEnv = process.env): string[] {
  const required = ['SITE_NAME', 'SITE_URL', 'CONTACT_EMAIL', 'LEGAL_ENTITY'] as const;
  const missing: string[] = required.filter((k) => !clean(env[k]));
  const url = clean(env.SITE_URL);
  if (url && !/^https:\/\//.test(url)) missing.push('SITE_URL (must be https://)');
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
