/**
 * The honesty notice: the one place its wording lives. Every page, tool, app
 * screen, print view and PDF reads from here (src/components/site/honesty-notice.tsx,
 * the doctor-report PDF, the app shell). Edit the wording here and nowhere else;
 * scripts/validate-honesty.ts checks every built page carries it.
 */

export const HONESTY_ANCHOR = 'how-this-page-was-made';

/** One line, directly under the H1 of every article, tool and comparison page. */
export const HONESTY_SHORT = {
  text: 'Not medical advice. Compiled from published sources and graded with AI help — not by a doctor.',
  linkLabel: 'How this page was made ↓',
} as const;

/** Every page, including home, hubs, legal pages, the 404 and the app. */
export const HONESTY_FOOTER =
  'MenoVerdict is not a medical service. Information here is gathered from published online sources and summarized with AI help; it may be wrong. Always talk to a doctor about your own health.';

/** "How this page was made": the end of every article, tool landing page and comparison. */
export const HONESTY_FULL = {
  heading: 'How this page was made',
  lead: 'We are not doctors. MenoVerdict is not a medical service, and no doctor wrote this page.',
  /** Only when a verified clinician approved this exact version (isMedicallyReviewed). */
  leadReviewed: (r: { name: string; credentials: string; date: string }) =>
    `We are not doctors. MenoVerdict is not a medical service. No doctor wrote this page. It was checked for accuracy by ${r.name}, ${r.credentials}, on ${r.date}. That check is not personal medical advice.`,
  sections: [
    {
      title: 'Where this comes from.',
      body: "We gathered information that is already published online — medical society guidelines, research studies, government health pages and medicine labels — and put it in one place so it's easier to read. Every source is linked under References.",
    },
    {
      title: 'How the grades are made.',
      body: 'AI tools helped us read, summarize and grade this evidence using our published grading method. AI and people both make mistakes, so a grade or summary here can be wrong, incomplete or out of date.',
    },
    {
      title: "What this can and can't tell you.",
      body: "If what you're feeling matches what's described here, these are possible reasons — not a diagnosis. Only a doctor who knows your health history can tell you what's going on and what's safe for you.",
    },
  ],
  seeDoctor: 'Please see a doctor. Use this page to prepare for that appointment, not to replace it.',
  urgent: 'If symptoms are severe or sudden, get urgent care now →',
  urgentLabel: 'Urgent help',
  lastCheckedLabel: 'Last checked',
  mistakeLabel: 'Spotted a mistake? Tell us',
} as const;

/** Next to a grade badge on verdicts, the evidence checker and comparison tables. */
export const AI_GRADE_NOTE = 'AI-assisted grade';

/** Comparison and review pages. */
export const PRICES_CHECKED = (date: string) =>
  `Prices and features checked on ${date} from each company's own site; confirm before you buy.`;

/** Homepage and hubs, near the hero. */
export const HOW_SITE_WORKS_LINK = "We are not doctors — here's how this site works";

/** "November 7, 2026" from "2026-11-07", independent of the server's time zone. */
export function formatCheckedDate(iso: string): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}
