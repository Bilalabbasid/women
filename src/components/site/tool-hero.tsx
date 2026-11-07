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
import { HeroPanel, heroEyebrow, heroTitle, heroLead, heroPrimaryBtn, heroGhostBtn } from './hero-panel';

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
    <HeroPanel>
      <div className="grid items-center gap-8 md:grid-cols-[3fr_2fr]">
        <div className="space-y-5">
          <p className={heroEyebrow}>Free tool · No account · Stays on your device</p>
          <h1 className={heroTitle}>{title}</h1>
          <p className={heroLead}>{description}</p>
          {primaryHref && (
            <div className="no-print flex flex-wrap items-center gap-3 pt-1">
              {inPage ? (
                <a href={primaryHref} className={heroPrimaryBtn}>
                  {cta}
                  <ArrowDown aria-hidden="true" className="h-4 w-4" />
                </a>
              ) : (
                <Link href={primaryHref} className={heroPrimaryBtn}>
                  {cta}
                  <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </Link>
              )}
              {guideHref && (
                <a href={guideHref} className={heroGhostBtn}>
                  How it works
                </a>
              )}
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-white p-5 text-[var(--color-ink)] shadow-xl shadow-black/20 sm:p-6">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-accent)] text-white">
              <Icon aria-hidden="true" className="h-6 w-6" />
            </span>
            <p className="font-serif text-lg font-semibold">What you get</p>
          </div>
          <ul className="mt-4 space-y-2.5">
            {features.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-base">
                <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
                  <Check aria-hidden="true" className="h-4 w-4" strokeWidth={3} />
                </span>
                <span className="leading-snug">{f}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </HeroPanel>
  );
}
