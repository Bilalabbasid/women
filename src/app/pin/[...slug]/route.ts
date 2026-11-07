import { socialImageHandler, socialImageParams } from '@/lib/seo/social-image-route';

/** 1000x1500 vertical image for Pinterest, at a predictable URL: /pin/{page path}/ */
export const dynamic = 'force-static';
export const dynamicParams = false;
export const generateStaticParams = socialImageParams;
export const GET = socialImageHandler('pin');
