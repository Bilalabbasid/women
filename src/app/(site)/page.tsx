import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { SITE } from '@/lib/site/config';
import { buildMetadata } from '@/lib/seo/metadata';
import { getSiteData, CLUSTER_LABELS, isStaticTarget } from '@/lib/content/site-data';
import { getGrade } from '@/lib/grades/registry';
import type { EvidenceGrade } from '@/lib/content/schema';
import { HOW_SITE_WORKS_LINK } from '@/lib/site/honesty';
import { RecentEvidenceUpdates } from '@/components/site/recent-updates';
import { LastLogNote } from '@/components/site/last-log-note';
import { SearchBox } from '@/components/site/search-box';
import { HomeSymptomPicker, type PickerChip } from '@/components/site/home-symptom-picker';
import { GradeMeter } from '@/components/ui/grade';
import { IlloBody, IlloDoctor, IlloMind, IlloSleep } from '@/components/ui/illustrations';
import { isToolLive } from '@/lib/tools/logic';

export const metadata: Metadata = {
  ...buildMetadata({
    // Matches how people search ("evidence-based menopause guide"); the homepage ranks for it.
    title: `${SITE.name}: evidence-based menopause guide`,
    description:
      'Plain answers on perimenopause and menopause symptoms, HRT and other treatments, each graded by the evidence and linked to its sources. Free private tools too.',
    path: '/',
  }),
};

/**
 * "Tap what you're feeling": everyday words → the guides that answer them.
 * Hrefs are checked against this build on the server; titles come from the pages.
 */
const FEELINGS: Array<{ id: string; label: string; hrefs: string[] }> = [
  { id: 'hot-night', label: 'Hot at night', hrefs: ['/symptoms/night-sweats/', '/care/sleepwear-for-night-sweats/', '/symptoms/hot-flashes/'] },
  { id: 'cant-sleep', label: 'Can’t sleep', hrefs: ['/symptoms/insomnia/', '/symptoms/waking-at-3am/', '/symptoms/night-sweats/'] },
  { id: 'hot-flashes', label: 'Hot flashes', hrefs: ['/symptoms/hot-flashes/', '/treatments/nonhormonal/', '/treatments/hormone-therapy/'] },
  { id: 'angry', label: 'Angry all the time', hrefs: ['/symptoms/irritability/', '/symptoms/anxiety/', '/symptoms/depression/'] },
  { id: 'low', label: 'Low or anxious', hrefs: ['/symptoms/anxiety/', '/symptoms/depression/', '/symptoms/panic-attacks/'] },
  { id: 'fog', label: 'Brain fog', hrefs: ['/symptoms/brain-fog/', '/symptoms/memory-problems/', '/symptoms/fatigue/'] },
  { id: 'tired', label: 'Tired all the time', hrefs: ['/symptoms/fatigue/', '/symptoms/insomnia/', '/symptoms/waking-at-3am/'] },
  { id: 'joints', label: 'Aching joints', hrefs: ['/symptoms/joint-pain/', '/symptoms/frozen-shoulder/'] },
  { id: 'periods', label: 'Heavy or odd periods', hrefs: ['/perimenopause/heavy-periods/', '/perimenopause/irregular-periods/', '/perimenopause/when-to-see-a-doctor/'] },
  { id: 'heart', label: 'Racing heart', hrefs: ['/symptoms/heart-palpitations/', '/symptoms/panic-attacks/', '/symptoms/anxiety/'] },
  { id: 'dry', label: 'Sore or dry down there', hrefs: ['/symptoms/vaginal-dryness/', '/symptoms/painful-sex/', '/treatments/hormone-therapy/vaginal-estrogen/'] },
  { id: 'bladder', label: 'Rushing to pee', hrefs: ['/symptoms/bladder-urgency/', '/symptoms/incontinence/', '/symptoms/recurrent-utis/'] },
];

/**
 * "Start here" cards: { title, body, href }. Local for now and isolated here,
 * so the nextecom session's src/lib/site/start-here.ts can replace it later.
 * Illustrations are chosen by position, not stored with the data.
 */
const START_HERE: Array<{ title: string; body: string; href: string }> = [
  { title: 'I think it’s starting', body: 'The early signs of perimenopause, and how to tell.', href: '/perimenopause/early-signs/' },
  { title: 'I’m struggling with symptoms', body: 'Every symptom explained, with what helps tonight.', href: '/symptoms/' },
  { title: 'I want to talk to my doctor about HRT', body: 'Whether hormone therapy fits you, and what to ask.', href: '/treatments/hormone-therapy/is-it-right-for-me/' },
  { title: 'I’ve had cancer or surgery', body: 'Guides for breast cancer, surgical and early menopause.', href: '/groups/' },
];
const START_ILLOS = [IlloSleep, IlloMind, IlloDoctor, IlloBody];

const TOOLS = [
  { title: 'Symptoms checklist', desc: 'Tick what you’ve noticed, then print it for your doctor.', href: '/tools/symptoms-checklist/' },
  { title: 'Symptom tracker', desc: 'Log a day in under a minute; get a one-page report.', href: '/tools/symptom-tracker/' },
  { title: 'Does it work?', desc: 'Remedies and treatments, graded, including the ones that fail.', href: '/tools/does-it-work-checker/' },
  { title: 'Doctor questions', desc: 'Turn your worries into questions for a 10-minute visit.', href: '/tools/treatment-questions/' },
];

/** Grades come from the one grade registry; labels name the specific use. */
const VERDICTS = [
  { id: 'cbt-hypnosis-vms', label: 'CBT and hypnosis', use: 'for hot flashes' },
  { id: 'ashwagandha', label: 'Ashwagandha', use: 'for menopause symptoms' },
  { id: 'black-cohosh-vms', label: 'Black cohosh', use: 'for hot flashes' },
];

/** Quick searches under the search box: real pages, common questions. */
const QUICK_LINKS = [
  { label: 'Night sweats', href: '/symptoms/night-sweats/' },
  { label: 'HRT patch vs pill', href: '/treatments/hormone-therapy/patch-vs-pill/' },
  { label: '3 a.m. waking', href: '/symptoms/waking-at-3am/' },
  { label: 'Am I in perimenopause?', href: '/perimenopause/early-signs/' },
];

const QUIZ_HREF = '/tools/stage-guide/';

/** "Night Sweats: How to Sleep Cooler Tonight" → "Night Sweats". */
const shortTitle = (t: string) => t.split(/:\s/)[0];

export default function HomePage() {
  const { store, pages, byUrl } = getSiteData();
  // Link only to pages that exist in this build: code routes, or published content.
  const exists = (href: string) => isStaticTarget(href) || byUrl.has(href);
  const titleOf = (href: string) => {
    const p = byUrl.get(href);
    return p ? shortTitle(p.fm.title) : null;
  };

  const chips: PickerChip[] = FEELINGS.map((f) => ({
    id: f.id,
    label: f.label,
    guides: f.hrefs
      .filter(exists)
      .map((href) => ({ href, title: titleOf(href) }))
      .filter((g): g is { href: string; title: string } => !!g.title),
  })).filter((c) => c.guides.length > 0);

  const startHere = START_HERE.map((s, i) => ({ ...s, Illo: START_ILLOS[i % START_ILLOS.length] })).filter((s) => exists(s.href));
  const tools = TOOLS.filter((t) => exists(t.href));
  const quickLinks = QUICK_LINKS.filter((q) => exists(q.href));
  const quizLive = exists(QUIZ_HREF);
  const trackerLive = isToolLive('symptom-tracker');

  const verdicts = VERDICTS.map((v) => {
    const entry = getGrade(v.id);
    const href = entry?.pages?.find(exists);
    return entry && href ? { ...v, grade: entry.grade as EvidenceGrade, href } : null;
  }).filter((v): v is NonNullable<typeof v> => !!v);

  // Real, self-updating numbers: never typed in by hand.
  const guideCount = pages.filter((p) => p.fm.page_type !== 'legal' && p.fm.page_type !== 'about').length;
  const sourceCount = store.sources.size;
  const verdictCount = pages.filter(
    (p) => p.fm.page_type === 'does_it_work' && p.fm.evidence_grade && p.fm.evidence_grade !== 'per_option',
  ).length;

  const recent = [...pages]
    .filter((p) => p.fm.page_type !== 'legal' && p.fm.page_type !== 'about')
    .sort((a, b) => b.fm.updated_at.localeCompare(a.fm.updated_at))
    .slice(0, 6);

  return (
    <div className="space-y-16 pb-2 sm:space-y-20">
      {/* 1. Hero: compact, above-the-fold teal banner with search and 3D evidence cards */}
      <section
        aria-labelledby="hero-heading"
        className="w-full rounded-2xl sm:rounded-3xl bg-[#1F5A4C] p-6 sm:p-7 lg:p-8 text-[#F7F6F2] shadow-xl relative overflow-hidden"
        style={{
          backgroundImage: 'radial-gradient(circle at 85% 15%, rgba(127, 195, 171, 0.22) 0%, transparent 60%), radial-gradient(circle at 10% 90%, rgba(23, 69, 56, 0.5) 0%, transparent 50%)',
        }}
      >
        <div className="relative z-10 grid gap-6 lg:grid-cols-[minmax(0,1.28fr)_minmax(0,1fr)] lg:items-center lg:gap-10">
          <div className="space-y-3.5">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#174538]/85 backdrop-blur-sm border border-[#2C6B5C] px-3 py-1 text-xs font-semibold tracking-wider uppercase text-[#A3D9C9]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#7FC3AB] animate-pulse" />
              Independent · Evidence-Graded · Private by design
            </div>
            <h1 id="hero-heading" className="max-w-[16ch] text-2xl sm:text-3xl lg:text-[2.65rem] leading-[1.1] tracking-[-0.025em] text-[#FCFAF5] font-serif font-bold">
              What&rsquo;s going on with your body right now?
            </h1>
            <p className="max-w-xl text-sm sm:text-base leading-relaxed text-[#D8E6DF]">
              Clear answers to real perimenopause and menopause questions &mdash; every claim graded against clinical evidence, every source linked. No login to read, no sponsored verdicts, and no health data leaves your device.
            </p>

            {/* Direct private search bar */}
            <form
              action="/search/"
              method="get"
              role="search"
              className="relative flex items-center max-w-xl rounded-xl bg-[#FCFAF5] shadow-md border border-[#E5DFD0] p-1 transition-all duration-200 focus-within:ring-2 focus-within:ring-[#A3D9C9] focus-within:border-transparent"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#4A5350" strokeWidth="2.2" strokeLinecap="round" className="ml-2.5 mr-1.5 shrink-0 pointer-events-none" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <input
                type="search"
                name="q"
                placeholder="Search symptoms, treatments, questions…"
                className="w-full bg-transparent text-[#1D2422] text-sm sm:text-base outline-none placeholder:text-[#6B726E] py-1.5 px-1 font-sans"
              />
              <button
                type="submit"
                className="shrink-0 bg-[#1F5A4C] hover:bg-[#174538] text-[#FCFAF5] font-bold text-xs sm:text-sm px-4 py-2 rounded-lg transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
              >
                Search
              </button>
            </form>

            {/* Popular quick links */}
            {quickLinks.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#D8E6DF] pt-0.5">
                <span className="font-semibold text-[#A3D9C9]">Popular:</span>
                {quickLinks.map((q) => (
                  <Link
                    key={q.href}
                    href={q.href}
                    className="rounded-full bg-[#174538]/70 hover:bg-[#174538] border border-[#2C6B5C] hover:border-[#7FC3AB] px-2.5 py-0.5 text-xs text-[#FCFAF5] transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0"
                  >
                    {q.label}
                  </Link>
                ))}
              </div>
            )}

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              {quizLive && (
                <Link
                  href={QUIZ_HREF}
                  className="btn bg-[#FCFAF5] text-[#1F5A4C] hover:bg-[#FFFFFF] hover:shadow-lg font-bold border-0 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 text-sm py-2 px-4 rounded-xl"
                >
                  Where am I in the transition?
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </Link>
              )}
              {trackerLive && (
                <Link
                  href="/app/today/"
                  className="btn text-[#FCFAF5] bg-[#174538]/70 hover:bg-[#174538] border border-[#3A7E6E] backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 text-sm py-2 px-3.5 rounded-xl"
                >
                  Start tracking
                </Link>
              )}
            </div>

            {trackerLive && (
              <div className="[&_a]:text-[#A3D9C9] [&_p]:bg-[#174538]/90 [&_p]:backdrop-blur-sm [&_p]:text-[#FCFAF5] [&_p]:border [&_p]:border-[#2C6B5C] [&_p]:rounded-xl [&_p]:py-1.5 [&_p]:px-3 [&_p]:text-xs">
                <LastLogNote />
              </div>
            )}

            <p className="notice-line text-[#D2E4DC] text-xs pt-0.5">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" className="shrink-0 text-[#A3D9C9]">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 11v5M12 7.5v.01" />
              </svg>
              <Link href="/about/" className="text-[#A3D9C9] font-medium hover:underline hover:text-[#FCFAF5] transition-colors">{HOW_SITE_WORKS_LINK}</Link>
            </p>
          </div>

          {/* Verdicts: compact, elegant 3D white cards */}
          {verdicts.length > 0 && (
            <aside aria-labelledby="verdicts-heading" className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h2 id="verdicts-heading" className="text-xs font-bold tracking-widest uppercase text-[#A3D9C9]">
                  From our evidence checker
                </h2>
              </div>
              <ul className="grid gap-2 sm:gap-2.5">
                {verdicts.map((v) => (
                  <li key={v.id}>
                    <Link
                      href={v.href}
                      className="group bg-[#FCFAF5] text-[#1D2422] rounded-xl p-3 sm:p-3.5 shadow-md border border-[#E5DFD0] hover:border-[#7FC3AB] hover:shadow-xl transition-all duration-200 hover:-translate-y-1 block active:translate-y-0"
                    >
                      <span className="font-bold text-sm leading-snug block mb-1 group-hover:text-[#1F5A4C] transition-colors">
                        {v.label} <span className="font-normal text-[#4A5350] text-xs">{v.use}</span>
                      </span>
                      <GradeMeter grade={v.grade} use={v.use} explain={false} />
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-[#D2E4DC] pt-0.5">
                <span>
                  {verdictCount} remedies graded · {sourceCount} sources linked
                </span>
                <Link href="/does-it-work/" className="text-[#A3D9C9] font-bold hover:underline hover:text-[#FCFAF5] transition-colors inline-flex items-center gap-1">
                  All verdicts <span>&rarr;</span>
                </Link>
              </p>
            </aside>
          )}
        </div>
      </section>

      {/* 2. Tap what you're feeling */}
      {chips.length > 0 && (
        <section aria-labelledby="feelings-heading" className="rounded-2xl border border-[var(--rule)] bg-[var(--paper-raised)] p-5 sm:p-6 shadow-sm space-y-4">
          <div className="section-header-teal">
            <div>
              <p className="kicker">Tap what you&rsquo;re feeling</p>
              <h2 id="feelings-heading" className="text-[length:var(--fs-h3)] font-serif font-bold text-[#FCFAF5]">
                Everyday words to clinical guides
              </h2>
            </div>
          </div>
          <HomeSymptomPicker chips={chips} />
        </section>
      )}

      {/* 3. Start here */}
      {startHere.length > 0 && (
        <section aria-labelledby="start-heading" className="space-y-4">
          <div className="section-header-teal">
            <div>
              <p className="kicker">Not sure where to begin?</p>
              <h2 id="start-heading" className="text-[length:var(--fs-h2)] font-serif font-bold text-[#FCFAF5] tracking-tight">
                Start here
              </h2>
            </div>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {startHere.map(({ title, body, href, Illo }) => (
              <li key={title}>
                <Link
                  href={href}
                  className="card group grid h-full content-start gap-3 p-5 rounded-2xl border border-[var(--rule)] bg-[var(--paper-raised)] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-[var(--accent)]"
                >
                  <div className="w-12 h-12 rounded-xl bg-[var(--accent-soft)] grid place-items-center transition-transform duration-300 group-hover:scale-105">
                    <Illo className="h-8 w-8 text-[var(--accent)]" />
                  </div>
                  <span className="font-serif text-[1.25rem] font-bold leading-snug group-hover:text-[var(--accent)] transition-colors">
                    {title}
                  </span>
                  <span className="text-[1rem] leading-relaxed text-[var(--ink-muted)]">
                    {body}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 4. Tools */}
      {tools.length > 0 && (
        <section aria-labelledby="tools-heading" className="space-y-4">
          <div className="section-header-teal justify-between">
            <div>
              <p className="kicker">Free · no account · saved on your device</p>
              <h2 id="tools-heading" className="text-[length:var(--fs-h2)] font-serif font-bold text-[#FCFAF5] tracking-tight">
                Get ready for your appointment
              </h2>
            </div>
            <Link href="/tools/" className="text-[#A3D9C9] hover:text-[#FCFAF5] font-bold text-sm underline transition-colors">
              All tools &rarr;
            </Link>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {tools.map((t) => (
              <li key={t.href}>
                <Link
                  href={t.href}
                  className="card group grid h-full content-start gap-2.5 p-5 rounded-2xl border border-[var(--rule)] bg-[var(--paper-raised)] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-[var(--accent)]"
                >
                  <span className="font-bold text-[1.15rem] leading-snug group-hover:text-[var(--accent)] transition-colors">
                    {t.title}
                  </span>
                  <span className="text-[1rem] leading-relaxed text-[var(--ink-muted)]">
                    {t.desc}
                  </span>
                  <span className="link link-arrow mt-2 text-[0.95rem] inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    Open
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <RecentEvidenceUpdates />

      {/* 5. Latest updates */}
      {recent.length > 0 && (
        <section aria-labelledby="recent-heading" className="space-y-4">
          <div className="section-header-teal justify-between">
            <h2 id="recent-heading" className="text-[length:var(--fs-h3)] font-serif font-bold text-[#FCFAF5]">
              Recently updated guides
            </h2>
            <Link href="/evidence/updates/" className="text-[#A3D9C9] hover:text-[#FCFAF5] font-bold text-sm underline transition-colors">
              What&rsquo;s changed &rarr;
            </Link>
          </div>
          <ul className="row-list">
            {recent.map((p) => (
              <li key={p.url}>
                <Link href={p.url} className="row">
                  <span className="row-main">
                    <span className="row-title block">{p.fm.title}</span>
                    <span className="row-meta block">{CLUSTER_LABELS[p.fm.cluster] ?? p.fm.cluster}</span>
                  </span>
                  <span aria-hidden="true" className="text-[var(--ink-muted)]">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 6. Honest standards & urgent help */}
      <div className="grid gap-5 sm:grid-cols-2">
        <section aria-labelledby="standards-heading" className="notice content-start">
          <span className="notice-stamp" aria-hidden="true">
            §
          </span>
          <h2 id="standards-heading" className="font-serif text-xl font-semibold">
            Our editorial rules
          </h2>
          <div className="space-y-3">
            <ul className="space-y-2 text-[1.0625rem]">
              {[
                ['Every claim graded', `against clinical trials and guidelines (${guideCount} guides so far).`],
                ['No login for reading', 'all content and tools work without an account.'],
                ['Health data stays private', 'stored on your device only, never on our servers.'],
                ['Free and independent', 'no ads, no affiliate links and no sponsors.'],
              ].map(([bold, rest]) => (
                <li key={bold}>
                  <strong>{bold}:</strong> {rest}
                </li>
              ))}
            </ul>
            <p>
              <Link href="/evidence/editorial-policy/" className="link link-arrow">
                Read the editorial policy
              </Link>
            </p>
          </div>
        </section>

        <section aria-labelledby="urgent" className="urgent-block content-start">
          <h2 id="urgent" className="urgent-block-title font-sans text-[1.15rem]">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 3 2.5 20h19L12 3Z" />
              <path d="M12 10v4.5M12 17.5v.01" />
            </svg>
            Need urgent help?
          </h2>
          <p>
            Severe depression, thoughts of harming yourself, sudden chest pain, or heavy bleeding after your periods
            have stopped: get medical help now.
          </p>
          <Link href="/urgent-help/" className="btn btn-danger justify-self-start">
            Emergency numbers and crisis lines
          </Link>
        </section>
      </div>
    </div>
  );
}
