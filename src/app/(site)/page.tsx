import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpenCheck,
  ClipboardCheck,
  ListChecks,
  MessageCircleQuestion,
  NotebookPen,
  Scale,
  Search,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import { SITE } from '@/lib/site/config';
import { buildMetadata } from '@/lib/seo/metadata';
import { getSiteData, CLUSTER_LABELS, isStaticTarget } from '@/lib/content/site-data';
import { GradeBadge } from '@/components/site/evidence';

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
  { label: 'Hot flashes', sub: 'Vasomotor surges', href: '/symptoms/hot-flashes/' },
  { label: 'Night sweats', sub: '3 a.m. waking', href: '/symptoms/night-sweats/' },
  { label: 'Brain fog', sub: 'Focus & recall', href: '/symptoms/brain-fog/' },
  { label: 'Fatigue', sub: 'Waking unrefreshed', href: '/symptoms/fatigue/' },
  { label: 'Joint pain', sub: 'Morning stiffness', href: '/symptoms/joint-pain/' },
  { label: 'Irritability', sub: 'Sudden anger', href: '/symptoms/irritability/' },
  { label: 'Irregular cycles', sub: 'Flow changes', href: '/perimenopause/irregular-periods/' },
  { label: 'Vaginal dryness', sub: 'Pain & discomfort', href: '/symptoms/vaginal-dryness/' },
];

const STAGES = [
  {
    step: '1',
    title: 'Perimenopause',
    desc: 'The transition years: fluctuating hormones, cycle shifts, and the earliest symptoms.',
    href: '/perimenopause/',
  },
  {
    step: '2',
    title: 'Menopause',
    desc: 'The milestone itself: 12 consecutive months without a period, and what to expect.',
    href: '/menopause/',
  },
  {
    step: '3',
    title: 'Postmenopause',
    desc: 'Life after the transition: protecting bone density, heart health, and tissue comfort.',
    href: '/postmenopause/',
  },
];

const CORE_TOOLS = [
  {
    title: 'Symptoms Checklist',
    desc: 'Review 35+ physical and emotional changes. Print or save your ticklist for your doctor.',
    href: '/tools/symptoms-checklist/',
    Icon: ListChecks,
  },
  {
    title: 'Symptom Diary & Doctor Report',
    desc: 'Track daily severity and triggers in under a minute. Generates a one-page appointment summary.',
    href: '/tools/symptom-tracker/',
    Icon: NotebookPen,
  },
  {
    title: 'Does It Work? Evidence Checker',
    desc: 'Supplements, diets, and therapies graded by clinical trial strength — including the ones that fail.',
    href: '/does-it-work/',
    Icon: Scale,
  },
  {
    title: 'Doctor Question Builder',
    desc: 'Turn your priorities into a conversation guide for 10-minute consultations and HRT discussions.',
    href: '/tools/treatment-questions/',
    Icon: MessageCircleQuestion,
  },
];

/** Quick searches under the hero search box: real pages, common questions. */
const QUICK_LINKS = [
  { label: 'Night sweats', href: '/symptoms/night-sweats/' },
  { label: 'HRT patch vs pill', href: '/treatments/hormone-therapy/patch-vs-pill/' },
  { label: '3 a.m. waking', href: '/symptoms/waking-at-3am/' },
  { label: 'Am I in perimenopause?', href: '/perimenopause/early-signs/' },
];

/**
 * Hero verdict stack and the verdicts strip below. Labels name the specific
 * use; the GRADE is never written here — it is read from each page's own
 * frontmatter at build time, so this visual can't drift from the content.
 */
const HERO_VERDICTS = [
  { href: '/treatments/nonhormonal/cbt-and-hypnosis/', label: 'CBT & clinical hypnosis for hot flashes' },
  { href: '/does-it-work/ashwagandha/', label: 'Ashwagandha for menopause symptoms' },
  { href: '/does-it-work/black-cohosh/', label: 'Black cohosh for hot flashes' },
];

const STRIP_VERDICTS = ['/does-it-work/exercise/', '/does-it-work/cooling-products/', '/does-it-work/cannabis-cbd/'];

export default function HomePage() {
  const { store, pages, byUrl } = getSiteData();
  // Link only to pages that exist in this build: code routes, or published content.
  const exists = (href: string) => isStaticTarget(href) || byUrl.has(href);
  const symptoms = TOP_SYMPTOMS.filter((s) => exists(s.href));
  const stages = STAGES.filter((st) => exists(st.href));
  const tools = CORE_TOOLS.filter((t) => exists(t.href));
  const quickLinks = QUICK_LINKS.filter((q) => exists(q.href));

  // Real, self-updating numbers: never typed in by hand.
  const guideCount = pages.filter((p) => p.fm.page_type !== 'legal' && p.fm.page_type !== 'about').length;
  const sourceCount = store.sources.size;

  const heroVerdicts = HERO_VERDICTS.map((v) => ({ ...v, page: byUrl.get(v.href) })).filter(
    (v) => v.page?.fm.evidence_grade && v.page.fm.evidence_grade !== 'per_option',
  );
  const stripVerdicts = STRIP_VERDICTS.map((href) => byUrl.get(href)).filter(
    (p) => p?.fm.evidence_grade && p.fm.evidence_grade !== 'per_option',
  );

  const recent = [...pages]
    .filter((p) => p.fm.page_type !== 'legal' && p.fm.page_type !== 'about')
    .sort((a, b) => b.fm.updated_at.localeCompare(a.fm.updated_at))
    .slice(0, 6);

  return (
    <div className="space-y-16 py-2 sm:space-y-20">
      {/* 1. Hero */}
      <section
        aria-labelledby="hero-heading"
        className="relative overflow-hidden rounded-3xl bg-[var(--color-accent)] px-5 py-10 text-white sm:px-10 sm:py-14"
      >
        {/* Decorative layers: soft light wash + concentric rings. Pure CSS/SVG, no images. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(52rem 30rem at 85% -20%, rgba(255,255,255,0.14), transparent 60%), radial-gradient(40rem 26rem at -10% 110%, rgba(0,0,0,0.18), transparent 55%)',
          }}
        />
        <svg
          aria-hidden="true"
          focusable="false"
          className="pointer-events-none absolute -right-28 -top-36 h-[30rem] w-[30rem] opacity-[0.1]"
          viewBox="0 0 400 400"
          fill="none"
        >
          {[70, 110, 150, 190].map((r) => (
            <circle key={r} cx="200" cy="200" r={r} stroke="#fff" strokeWidth="1.5" />
          ))}
        </svg>

        <div className="relative grid items-center gap-10 lg:grid-cols-[7fr_5fr]">
          <div className="space-y-6">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#cfe2da]">
              Independent · Evidence-graded · Private by design
            </p>
            <h1 id="hero-heading" className="font-serif text-3xl font-semibold leading-tight text-white sm:text-4xl lg:text-[2.75rem]">
              What&rsquo;s going on with your body right now?
            </h1>
            <p className="max-w-xl text-lg text-[#e4eeea] sm:text-xl">
              Clear answers to real perimenopause and menopause questions — every claim graded against the evidence,
              every source linked. No login to read, no sponsored verdicts, and no health data leaves your device.
            </p>

            {/* Lead search */}
            <form action="/search/" method="get">
              <div className="flex max-w-xl items-center gap-2 rounded-2xl bg-white p-2 shadow-lg shadow-black/15">
                <Search aria-hidden="true" className="ml-2 h-5 w-5 shrink-0 text-[var(--color-ink-muted)]" />
                <input
                  type="search"
                  name="q"
                  aria-label="Search this site"
                  placeholder="Search symptoms, treatments, questions…"
                  className="w-full bg-transparent px-1 py-2.5 text-base text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus:outline-hidden"
                  required
                />
                <button
                  type="submit"
                  className="tap shrink-0 rounded-xl bg-[var(--color-ink)] px-5 py-2.5 text-sm font-semibold text-white no-underline hover:opacity-90"
                >
                  Search
                </button>
              </div>
            </form>

            {quickLinks.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-[#cfe2da]">Popular:</span>
                {quickLinks.map((q) => (
                  <Link
                    key={q.href}
                    href={q.href}
                    className="tap rounded-full border border-white/30 bg-white/10 px-3.5 py-1 text-sm font-medium text-white no-underline hover:bg-white/20 focus-visible:outline-white"
                  >
                    {q.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Real verdicts, graded by the pages themselves */}
          {heroVerdicts.length > 0 && (
            <div className="relative mx-auto w-full max-w-md space-y-3 lg:mx-0">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#cfe2da]">
                From our evidence checker
              </p>
              {heroVerdicts.map((v, i) => (
                <Link
                  key={v.href}
                  href={v.href}
                  className={`tap block rounded-2xl bg-white p-4 text-[var(--color-ink)] no-underline shadow-lg shadow-black/20 transition-transform hover:-translate-y-0.5 focus-visible:outline-white ${
                    i === 0 ? 'lg:-rotate-1' : i === heroVerdicts.length - 1 ? 'lg:rotate-1' : ''
                  }`}
                >
                  <span className="flex w-full flex-wrap items-center justify-between gap-x-3 gap-y-2">
                    <span className="min-w-[11rem] flex-1 text-sm font-semibold leading-snug">{v.label}</span>
                    <GradeBadge grade={v.page!.fm.evidence_grade!} />
                  </span>
                </Link>
              ))}
              <p className="text-sm text-[#cfe2da]">
                Commissions never change a grade.{' '}
                <Link href="/evidence/how-we-grade/" className="font-semibold text-white underline focus-visible:outline-white">
                  How we grade
                </Link>
              </p>
            </div>
          )}
        </div>
      </section>

      {/* 2. Trust strip: real, build-time numbers */}
      <section aria-label="What you can rely on" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            Icon: BookOpenCheck,
            stat: `${guideCount} guides`,
            desc: 'written to answer one real question each',
          },
          {
            Icon: ShieldCheck,
            stat: `${sourceCount} sources`,
            desc: 'in our registry — every citation linked',
          },
          {
            Icon: Scale,
            stat: '5-level grading',
            desc: 'from Strong evidence to Harm concern',
          },
          {
            Icon: Smartphone,
            stat: 'On your device',
            desc: 'tracker data never reaches a server',
          },
        ].map(({ Icon, stat, desc }) => (
          <div
            key={stat}
            className="flex items-start gap-3 rounded-2xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)] p-4"
          >
            <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
              <Icon aria-hidden="true" className="h-5 w-5" />
            </span>
            <span>
              <span className="block font-serif text-lg font-semibold text-[var(--color-ink)]">{stat}</span>
              <span className="block text-sm leading-snug text-[var(--color-ink-muted)]">{desc}</span>
            </span>
          </div>
        ))}
      </section>

      {/* 3. Top symptoms */}
      <section aria-labelledby="top-symptoms" className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--color-accent)]">
              Start with what you feel
            </p>
            <h2 id="top-symptoms" className="mt-1 font-serif text-2xl font-semibold text-[var(--color-ink)] sm:text-3xl">
              Common symptoms, explained properly
            </h2>
          </div>
          <Link href="/symptoms/" className="tap text-sm font-semibold text-[var(--color-link)] underline">
            All symptoms →
          </Link>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {symptoms.map((s) => (
            <li key={s.href}>
              <Link
                href={s.href}
                className="tap group flex h-full items-center justify-between gap-2 rounded-2xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)] p-4 no-underline shadow-xs transition hover:-translate-y-0.5 hover:border-[var(--color-accent)] hover:shadow-md"
              >
                <span>
                  <span className="block font-semibold text-[var(--color-ink)] group-hover:text-[var(--color-accent)]">
                    {s.label}
                  </span>
                  <span className="block text-sm text-[var(--color-ink-muted)]">{s.sub}</span>
                </span>
                <ArrowRight
                  aria-hidden="true"
                  className="h-4 w-4 shrink-0 text-[var(--color-ink-muted)] transition-transform group-hover:translate-x-1 group-hover:text-[var(--color-accent)]"
                />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* 4. Stages: a three-step journey */}
      <section aria-labelledby="stages-heading" className="space-y-5">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--color-accent)]">
            Or start with where you are
          </p>
          <h2 id="stages-heading" className="mt-1 font-serif text-2xl font-semibold text-[var(--color-ink)] sm:text-3xl">
            The three stages of the transition
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {stages.map((st) => (
            <Link
              key={st.href}
              href={st.href}
              className="tap group flex h-full flex-col items-start gap-3 rounded-2xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)] p-5 no-underline shadow-xs transition hover:-translate-y-0.5 hover:border-[var(--color-accent)] hover:shadow-md"
            >
              <span className="flex w-full items-center gap-3" aria-hidden="true">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-accent)] font-serif text-lg font-bold text-white">
                  {st.step}
                </span>
                <span className="h-px flex-1 bg-[var(--color-rule)] group-hover:bg-[var(--color-accent)]" />
              </span>
              <span className="font-serif text-xl font-semibold text-[var(--color-ink)] group-hover:text-[var(--color-accent)]">
                {st.title}
              </span>
              <span className="text-sm leading-relaxed text-[var(--color-ink-muted)]">{st.desc}</span>
              <span className="mt-auto inline-flex items-center gap-1 pt-1 text-sm font-semibold text-[var(--color-link)]">
                Read the guide
                <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* 5. Tools */}
      <section aria-labelledby="tools-heading" className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--color-accent)]">
              Free · No account · Saved on your device
            </p>
            <h2 id="tools-heading" className="mt-1 font-serif text-2xl font-semibold text-[var(--color-ink)] sm:text-3xl">
              Tools that get you ready for the doctor
            </h2>
          </div>
          <Link href="/tools/" className="tap text-sm font-semibold text-[var(--color-link)] underline">
            All tools →
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {tools.map(({ title, desc, href, Icon }) => (
            <Link
              key={href}
              href={href}
              className="tap group flex h-full items-start gap-4 rounded-2xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)] p-5 no-underline shadow-xs transition hover:-translate-y-0.5 hover:border-[var(--color-accent)] hover:shadow-md"
            >
              <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-accent)] text-white transition-colors">
                <Icon aria-hidden="true" className="h-6 w-6" />
              </span>
              <span className="min-w-0">
                <span className="block font-serif text-lg font-semibold text-[var(--color-ink)] group-hover:text-[var(--color-accent)]">
                  {title}
                </span>
                <span className="mt-1 block text-sm leading-relaxed text-[var(--color-ink-muted)]">{desc}</span>
                <span className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-link)]">
                  Open tool
                  <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* 6. Verdicts strip: the differentiator */}
      {stripVerdicts.length > 0 && (
        <section
          aria-labelledby="verdicts-heading"
          className="space-y-5 rounded-3xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)] p-5 sm:p-8"
        >
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--color-accent)]">
                Evidence before commission
              </p>
              <h2 id="verdicts-heading" className="mt-1 font-serif text-2xl font-semibold text-[var(--color-ink)] sm:text-3xl">
                We say it plainly when something doesn&rsquo;t work
              </h2>
            </div>
            <Link href="/does-it-work/" className="tap text-sm font-semibold text-[var(--color-link)] underline">
              All verdicts →
            </Link>
          </div>
          <ul className="divide-y divide-[var(--color-rule)]">
            {stripVerdicts.map((p) => (
              <li key={p!.url}>
                <Link
                  href={p!.url}
                  className="tap group flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3.5 no-underline"
                >
                  <span className="min-w-0 flex-1 font-medium text-[var(--color-ink)] group-hover:text-[var(--color-accent)] group-hover:underline">
                    {p!.fm.title}
                  </span>
                  <GradeBadge grade={p!.fm.evidence_grade!} />
                </Link>
              </li>
            ))}
          </ul>
          <p className="text-sm text-[var(--color-ink-muted)]">
            Each grade covers the specific use, links its sources, and is set before we ever look at whether an
            affiliate programme exists.{' '}
            <Link href="/evidence/how-we-grade/" className="font-semibold text-[var(--color-link)] underline">
              Read the grading method
            </Link>
          </p>
        </section>
      )}

      {/* 7. Latest updates */}
      {recent.length > 0 && (
        <section aria-labelledby="recent-heading" className="space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 id="recent-heading" className="font-serif text-2xl font-semibold text-[var(--color-ink)] sm:text-3xl">
              Latest articles &amp; evidence updates
            </h2>
            <Link href="/evidence/updates/" className="tap text-sm font-semibold text-[var(--color-link)] underline">
              What&rsquo;s changed →
            </Link>
          </div>
          <ul className="divide-y divide-[var(--color-rule)] overflow-hidden rounded-2xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)]">
            {recent.map((p) => (
              <li key={p.url} className="flex flex-wrap items-baseline justify-between gap-2 p-4">
                <Link href={p.url} className="tap font-medium text-[var(--color-link)] underline">
                  {p.fm.title}
                </Link>
                <span className="rounded-full bg-[var(--color-paper)] px-2.5 py-0.5 text-xs text-[var(--color-ink-muted)]">
                  {CLUSTER_LABELS[p.fm.cluster] ?? p.fm.cluster}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 8. Appointment CTA band (free tools only) */}
      <section
        aria-labelledby="cta-heading"
        className="rounded-3xl bg-[var(--color-accent-soft)] px-5 py-8 sm:px-10 sm:py-10"
      >
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-xl space-y-2">
            <h2 id="cta-heading" className="font-serif text-2xl font-semibold text-[var(--color-ink)] sm:text-3xl">
              Walk into your next appointment prepared
            </h2>
            <p className="text-base text-[var(--color-ink-muted)]">
              Track two weeks of symptoms, then bring a one-page report and the right questions. Free, no account, and
              everything stays on your device.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/tools/symptom-tracker/"
              className="tap rounded-xl bg-[var(--color-accent)] px-6 py-3 font-semibold text-white no-underline shadow-sm hover:opacity-90"
            >
              Start the symptom tracker
            </Link>
            <Link
              href="/tools/treatment-questions/"
              className="tap rounded-xl border-2 border-[var(--color-accent)] px-6 py-3 font-semibold text-[var(--color-accent)] no-underline hover:bg-white"
            >
              Build doctor questions
            </Link>
          </div>
        </div>
      </section>

      {/* 9. Honest standards & urgent help */}
      <div className="grid gap-5 sm:grid-cols-2">
        <section
          aria-labelledby="standards-heading"
          className="space-y-3 rounded-2xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)] p-5 sm:p-6"
        >
          <h2 id="standards-heading" className="font-serif text-xl font-semibold text-[var(--color-ink)]">
            Our editorial rules
          </h2>
          <ul className="space-y-2.5 text-sm text-[var(--color-ink-muted)]">
            {[
              ['Every claim graded', 'against clinical trials and clinical consensus.'],
              ['No login for reading', 'all content and tools work without an account.'],
              ['Health data stays private', 'stored on your device only, never on our servers.'],
              ['Clear disclosures', 'commercial links are labelled and never alter a grade.'],
            ].map(([bold, rest]) => (
              <li key={bold} className="flex items-start gap-2.5">
                <ClipboardCheck aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-accent)]" />
                <span>
                  <strong className="text-[var(--color-ink)]">{bold}:</strong> {rest}
                </span>
              </li>
            ))}
          </ul>
          <p className="pt-1">
            <Link href="/evidence/editorial-policy/" className="tap text-sm font-semibold text-[var(--color-link)] underline">
              Read the full editorial policy →
            </Link>
          </p>
        </section>

        <section
          aria-labelledby="urgent"
          className="space-y-2 rounded-2xl border-2 border-[var(--color-urgent)] bg-[var(--color-urgent-soft)] p-5 sm:p-6"
        >
          <h2 id="urgent" className="font-serif text-xl font-semibold text-[var(--color-urgent)]">
            Need urgent help?
          </h2>
          <p className="text-sm">
            If you are experiencing severe depression, thoughts of self-harm, sudden chest pain, or heavy
            postmenopausal bleeding, please seek immediate medical evaluation.
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
