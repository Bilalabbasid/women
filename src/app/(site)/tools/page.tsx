import type { Metadata } from 'next';
import Link from 'next/link';
import { APP_ROUTES } from '@/lib/routes';
import { buildMetadata } from '@/lib/seo/metadata';
import { getSiteData } from '@/lib/content/site-data';
import { webApplicationLd, breadcrumbLd } from '@/lib/seo/jsonld';
import { JsonLd, Breadcrumbs } from '@/components/site/site-chrome';
import { isToolLive } from '@/lib/tools/logic';

export const metadata: Metadata = buildMetadata({
  title: 'Free menopause tools: symptom tracker and doctor report',
  description:
    'Free, private tools for perimenopause and menopause. Track symptoms on your own device and print a summary for your doctor. No account, nothing sent to us.',
  path: '/tools/',
});

/**
 * Tools hub. Code-defined because it is navigation, not medical content.
 * Each tool's own guide page lives in content/pages/tools/ and appears here
 * only once it is in the build.
 */
export default function ToolsHub() {
  const { pages } = getSiteData();
  const toolGuides = pages.filter((p) => p.fm.page_type === 'tool');
  const trackerLive = isToolLive('symptom-tracker');
  const crumbs = [
    { name: 'Home', path: '/', linked: true },
    { name: 'Tools', path: '/tools/', linked: false },
  ];

  return (
    <div className="space-y-8">
      <JsonLd
        data={[
          breadcrumbLd(crumbs),
          ...(trackerLive ? [webApplicationLd({
            name: 'Symptom tracker and doctor report',
            path: APP_ROUTES.today,
            description: 'Private symptom log that stays on your device, with a printable summary for appointments.',
          })] : []),
        ]}
      />
      <Breadcrumbs crumbs={crumbs} />
      <header className="max-w-3xl space-y-3">
        <h1 className="text-3xl sm:text-4xl">Tools</h1>
        <p className="text-xl text-[var(--color-ink-muted)]">
          These tools help you notice patterns and prepare for appointments. They don&apos;t diagnose, and
          they don&apos;t recommend treatments or doses.
        </p>
      </header>

      {trackerLive && (
      <section aria-labelledby="tracker" className="space-y-3 rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)] p-5">
        <h2 id="tracker" className="text-2xl">
          Symptom tracker and doctor report
        </h2>
        <p>
          Log how you feel each day: symptoms and how strong they are, sleep, hot flashes, bleeding and
          anything you want to remember. Over a few weeks you&apos;ll see patterns, and you can print a
          one-page summary with your own questions for your clinician.
        </p>
        <h3 className="text-xl">What it does and doesn&apos;t do</h3>
        <ul className="list-disc space-y-1 pl-6">
          <li>It records what you tell it. It doesn&apos;t score you or tell you which stage you are in.</li>
          <li>
            If you log something that may need prompt care, such as bleeding or palpitations, it shows when to
            get checked. It always shows crisis lines if you mention harming yourself.
          </li>
          <li>Patterns it shows are things that happened together, not proof that one caused the other.</li>
        </ul>
        <h3 className="text-xl">Where your data goes</h3>
        <p>
          Nowhere. Entries are stored in this browser on this device (IndexedDB). There is no account. You can
          export everything as a file, or delete all of it, from the tracker&apos;s Privacy screen.
        </p>
        <p>
          <Link
            href={APP_ROUTES.today}
            className="tap rounded-xl bg-[var(--color-accent)] px-5 font-semibold text-white no-underline"
          >
            Open the tracker
          </Link>
        </p>
      </section>
      )}

      {!trackerLive && toolGuides.length === 0 && (
        <p>Our tools are being reviewed by a clinician before they go live.</p>
      )}

      {toolGuides.length > 0 && (
        <section aria-labelledby="guides" className="space-y-2">
          <h2 id="guides" className="text-2xl">
            Tool guides
          </h2>
          <ul className="space-y-1">
            {toolGuides.map((p) => (
              <li key={p.url}>
                <Link href={p.url} className="tap text-[var(--color-link)] underline">
                  {p.fm.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
