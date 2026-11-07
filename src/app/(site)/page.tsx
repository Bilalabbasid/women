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
    title: `${SITE.name}: ${SITE.tagline}`,
    description:
      'Find clear answers about perimenopause, menopause symptoms, evidence-graded treatments, and doctor questions. Fast, private, and independent.',
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
      {/* 1. Hero: the question, the chip picker and the quiz first. Calm, editorial, no banner. */}
      <section aria-labelledby="hero-heading" className="-mt-4 sm:mt-0">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:items-start lg:gap-14">
          <div className="space-y-5">
            <h1 id="hero-heading" className="max-w-[14ch] text-[length:var(--fs-display)] leading-[1.05] tracking-[-0.02em]">
              What&rsquo;s going on with your body right now?
            </h1>
            <p className="max-w-xl text-[length:var(--fs-lead)] leading-snug text-[var(--ink-muted)]">
              Plain answers, graded against the evidence. Free, private, no sign-up.
            </p>

            {chips.length > 0 && <HomeSymptomPicker chips={chips} />}

            <div className="flex flex-wrap items-center gap-x-5 gap-y-3 pt-1">
              {quizLive && (
                <Link href={QUIZ_HREF} className="btn btn-primary btn-lg">
                  Where am I in the transition?
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </Link>
              )}
              {trackerLive && (
                <Link href="/app/today/" className="btn btn-quiet">
                  Start tracking
                </Link>
              )}
            </div>

            {trackerLive && (
              <div className="[&_a]:text-[var(--link)] [&_p]:bg-[var(--accent-soft)] [&_p]:text-[var(--ink)]">
                <LastLogNote />
              </div>
            )}

            <p className="notice-line">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" className="mt-0.5 shrink-0 text-[var(--accent)]">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 11v5M12 7.5v.01" />
              </svg>
              <Link href="/about/">{HOW_SITE_WORKS_LINK}</Link>
            </p>
          </div>

          {/* Verdicts: graded plainly, from the grade registry. */}
          {verdicts.length > 0 && (
            <aside aria-labelledby="verdicts-heading" className="space-y-3 lg:pt-3">
              <h2 id="verdicts-heading" className="kicker">
                We say it plainly when something doesn&rsquo;t work
              </h2>
              <ul className="grid gap-3">
                {verdicts.map((v) => (
                  <li key={v.id}>
                    <Link href={v.href} className={`card verdict-card g-${v.grade}`}>
                      <span className="font-bold leading-snug">
                        {v.label} <span className="font-normal text-[var(--ink-muted)]">{v.use}</span>
                      </span>
                      <GradeMeter grade={v.grade} use={v.use} explain={false} />
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="flex flex-wrap gap-x-4 gap-y-1 text-[1rem] text-[var(--ink-muted)]">
                <span>
                  {verdictCount} remedies graded · {sourceCount} sources linked
                </span>
                <Link href="/does-it-work/" className="link link-arrow">
                  All verdicts
                </Link>
              </p>
            </aside>
          )}
        </div>
      </section>

      {/* 2. Start here */}
      {startHere.length > 0 && (
        <section aria-labelledby="start-heading" className="space-y-5">
          <div>
            <p className="kicker">Not sure where to begin?</p>
            <h2 id="start-heading" className="mt-1 text-[length:var(--fs-h2)]">
              Start here
            </h2>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {startHere.map(({ title, body, href, Illo }) => (
              <li key={title}>
                <Link href={href} className="card grid h-full content-start gap-2">
                  <Illo className="h-14 w-14" />
                  <span className="mt-1 font-serif text-[1.3rem] font-semibold leading-snug">{title}</span>
                  <span className="text-[1.0625rem] leading-snug text-[var(--ink-muted)]">{body}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 3. Search, for when she already knows what to ask */}
      <section aria-labelledby="search-heading" className="space-y-4 border-y border-[var(--rule)] py-8">
        <h2 id="search-heading" className="text-[length:var(--fs-h3)]">
          Or ask in your own words
        </h2>
        <div className="max-w-2xl">
          <Suspense fallback={<div className="h-16 rounded-xl bg-[var(--color-paper-raised)]" />}>
            <SearchBox suggestions={quickLinks} />
          </Suspense>
        </div>
      </section>

      {/* 4. Tools */}
      {tools.length > 0 && (
        <section aria-labelledby="tools-heading" className="space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="kicker">Free · no account · saved on your device</p>
              <h2 id="tools-heading" className="mt-1 text-[length:var(--fs-h2)]">
                Get ready for your appointment
              </h2>
            </div>
            <Link href="/tools/" className="link link-arrow">
              All tools
            </Link>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {tools.map((t) => (
              <li key={t.href}>
                <Link href={t.href} className="card grid h-full content-start gap-1.5">
                  <span className="font-bold">{t.title}</span>
                  <span className="text-[1.0625rem] leading-snug text-[var(--ink-muted)]">{t.desc}</span>
                  <span className="link link-arrow mt-1 text-[1rem]">Open</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <RecentEvidenceUpdates />

      {/* 5. Latest updates */}
      {recent.length > 0 && (
        <section aria-labelledby="recent-heading" className="space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 id="recent-heading" className="text-[length:var(--fs-h3)]">
              Recently updated guides
            </h2>
            <Link href="/evidence/updates/" className="link link-arrow">
              What&rsquo;s changed
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
