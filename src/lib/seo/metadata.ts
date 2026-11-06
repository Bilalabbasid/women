import type { Metadata } from 'next';
import { SITE, absoluteUrl, isIndexable, type SiteConfig } from '../site/config';

export interface PageMetaInput {
  /** Full <title>, used as-is (no site-name template). */
  title: string;
  description: string;
  /** Site path with trailing slash. */
  path: string;
  noindex?: boolean;
  type?: 'website' | 'article';
  /** ISO date of the last material change, for article:modified_time. */
  modified?: string;
}

/**
 * One builder for every public page: unique title and description, absolute
 * canonical, Open Graph and Twitter tags. Non-production builds are always
 * noindex, whatever the page says.
 */
export function buildMetadata(input: PageMetaInput, config: SiteConfig = SITE): Metadata {
  const canonical = absoluteUrl(input.path, config);
  const noindex = input.noindex || !isIndexable(config.env);
  const fullTitle = input.title.includes(config.name)
    ? input.title
    : `${input.title} | ${config.name}`;
  const ogImage = absoluteUrl('/og-default.png', config);

  return {
    title: { absolute: fullTitle },
    description: input.description,
    alternates: { canonical },
    robots: noindex ? { index: false, follow: !input.noindex } : { index: true, follow: true },
    openGraph: {
      type: input.type ?? 'website',
      title: fullTitle,
      description: input.description,
      url: canonical,
      siteName: config.name,
      locale: 'en_US',
      images: [{ url: ogImage, width: 1200, height: 630, alt: `${config.name} — ${config.tagline}` }],
      ...(input.type === 'article' && input.modified ? { modifiedTime: input.modified } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: input.description,
      images: [ogImage],
    },
  };
}
