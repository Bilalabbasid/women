import type { Metadata } from 'next';
import Link from 'next/link';
import { APP_ROUTES } from '@/lib/routes';
import { buildMetadata } from '@/lib/seo/metadata';
import { getSiteData } from '@/lib/content/site-data';
import { webApplicationLd, breadcrumbLd } from '@/lib/seo/jsonld';
import { JsonLd, Breadcrumbs } from '@/components/site/site-chrome';
import { isToolLive } from '@/lib/tools/logic';
import { ArrowDown, ArrowRight, Lock, Wrench } from 'lucide-react';
import { TOOL_HEROES } from '@/components/site/tool-hero';
import { HonestyNotice } from '@/components/site/honesty-notice';

/** Short names for the hero's icon grid. */
const SHORT_NAMES: Record<string, string> = {
  '/tools/symptom-tracker/': 'Symptom tracker',
  '/tools/symptoms-checklist/': 'Symptoms checklist',
  '/tools/stage-guide/': 'Stage guide',
  '/tools/does-it-work-checker/': 'Evidence checker',
  '/tools/treatment-questions/': 'Question builder',
  '/tools/12-month-counter/': '12-month counter',
};

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

const READ_NEXT = [
  { href: '/perimenopause/', label: 'Perimenopause: signs, stages and when to see a doctor' },
  { href: '/symptoms/', label: 'Every menopause symptom we cover, A to Z' },
  { href: '/treatments/', label: 'Menopause treatments compared by evidence' },
  { href: '/does-it-work/', label: 'Supplements and remedies: what the trials show' },
];

/**
 * Tools hub. Code-defined because it is navigation, not medical content.
 * Each tool's own guide page lives in content/pages/tools/ and appears here
 * once it is in the build.
 */
export default function ToolsHub() {
  const { pages, byUrl: byUrlAll } = getSiteData();
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
    <div className="space-y-14">
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
      <div className="space-y-5">
        <Breadcrumbs crumbs={crumbs} />
        <header aria-labelledby="tools-title" className="grid items-start gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <div>
            <p className="kicker">Free · No account · Stays on your device</p>
            <h1 id="tools-title" className="mt-2 max-w-[20ch] text-[length:var(--fs-h1)] leading-[1.08]">
              Free menopause and perimenopause tools
            </h1>
            <p className="mt-4 max-w-[var(--measure)] text-[length:var(--fs-lead)] leading-relaxed text-[var(--ink-muted)]">
              Six free tools to help you notice patterns and prepare for appointments. They run in your browser with
              no account, what you enter stays on your device, and they never diagnose or prescribe.
            </p>
            <div className="no-print mt-6 flex flex-wrap items-center gap-x-4 gap-y-3">
              {trackerLive && (
                <Link href={APP_ROUTES.today} className="btn btn-primary btn-lg">
                  Open the tracker
                  <ArrowRight aria-hidden="true" className="h-5 w-5" />
                </Link>
              )}
              <a href={`#${sections[0]?.id ?? 'your-data'}`} className={trackerLive ? 'btn btn-quiet' : 'btn btn-primary btn-lg'}>
                Browse all tools
                <ArrowDown aria-hidden="true" className="h-5 w-5" />
              </a>
            </div>
          </div>
          {/* Quick jump: every tool, one tap. */}
          <ul className="grid grid-cols-2 gap-2.5" aria-label="All tools">
            {toolGuides.map((p) => {
              const Icon = TOOL_HEROES[p.url]?.Icon ?? Wrench;
              return (
                <li key={p.url}>
                  <Link href={p.url} className="card flex h-full items-center gap-3 p-3">
                    <span className="row-icon" aria-hidden="true">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="text-[1rem] font-bold leading-snug">{SHORT_NAMES[p.url] ?? p.fm.title}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </header>
      </div>

      <HonestyNotice variant="short" href="/medical-disclaimer/" />

      {sections.map((s) => (
        <section key={s.id} aria-labelledby={s.id} className="scroll-mt-20 space-y-4 border-t border-[var(--rule)] pt-8">
          <div className="space-y-1">
            <h2 id={s.id} className="text-[length:var(--fs-h2)]">
              {s.heading}
            </h2>
            {s.intro && <p className="max-w-[var(--measure)] text-[var(--ink-muted)]">{s.intro}</p>}
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {s.items.map((item) => {
              const Icon = TOOL_HEROES[item.url]?.Icon ?? Wrench;
              return (
                <li key={item.url}>
                  <Link href={item.url} className="card flex h-full items-start gap-4 p-5">
                    <span className="row-icon h-12 w-12" aria-hidden="true">
                      <Icon className="h-6 w-6" />
                    </span>
                    <span className="min-w-0">
                      <span className="card-title block">{item.title}</span>
                      <span className="mt-1.5 block text-[1.0625rem] leading-relaxed text-[var(--ink-muted)]">{item.text}</span>
                      <span className="link link-arrow mt-2 inline-block">Open tool</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      <section aria-labelledby="your-data" className="panel panel-quiet scroll-mt-20 sm:grid-cols-[auto_1fr] sm:items-start sm:gap-5">
        <span className="row-icon h-12 w-12" aria-hidden="true">
          <Lock className="h-6 w-6" />
        </span>
        <div className="max-w-[var(--measure)] space-y-2">
          <h2 id="your-data" className="panel-title">
            How these tools store what you enter
          </h2>
          <p>
            Everything you tick, type or log is saved in this browser on this device, so it&apos;s still there when you
            come back, with no account. You can save dated copies, reopen or delete them, and export a backup file.
            Nothing is sent to us, to analytics or to advertisers. Because the data lives only in this browser,
            clearing your browser data, using a private window or switching device means it won&apos;t be there, so
            export a backup now and then.
          </p>
        </div>
      </section>

      <section aria-labelledby="read-next" className="space-y-4">
        <h2 id="read-next" className="text-[length:var(--fs-h2)]">
          Read next
        </h2>
        <ul className="row-list max-w-[48rem]" role="list">
          {READ_NEXT.filter((r) => byUrlAll.has(r.href)).map((r) => (
            <li key={r.href}>
              <Link href={r.href} className="row">
                <span className="row-main row-title">{r.label}</span>
                <ArrowRight aria-hidden="true" className="h-5 w-5 shrink-0 text-[var(--ink-muted)]" />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
