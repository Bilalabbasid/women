/**
 * Homepage "start here" paths: four common situations, each a short, ordered
 * reading list of existing pages. Data only; the homepage decides how it looks.
 * Every href must be a published page (src/test/start-here.test.ts checks this).
 */
export interface StartHereStep {
  href: string;
  /** Short label for the step; the page's own title is used if omitted. */
  label?: string;
}

export interface StartHerePath {
  id: string;
  title: string;
  /** One sentence: who this path is for. */
  forWho: string;
  steps: StartHereStep[];
}

/** The homepage hero's main call to action. */
export const STAGE_QUIZ_CTA = {
  href: '/tools/stage-guide/',
  label: 'Which stage am I in? Take the 2-minute quiz',
  note: 'Private: your answers stay on this device.',
} as const;

export const START_HERE_PATHS: readonly StartHerePath[] = [
  {
    id: 'is-this-perimenopause',
    title: 'Is this perimenopause?',
    forWho: 'Your periods or your body are changing and you want to know why.',
    steps: [
      { href: '/perimenopause/early-signs/', label: 'Early signs to look for' },
      { href: '/tools/stage-guide/', label: 'Take the stage quiz' },
      { href: '/perimenopause/vs-menopause/', label: 'Perimenopause vs menopause' },
      { href: '/tools/symptoms-checklist/', label: 'Tick your symptoms' },
      { href: '/perimenopause/when-to-see-a-doctor/', label: 'When to see a doctor' },
    ],
  },
  {
    id: 'hot-flashes-and-sleep',
    title: 'Hot flashes and bad nights',
    forWho: 'Hot flashes, night sweats or 3am waking are wearing you down.',
    steps: [
      { href: '/symptoms/hot-flashes/', label: 'Hot flashes: what helps' },
      { href: '/symptoms/night-sweats/', label: 'Night sweats' },
      { href: '/symptoms/waking-at-3am/', label: 'Waking at 3am' },
      { href: '/treatments/nonhormonal/', label: 'Options without hormones' },
    ],
  },
  {
    id: 'thinking-about-hrt',
    title: 'Thinking about hormone therapy',
    forWho: 'You want to understand HRT, its risks and the 2025-2026 label changes.',
    steps: [
      { href: '/treatments/hormone-therapy/', label: 'Hormone therapy explained' },
      { href: '/treatments/hormone-therapy/boxed-warning/', label: 'The boxed warning change' },
      { href: '/treatments/hormone-therapy/patch-vs-pill/', label: 'Patch vs pill' },
      { href: '/tools/treatment-questions/', label: 'Questions to ask' },
    ],
  },
  {
    id: 'appointment',
    title: 'Getting ready for an appointment',
    forWho: 'You have an appointment coming up and want to make it count.',
    steps: [
      { href: '/tools/symptom-tracker/', label: 'Track your symptoms' },
      { href: '/tools/treatment-questions/', label: 'Build your question sheet' },
      { href: '/perimenopause/questions-for-your-doctor/', label: 'Questions for your doctor' },
      { href: '/care/when-your-doctor-dismisses-you/', label: 'If you feel dismissed' },
    ],
  },
];
