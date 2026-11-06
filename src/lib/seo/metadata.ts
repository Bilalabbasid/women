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
  return {
    title: { absolute: input.title },
    description: input.description,
    alternates: { canonical },
    robots: noindex ? { index: false, follow: !input.noindex } : { index: true, follow: true },
    openGraph: {
      type: input.type ?? 'website',
      title: input.title,
      description: input.description,
      url: canonical,
      siteName: config.name,
      locale: 'en_US',
      ...(input.type === 'article' && input.modified ? { modifiedTime: input.modified } : {}),
    },
    twitter: { card: 'summary', title: input.title, description: input.description },
  };
}
