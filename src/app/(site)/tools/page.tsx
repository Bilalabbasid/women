import type { Metadata } from 'next';
import Link from 'next/link';
import { APP_ROUTES } from '@/lib/routes';
import { buildMetadata } from '@/lib/seo/metadata';
import { getSiteData } from '@/lib/content/site-data';
import { webApplicationLd, breadcrumbLd } from '@/lib/seo/jsonld';
import { JsonLd, Breadcrumbs } from '@/components/site/site-chrome';
import { isToolLive } from '@/lib/tools/logic';

export const metadata: Metadata = buildMetadata({
  title: 'Free menopause tools: tracker, checklist & stage guide',
  description:
    'Six free, private tools for perimenopause and menopause: symptom tracker, printable checklist, STRAW+10 stage guide, evidence checker, appointment builder, and 12-month counter.',
  path: '/tools/',
});

/**
 * Tools hub. Code-defined because it is navigation, not medical content.
 * Each tool's own guide page lives in content/pages/tools/ and appears here
 * once it is in the build.
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
          ...(trackerLive
            ? [
                webApplicationLd({
                  name: 'Symptom tracker and doctor report',
                  path: APP_ROUTES.today,
                  description:
                    'Private symptom log that stays on your device, with a printable summary for appointments.',
                }),
              ]
            : []),
          ...toolGuides.map((p) =>
            webApplicationLd({
              name: p.fm.title,
              path: p.url,
              description: p.fm.meta_description,
            }),
          ),
        ]}
      />
      <Breadcrumbs crumbs={crumbs} />
      <header className="max-w-3xl space-y-3">
        <h1 className="text-3xl sm:text-4xl">Free private menopause tools</h1>
        <p className="text-xl text-[var(--color-ink-muted)]">
          Every tool below runs in your browser on your own device. Nothing you enter is sent to a server, analytics,
          or partners. They help you notice patterns and prepare for appointments — they never diagnose or prescribe.
        </p>
      </header>

      {trackerLive && (
        <section
          aria-labelledby="tracker"
          className="space-y-3 rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)] p-5"
        >
          <h2 id="tracker" className="text-2xl">
            Symptom tracker and doctor report
          </h2>
          <p>
            Log how you feel each day or week: symptoms and how strong they are, sleep, hot flashes, bleeding, and
            notes in your own words. Over a few weeks you&apos;ll see patterns, and you can print a one-page summary
            with your own questions for your clinician.
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <Link
              href={APP_ROUTES.today}
              className="tap rounded-xl bg-[var(--color-accent)] px-5 font-semibold text-white no-underline"
            >
              Open the tracker
            </Link>
            <Link
              href="/tools/symptom-tracker/"
              className="tap rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper)] px-5 font-semibold no-underline"
            >
              Read tracker guide
            </Link>
          </div>
        </section>
      )}

      {toolGuides.length > 0 && (
        <section aria-labelledby="guides" className="space-y-4">
          <h2 id="guides" className="text-2xl">
            All interactive tools &amp; guides ({toolGuides.length})
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2">
            {toolGuides.map((p) => (
              <li
                key={p.url}
                className="flex flex-col justify-between rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)] p-5"
              >
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">
                    <Link href={p.url} className="tap text-[var(--color-link)] underline">
                      {p.fm.title}
                    </Link>
                  </h3>
                  <p className="text-sm text-[var(--color-ink-muted)]">{p.fm.meta_description}</p>
                </div>
                <p className="pt-3">
                  <Link href={p.url} className="tap text-sm font-semibold text-[var(--color-link)] underline">
                    Use tool &rarr;
                  </Link>
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
