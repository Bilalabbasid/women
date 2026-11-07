import { getSiteData, CLUSTER_LABELS } from '../content/site-data';
import { renderSocialImage, type SocialVariant } from './social-image';

/** Static params for every page in the build: one image per page. */
export function socialImageParams() {
  return getSiteData().pages.map((p) => ({ slug: p.url.split('/').filter(Boolean) }));
}

/** GET handler for /og/{page}/ and /pin/{page}/. */
export function socialImageHandler(variant: SocialVariant) {
  return async function GET(_req: Request, { params }: { params: Promise<{ slug: string[] }> }) {
    const { slug } = await params;
    const page = getSiteData().byUrl.get(`/${slug.join('/')}/`);
    if (!page) return new Response('Not found', { status: 404 });
    return renderSocialImage({
      variant,
      title: page.fm.title,
      section: CLUSTER_LABELS[page.fm.cluster] ?? page.fm.cluster,
      description: page.fm.meta_description,
      grade: page.fm.evidence_grade,
    });
  };
}

export const ogImagePath = (pageUrl: string) => `/og${pageUrl}`;
export const pinImagePath = (pageUrl: string) => `/pin${pageUrl}`;
