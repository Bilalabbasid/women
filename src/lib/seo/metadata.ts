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
  /** Per-page social image (site path) with descriptive alt text. Defaults to the site image. */
  image?: { path: string; alt: string };
  /** Vertical 1000x1500 image for Pinterest (site path), added as a second og:image. */
  pinImagePath?: string;
}

export const MAX_TITLE_LENGTH = 60;

/**
 * One builder for every public page: unique title and description, absolute
 * canonical, Open Graph and Twitter tags. Non-production builds are always
 * noindex, whatever the page says.
 */
export function buildMetadata(input: PageMetaInput, config: SiteConfig = SITE): Metadata {
  const canonical = absoluteUrl(input.path, config);
  const noindex = input.noindex || !isIndexable(config.env);
  // The site name is appended only when the whole title still fits in search results
  // (~60 characters); a longer, specific title is shown in full rather than cut off.
  const withName = `${input.title} | ${config.name}`;
  const fullTitle =
    input.title.includes(config.name) || withName.length > MAX_TITLE_LENGTH ? input.title : withName;
  const ogImage = absoluteUrl(input.image?.path ?? '/og-default.png', config);
  const ogAlt = input.image?.alt ?? `${config.name} — ${config.tagline}`;

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
      images: [
        { url: ogImage, width: 1200, height: 630, alt: ogAlt },
        ...(input.pinImagePath
          ? [{ url: absoluteUrl(input.pinImagePath, config), width: 1000, height: 1500, alt: ogAlt }]
          : []),
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: input.description,
      images: [{ url: ogImage, alt: ogAlt }],
    },
  };
}
