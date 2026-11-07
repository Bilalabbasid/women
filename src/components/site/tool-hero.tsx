import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowDown,
  ArrowRight,
  CalendarClock,
  Check,
  Compass,
  ListChecks,
  MessageCircleQuestion,
  NotebookPen,
  Scale,
} from 'lucide-react';

interface ToolHeroConfig {
  Icon: LucideIcon;
  cta: string;
  /** Where the tool itself lives when it isn't embedded on the page (the tracker app). */
  appHref?: string;
  features: string[];
}

/** Each feature line restates what the page's own copy says the tool does: nothing beyond it. */
export const TOOL_HEROES: Record<string, ToolHeroConfig> = {
  '/tools/symptom-tracker/': {
    Icon: NotebookPen,
    cta: 'Open the tracker',
    appHref: '/app/today/',
    features: [
      'Log a day in under a minute',
      'Daily or weekly entries',
      'Timeline and symptom insights',
      'Print a one-page doctor report',
    ],
  },
  '/tools/symptoms-checklist/': {
    Icon: ListChecks,
    cta: 'Start the checklist',
    features: ["Tick what you've noticed", 'Save a dated list', 'Print it for your doctor', 'No score, no sign-up'],
  },
  '/tools/stage-guide/': {
    Icon: Compass,
    cta: 'Answer 5 questions',
    features: [
      'Age, periods and hot flashes',
      'Based on STRAW+10 staging',
      'No score, no email',
      "Can't diagnose: it helps you ask",
    ],
  },
  '/tools/does-it-work-checker/': {
    Icon: Scale,
    cta: 'Search the evidence',
    features: [
      'HRT, non-hormonal drugs, CBT, supplements',
      'Filter by symptom',
      'Evidence grade and guideline source',
      'Keep a shortlist on this device',
    ],
  },
  '/tools/treatment-questions/': {
    Icon: MessageCircleQuestion,
    cta: 'Build my questions',
    features: [
      'Pick what matters to you',
      'HRT, the FDA label change, non-hormonal options',
      'A printable question sheet',
      'No sign-up',
    ],
  },
  '/tools/12-month-counter/': {
    Icon: CalendarClock,
    cta: 'Start counting',
    features: [
      'Days to the 12-month mark',
      'Log a new period to restart it',
      'See when bleeding needs checking',
      'Dates stay on this device',
    ],
  },
};

/**
 * Tool page top: editorial, matching the article header (no banner). Kicker,
 * H1, lead, the main action, then a quiet "What you get" panel. The tool
 * itself follows on the page.
 */
export function ToolHero({
  config,
  title,
  description,
  primaryHref,
  guideHref,
}: {
  config: ToolHeroConfig;
  title: string;
  description: string;
  /** Null when the tool isn't live in this build: the hero then offers no button. */
  primaryHref: string | null;
  /** In-page anchor to the guide's first section, when there is one. */
  guideHref?: string;
}) {
  const { Icon, cta, features } = config;
  const inPage = primaryHref?.startsWith('#');

  return (
    <header className="tool-hero">
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div>
          <p className="kicker">Free tool · No account · Stays on your device</p>
          <h1 className="mt-2 max-w-[20ch] text-[length:var(--fs-h1)] leading-[1.08]">{title}</h1>
          <p className="mt-4 max-w-[var(--measure)] text-[length:var(--fs-lead)] leading-relaxed text-[var(--ink-muted)]">
            {description}
          </p>
          {primaryHref && (
            <div className="no-print mt-6 flex flex-wrap items-center gap-x-4 gap-y-3">
              {inPage ? (
                <a href={primaryHref} className="btn btn-primary btn-lg">
                  {cta}
                  <ArrowDown aria-hidden="true" className="h-5 w-5" />
                </a>
              ) : (
                <Link href={primaryHref} className="btn btn-primary btn-lg">
                  {cta}
                  <ArrowRight aria-hidden="true" className="h-5 w-5" />
                </Link>
              )}
              {guideHref && (
                <a href={guideHref} className="btn btn-quiet">
                  How it works
                </a>
              )}
            </div>
          )}
        </div>

        <div className="panel panel-quiet">
          <div className="flex items-center gap-3">
            <span className="row-icon" aria-hidden="true">
              <Icon className="h-6 w-6" />
            </span>
            <p className="font-serif text-[1.2rem] font-semibold">What you get</p>
          </div>
          <ul className="grid gap-2.5">
            {features.map((f) => (
              <li key={f} className="flex items-start gap-2.5">
                <span className="mt-0.5 inline-grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[var(--accent)] text-[var(--on-accent)]">
                  <Check aria-hidden="true" className="h-4 w-4" strokeWidth={3} />
                </span>
                <span className="leading-snug">{f}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </header>
  );
}
