import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE } from '@/lib/site/config';
import { buildMetadata } from '@/lib/seo/metadata';
import { getSiteData, CLUSTER_LABELS } from '@/lib/content/site-data';

export const metadata: Metadata = {
  ...buildMetadata({
    title: `${SITE.name}: ${SITE.tagline}`,
    description:
      'Find clear answers about perimenopause, menopause symptoms, evidence-graded treatments, and doctor questions. Fast, private, and independent.',
    path: '/',
  }),
  other: {
    'awin-verification': 'Awin',
  },
};

const TOP_SYMPTOMS = [
  { label: 'Hot flashes (vasomotor)', href: '/symptoms/hot-flashes/' },
  { label: 'Night sweats & 3 a.m. waking', href: '/symptoms/night-sweats/' },
  { label: 'Brain fog & forgetfulness', href: '/symptoms/brain-fog/' },
  { label: 'Fatigue & waking unrefreshed', href: '/symptoms/fatigue/' },
  { label: 'Joint aches & morning stiffness', href: '/symptoms/joint-pain/' },
  { label: 'Sudden anger & mood changes', href: '/symptoms/mood-changes/' },
  { label: 'Irregular cycles & flow changes', href: '/symptoms/irregular-periods/' },
  { label: 'Vaginal dryness & discomfort', href: '/symptoms/vaginal-dryness/' },
];

const STAGES = [
  {
    title: 'Perimenopause',
    desc: 'The transition years: fluctuating hormones, cycle shifts, and early symptoms.',
    href: '/perimenopause/',
  },
  {
    title: 'Menopause',
    desc: 'The milestone: 12 consecutive months without a period, and what to expect.',
    href: '/menopause/',
  },
  {
    title: 'Postmenopause',
    desc: 'Life after the transition: protecting bone density, cardiovascular health, and tissue comfort.',
    href: '/postmenopause/',
  },
];

const CORE_TOOLS = [
  {
    title: 'Perimenopause Symptoms Checklist',
    desc: 'Review 35+ physical and emotional changes. Print or save your ticklist for your doctor.',
    href: '/tools/symptoms-checklist/',
  },
  {
    title: 'Two-Week Symptom Diary & Report',
    desc: 'Track daily severity and triggers in under a minute. Generates a one-page clinical appointment summary.',
    href: '/tools/symptom-tracker/',
  },
  {
    title: 'Does It Work? Evidence Checker',
    desc: 'Independent reviews of popular supplements, diets, and non-hormonal therapies graded by clinical trial strength.',
    href: '/does-it-work/',
  },
  {
    title: 'Doctor Appointment Question Guide',
    desc: 'Personalized conversation guide for 10-minute doctor consultations, second opinions, and HRT discussions.',
    href: '/tools/treatment-questions/',
  },
];

export default function HomePage() {
  const { pages } = getSiteData();
  const recent = [...pages]
    .filter((p) => p.fm.page_type !== 'legal')
    .sort((a, b) => b.fm.updated_at.localeCompare(a.fm.updated_at))
    .slice(0, 6);

  return (
    <div className="space-y-16 py-4">
      {/* 1. Website Hero with Clear Search Prompt */}
      <section className="max-w-3xl space-y-5">
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight text-[var(--color-ink)]">
          What&apos;s going on with your body right now?
        </h1>
        <p className="text-lg sm:text-xl text-[var(--color-ink-muted)]">
          Clear, evidence-graded answers to real perimenopause and menopause questions. No login required to read,
          no sponsored verdicts, and no health data leaves your device.
        </p>

        {/* Lead Search Box */}
        <form action="/search/" method="get" className="pt-2">
          <div className="flex max-w-xl items-center gap-2 rounded-xl border-2 border-[var(--color-rule)] bg-[var(--color-paper-raised)] p-1.5 focus-within:border-[var(--color-accent)]">
            <input
              type="search"
              name="q"
              placeholder="Search symptoms, treatments, or questions (e.g. night sweats, HRT risks, 3 a.m. waking)..."
              className="w-full bg-transparent px-3 py-2 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus:outline-hidden"
              required
            />
            <button
              type="submit"
              className="tap rounded-lg bg-[var(--color-ink)] px-5 py-2 text-sm font-semibold text-white no-underline hover:opacity-90"
            >
              Search
            </button>
          </div>
        </form>
      </section>

      {/* 2. Top Symptoms Grid */}
      <section aria-labelledby="top-symptoms" className="space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="top-symptoms" className="font-serif text-2xl font-semibold text-[var(--color-ink)]">
            Common symptoms
          </h2>
          <Link href="/symptoms/" className="tap text-sm font-semibold text-[var(--color-link)] underline">
            View all symptoms →
          </Link>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
          {TOP_SYMPTOMS.map((s) => (
            <li key={s.href}>
              <Link
                href={s.href}
                className="tap block rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)] p-4 font-medium text-[var(--color-ink)] hover:border-[var(--color-accent)] hover:text-[var(--color-link)]"
              >
                {s.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* 3. Stages of the Transition */}
      <section aria-labelledby="stages-heading" className="space-y-4">
        <h2 id="stages-heading" className="font-serif text-2xl font-semibold text-[var(--color-ink)]">
          Explore by stage
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {STAGES.map((st) => (
            <div
              key={st.href}
              className="rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)] p-5 space-y-2 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <h3 className="font-serif text-xl font-semibold text-[var(--color-ink)]">{st.title}</h3>
                <p className="text-sm text-[var(--color-ink-muted)]">{st.desc}</p>
              </div>
              <div className="pt-3">
                <Link href={st.href} className="tap text-sm font-semibold text-[var(--color-link)] underline">
                  Read {st.title.toLowerCase()} guide →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Free, Private Decision Tools */}
      <section aria-labelledby="tools-heading" className="space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="tools-heading" className="font-serif text-2xl font-semibold text-[var(--color-ink)]">
            Independent, on-device tools
          </h2>
          <Link href="/tools/" className="tap text-sm font-semibold text-[var(--color-link)] underline">
            All tools →
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {CORE_TOOLS.map((t) => (
            <div
              key={t.href}
              className="rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)] p-5 space-y-2 flex flex-col justify-between"
            >
              <div className="space-y-1.5">
                <h3 className="font-serif text-lg font-semibold text-[var(--color-ink)]">{t.title}</h3>
                <p className="text-sm text-[var(--color-ink-muted)]">{t.desc}</p>
              </div>
              <div className="pt-2">
                <Link href={t.href} className="tap text-sm font-semibold text-[var(--color-link)] underline">
                  Open tool →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Recently Updated Evidence */}
      {recent.length > 0 && (
        <section aria-labelledby="recent-heading" className="space-y-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="recent-heading" className="font-serif text-2xl font-semibold text-[var(--color-ink)]">
              Latest articles & evidence updates
            </h2>
            <Link href="/evidence/updates/" className="tap text-sm font-semibold text-[var(--color-link)] underline">
              What&apos;s changed log →
            </Link>
          </div>
          <ul className="divide-y divide-[var(--color-rule)] rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)]">
            {recent.map((p) => (
              <li key={p.url} className="p-4 flex flex-wrap items-baseline justify-between gap-2">
                <Link href={p.url} className="tap font-medium text-[var(--color-link)] underline">
                  {p.fm.title}
                </Link>
                <span className="text-xs text-[var(--color-ink-muted)]">
                  {CLUSTER_LABELS[p.fm.cluster] ?? p.fm.cluster} · Updated {p.fm.updated_at}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 6. Honest Standards & Urgent Help */}
      <div className="grid gap-6 sm:grid-cols-2">
        <section aria-labelledby="standards-heading" className="rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)] p-5 space-y-2">
          <h2 id="standards-heading" className="font-serif text-lg font-semibold text-[var(--color-ink)]">
            Our editorial rules
          </h2>
          <ul className="text-sm text-[var(--color-ink-muted)] space-y-1.5 list-disc pl-4">
            <li><strong>Every claim graded:</strong> evidence from clinical trials and clinical consensus.</li>
            <li><strong>No login for reading:</strong> all content and interactive tools work without an account.</li>
            <li><strong>Health data stays private:</strong> stored on your device only.</li>
            <li><strong>Clear disclosures:</strong> commercial links are labelled and never alter evidence ratings.</li>
          </ul>
        </section>

        <section aria-labelledby="urgent" className="rounded-xl border-2 border-[var(--color-urgent)] bg-[var(--color-urgent-soft)] p-5 space-y-2">
          <h2 id="urgent" className="font-serif text-lg font-semibold text-[var(--color-urgent)]">
            Need urgent help?
          </h2>
          <p className="text-sm">
            If you are experiencing severe depression, thoughts of self-harm, sudden chest pain, or heavy postmenopausal bleeding, please seek immediate medical evaluation.
          </p>
          <p className="pt-1">
            <Link href="/urgent-help/" className="tap text-sm font-bold text-[var(--color-urgent)] underline">
              Emergency numbers and crisis lines →
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
