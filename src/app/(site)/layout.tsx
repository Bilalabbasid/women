import { SiteHeader, SiteFooter, JsonLd } from '@/components/site/site-chrome';
import { CookieBanner } from '@/components/site/cookie-banner';
import { getSiteData, navHubs } from '@/lib/content/site-data';
import { organizationLd, websiteLd } from '@/lib/seo/jsonld';

/**
 * Public site shell: server components only. The navigation shows only hubs
 * that exist in this build, so production never links to a draft.
 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  const { pages } = getSiteData();
  const footerLinks = pages
    .filter((p) => p.fm.cluster === 'site' || p.fm.cluster === 'evidence')
    .filter((p) => p.url.split('/').filter(Boolean).length <= 2)
    .sort((a, b) => a.fm.title.localeCompare(b.fm.title))
    .map((p) => ({ href: p.url, label: p.fm.title }));

  return (
    <>
      <JsonLd data={[organizationLd(), websiteLd()]} />
      <SiteHeader hubs={navHubs()} />
      <main id="main" className="mx-auto w-full max-w-6xl px-4 py-8">
        {children}
      </main>
      <SiteFooter links={footerLinks} hubs={navHubs()} />
      <CookieBanner />
    </>
  );
}
