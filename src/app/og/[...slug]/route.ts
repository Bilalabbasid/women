import { socialImageHandler, socialImageParams } from '@/lib/seo/social-image-route';

/** 1200x630 Open Graph / X card image for each page: /og/{page path}/ */
export const dynamic = 'force-static';
export const dynamicParams = false;
export const generateStaticParams = socialImageParams;
export const GET = socialImageHandler('og');
