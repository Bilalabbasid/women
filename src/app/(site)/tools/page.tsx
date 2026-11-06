import type { Metadata } from 'next';
import Link from 'next/link';
import { APP_ROUTES } from '@/lib/routes';
import { buildMetadata } from '@/lib/seo/metadata';
import { getSiteData } from '@/lib/content/site-data';
import { webApplicationLd, breadcrumbLd } from '@/lib/seo/jsonld';
import { JsonLd, Breadcrumbs } from '@/components/site/site-chrome';
import { isToolLive } from '@/lib/tools/logic';

export const metadata: Metadata = buildMetadata({
  title: 'Menopause tools: tracker, checklist & stage quiz',
  description:
    'Free, private menopause tools: symptom tracker, printable checklist, perimenopause stage quiz, evidence checker, HRT question builder and 12-month counter.',
  path: '/tools/',
});

/** Groups tools by the question a reader arrives with. Unlisted tool pages fall into "More tools". */
const GROUPS: Array<{ id: string; heading: string; intro: string; tools: Array<{ url: string; useWhen: string }> }> = [
  {
    id: 'is-it-perimenopause',
    heading: 'Wondering whether it could be perimenopause',
    intro: 'Start here if your periods or your body have started to change and you want to know what to look for.',
    tools: [
      {
        url: '/tools/symptoms-checklist/',
        useWhen: 'Tick the symptoms you have noticed and print a list for your appointment. No score, no sign-up.',
      },
      {
        url: '/tools/stage-guide/',
        useWhen: 'Answer five questions to see which STRAW+10 stage your period pattern resembles, and why.',
      },
      {
        url: '/tools/12-month-counter/',
        useWhen: 'Your periods have stopped: count the days to the 12-month mark and see when bleeding needs checking.',
      },
    ],
  },
  {
    id: 'tracking',
    heading: 'Keeping track over weeks and months',
    intro: 'A record over time shows a clinician more than memory can.',
    tools: [
      {
        url: '/tools/symptom-tracker/',
        useWhen: 'Log symptoms, sleep, hot flashes and bleeding daily or weekly, then print a one-page doctor report.',
      },
    ],
  },
  {
    id: 'treatment',
    heading: 'Weighing up treatment',
    intro: 'Check the evidence, then take your questions to someone who knows your health history.',
    tools: [
      {
        url: '/tools/does-it-work-checker/',
        useWhen: 'Look up HRT, newer non-hormonal drugs, CBT and supplements, with an evidence grade and source for each.',
      },
      {
        url: '/tools/treatment-questions/',
        useWhen: 'Choose your priorities and print a list of questions to ask about HRT and other options.',
      },
    ],
  },
];

/**
 * Tools hub. Code-defined because it is navigation, not medical content.
 * Each tool's own guide page lives in content/pages/tools/ and appears here
 * once it is in the build.
 */
export default function ToolsHub() {
  const { pages } = getSiteData();
  const toolGuides = pages.filter((p) => p.fm.page_type === 'tool');
  const byUrl = new Map(toolGuides.map((p) => [p.url, p]));
  const grouped = new Set(GROUPS.flatMap((g) => g.tools.map((t) => t.url)));
  const ungrouped = toolGuides.filter((p) => !grouped.has(p.url));
  const trackerLive = isToolLive('symptom-tracker');
  const crumbs = [
    { name: 'Home', path: '/', linked: true },
    { name: 'Tools', path: '/tools/', linked: false },
  ];

  const sections = [
    ...GROUPS.map((g) => ({
      ...g,
      items: g.tools.flatMap((t) => {
        const page = byUrl.get(t.url);
        return page ? [{ url: page.url, title: page.fm.title, text: t.useWhen }] : [];
      }),
    })),
    {
      id: 'more-tools',
      heading: 'More tools',
      intro: '',
      items: ungrouped.map((p) => ({ url: p.url, title: p.fm.title, text: p.fm.meta_description })),
    },
  ].filter((s) => s.items.length > 0);

  return (
    <div className="space-y-10">
      <JsonLd
        data={[
          breadcrumbLd(crumbs),
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
        <h1 className="text-3xl sm:text-4xl">Free menopause and perimenopause tools</h1>
        <p className="text-xl text-[var(--color-ink-muted)]">
          Six free tools to help you notice patterns and prepare for appointments: a symptom tracker, a printable
          checklist, a stage quiz, an evidence checker, an HRT question builder and a 12-month counter. They run in
          your browser with no account, and what you enter stays on your device. They never diagnose or prescribe.
        </p>
      </header>

      {trackerLive && (
        <section
          aria-labelledby="tracker"
          className="space-y-3 rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)] p-5"
        >
          <h2 id="tracker" className="text-2xl">
            Start tracking today
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
              How the tracker works
            </Link>
          </div>
        </section>
      )}

      {sections.map((s) => (
        <section key={s.id} aria-labelledby={s.id} className="space-y-4">
          <div className="space-y-1">
            <h2 id={s.id} className="text-2xl">
              {s.heading}
            </h2>
            {s.intro && <p className="text-[var(--color-ink-muted)]">{s.intro}</p>}
          </div>
          <ul className="grid gap-4 sm:grid-cols-2">
            {s.items.map((item) => (
              <li
                key={item.url}
                className="rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)] p-5"
              >
                <h3 className="text-xl font-semibold">
                  <Link href={item.url} className="tap text-[var(--color-link)] underline">
                    {item.title}
                  </Link>
                </h3>
                <p className="mt-2 text-[var(--color-ink-muted)]">{item.text}</p>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <section aria-labelledby="your-data" className="max-w-3xl space-y-3">
        <h2 id="your-data" className="text-2xl">
          How these tools store what you enter
        </h2>
        <p>
          Everything you tick, type or log is saved in this browser on this device, so it&apos;s still there when you
          come back, with no account. You can save dated copies, reopen or delete them, and export a backup file.
          Nothing is sent to us, to analytics or to advertisers. Because the data lives only in this browser,
          clearing your browser data, using a private window or switching device means it won&apos;t be there, so
          export a backup now and then.
        </p>
      </section>

      <section aria-labelledby="read-next" className="max-w-3xl space-y-3">
        <h2 id="read-next" className="text-2xl">
          Read next
        </h2>
        <ul className="list-disc space-y-1 pl-6">
          <li>
            <Link href="/perimenopause/" className="text-[var(--color-link)] underline">
              Perimenopause: signs, stages and when to see a doctor
            </Link>
          </li>
          <li>
            <Link href="/symptoms/" className="text-[var(--color-link)] underline">
              Every menopause symptom we cover, A to Z
            </Link>
          </li>
          <li>
            <Link href="/treatments/" className="text-[var(--color-link)] underline">
              Menopause treatments compared by evidence
            </Link>
          </li>
          <li>
            <Link href="/does-it-work/" className="text-[var(--color-link)] underline">
              Supplements and remedies: what the trials show
            </Link>
          </li>
        </ul>
      </section>
    </div>
  );
}
