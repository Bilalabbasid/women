import type { Metadata } from 'next';
import Link from 'next/link';
import { BrandLogo } from '@/components/site/site-chrome';
import { HonestyNotice } from '@/components/site/honesty-notice';
import { AskDoctor, Callout } from '@/components/ui/callout';
import { Cite } from '@/components/ui/citation';
import { DisplayControls, TextSizeControl, ThemeControl } from '@/components/ui/display-controls';
import { GradeBadge, GradeExplainers, GradeMeter, GRADE_SCALE } from '@/components/ui/grade';
import {
  HotFlashDiagram,
  IlloBody,
  IlloCycle,
  IlloDoctor,
  IlloEmpty,
  IlloMind,
  IlloSleep,
  TransitionTimeline,
} from '@/components/ui/illustrations';
import { TocRail, TocSheet } from '@/components/ui/interactive';
import { ChipsDemo, LoadingDemo, SheetDemo, SwitchDemo, TabsDemo, ToastDemo } from './demos';

export const metadata: Metadata = {
  title: 'Design system',
  robots: { index: false, follow: false },
};

const SECTIONS = [
  { id: 'colour', label: 'Colour' },
  { id: 'type', label: 'Type' },
  { id: 'buttons', label: 'Buttons and links' },
  { id: 'inputs', label: 'Chips and inputs' },
  { id: 'grades', label: 'Grade meter' },
  { id: 'callouts', label: 'Callouts' },
  { id: 'notice', label: 'Notice' },
  { id: 'product', label: 'Product card' },
  { id: 'citations', label: 'Citations and tables' },
  { id: 'disclosure', label: 'Accordion, tabs, steps' },
  { id: 'feedback', label: 'Progress, toast, sheet' },
  { id: 'states', label: 'Empty, loading, error' },
  { id: 'illustration', label: 'Illustration' },
];

const SWATCHES: Array<{ token: string; use: string }> = [
  { token: '--paper', use: 'Page' },
  { token: '--paper-raised', use: 'Cards, inputs' },
  { token: '--paper-sunk', use: 'Wells, product cards' },
  { token: '--ink', use: 'Text' },
  { token: '--ink-muted', use: 'Secondary text' },
  { token: '--rule', use: 'Lines' },
  { token: '--accent', use: 'Brand, primary actions' },
  { token: '--accent-soft', use: 'Hover, selected' },
  { token: '--link', use: 'Links' },
  { token: '--brass', use: '“Try tonight”' },
  { token: '--urgent', use: 'Red flags only' },
  { token: '--urgent-soft', use: 'Red-flag panel' },
];

function Section({ id, title, intro, children }: { id: string; title: string; intro?: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-20 border-t border-[var(--rule)] pt-8 pb-12">
      <h2 id={`${id}-h`} className="text-[length:var(--fs-h2)]">
        {title}
      </h2>
      {intro && <p className="mt-2 max-w-[var(--measure)] text-[var(--ink-muted)]">{intro}</p>}
      <div className="mt-6 grid gap-8">{children}</div>
    </section>
  );
}

function Sub({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 font-sans text-base font-bold tracking-wide text-[var(--ink-muted)] uppercase">{title}</h3>
      {children}
    </div>
  );
}

export default function DesignSystemPage() {
  return (
    <>
      <header className="rule-double sticky top-0 z-40 bg-[var(--paper)]">
        <div className="wrap flex min-h-16 flex-wrap items-center justify-between gap-3 py-2">
          <Link href="/" className="no-underline">
            <BrandLogo size={30} />
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <TextSizeControl />
            <ThemeControl showLabels={false} />
          </div>
        </div>
      </header>

      <main id="main" className="wrap py-10">
        <p className="kicker">Reading Room · direction A</p>
        <h1 className="mt-1 text-[length:var(--fs-display)] leading-[1.05]">Design system</h1>
        <p className="mt-4 max-w-[var(--measure)] text-[length:var(--fs-lead)] text-[var(--ink-muted)]">
          Every component in light and dark, with its states. Switch theme and text size at the top: they apply to the
          whole site and are remembered for this visit (and on this device if you allowed preferences).
        </p>

        <div className="mt-10 lg:grid lg:grid-cols-[minmax(0,1fr)_15rem] lg:gap-14">
          <div>
            <div className="mb-6 lg:hidden">
              <TocSheet items={SECTIONS} />
            </div>

            {/* ------------------------------------------------ colour */}
            <Section
              id="colour"
              title="Colour"
              intro="Semantic tokens with light and dark values. The dark theme is deep green-black with parchment text: no pure black, no pure white, low glare at night."
            >
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {SWATCHES.map((s) => (
                  <div key={s.token} className="overflow-hidden rounded-[var(--radius)] border border-[var(--rule)] bg-[var(--paper-raised)]">
                    <div className="h-16 border-b border-[var(--rule)]" style={{ background: `var(${s.token})` }} />
                    <div className="p-3">
                      <code className="text-sm font-bold">{s.token}</code>
                      <p className="text-sm text-[var(--ink-muted)]">{s.use}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Sub title="Evidence grades (with icon + word, never colour alone)">
                <div className="flex flex-wrap gap-3">
                  {(['strong', 'moderate', 'limited', 'not_supported', 'harm_concern', 'comfort_only'] as const).map((g) => (
                    <GradeBadge key={g} grade={g} />
                  ))}
                </div>
              </Sub>
            </Section>

            {/* ------------------------------------------------ type */}
            <Section
              id="type"
              title="Type"
              intro="Newsreader for headings, Atkinson Hyperlegible Next for reading (designed for low and changing vision). Body is 18px on phones and 19px on desktop, line height 1.7, measure 60–72 characters."
            >
              <div className="grid gap-5">
                <p className="font-serif text-[length:var(--fs-display)] leading-[1.05] font-semibold">What’s going on with your body?</p>
                <p className="font-serif text-[length:var(--fs-h1)] leading-tight font-semibold">H1 · Night sweats: how to sleep cooler tonight</p>
                <p className="font-serif text-[length:var(--fs-h2)] leading-tight font-semibold">H2 · What has the best evidence</p>
                <p className="font-serif text-[length:var(--fs-h3)] font-semibold">H3 · Hormone therapy (HRT)</p>
                <p className="text-[length:var(--fs-lead)] text-[var(--ink-muted)]">Lead · Plain answers, graded against the evidence.</p>
                <div className="prose">
                  <p>
                    Body · You’re not imagining this. Night sweats are hot flashes that happen while you sleep, and they’re one of the
                    most common signs of perimenopause (the years before your periods stop). Short sentences, plain words, the
                    technical term in brackets the first time.
                  </p>
                </div>
                <p className="text-[length:var(--fs-meta)] text-[var(--ink-muted)]">Meta · Last checked 2 November 2026 · 6 min read</p>
                <p className="kicker">Kicker · We say it plainly when something doesn’t work</p>
              </div>
            </Section>

            {/* ------------------------------------------------ buttons */}
            <Section id="buttons" title="Buttons and links" intro="Labels say what happens. 48px tall. Hover, focus (keyboard ring) and press are live: try them. Loading keeps the button’s width.">
              <Sub title="Primary · secondary · quiet">
                <div className="flex flex-wrap items-center gap-3">
                  <button type="button" className="btn btn-primary">
                    Log today
                  </button>
                  <button type="button" className="btn btn-secondary">
                    Copy questions
                  </button>
                  <button type="button" className="btn btn-quiet">
                    Print my report
                  </button>
                  <button type="button" className="btn btn-danger">
                    Delete all my data
                  </button>
                </div>
              </Sub>
              <Sub title="Disabled · loading · small · large">
                <div className="flex flex-wrap items-center gap-3">
                  <button type="button" className="btn btn-primary" disabled>
                    Log today
                  </button>
                  <button type="button" className="btn btn-secondary" disabled>
                    Copy questions
                  </button>
                  <button type="button" className="btn btn-primary" aria-busy="true">
                    Saving
                  </button>
                  <LoadingDemo />
                  <button type="button" className="btn btn-secondary btn-sm">
                    Small
                  </button>
                  <button type="button" className="btn btn-primary btn-lg">
                    Where am I in the transition? →
                  </button>
                </div>
              </Sub>
              <Sub title="Links">
                <p className="prose">
                  An <a href="#buttons">inline link</a> in body text, and a standalone{' '}
                  <a className="link link-arrow" href="#buttons">
                    Show options with strong evidence
                  </a>
                </p>
              </Sub>
            </Section>

            {/* ------------------------------------------------ inputs */}
            <Section id="inputs" title="Chips and inputs">
              <Sub title="Chips and filters (tap to toggle)">
                <ChipsDemo />
              </Sub>
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="field">
                  <label className="label" htmlFor="ds-search">
                    Search
                  </label>
                  <div className="search-input">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                      <circle cx="11" cy="11" r="7" />
                      <path d="m20 20-3.5-3.5" />
                    </svg>
                    <input id="ds-search" className="input" type="search" placeholder="Try “hot at night”" />
                  </div>
                </div>
                <div className="field">
                  <label className="label" htmlFor="ds-date">
                    Next appointment
                  </label>
                  <input id="ds-date" className="input" type="date" defaultValue="2026-11-20" />
                  <span className="hint">We’ll show a “Before your appointment” card a week before.</span>
                </div>
                <div className="field">
                  <label className="label" htmlFor="ds-err">
                    Hot flashes today
                  </label>
                  <input id="ds-err" className="input" inputMode="numeric" defaultValue="-2" aria-invalid="true" aria-describedby="ds-err-msg" />
                  <span id="ds-err-msg" className="field-error">
                    Enter 0 or more. Use the − and + buttons if that’s easier.
                  </span>
                </div>
                <div className="field">
                  <label className="label" htmlFor="ds-dis">
                    Backup file (disabled)
                  </label>
                  <input id="ds-dis" className="input" disabled value="No backup yet" readOnly />
                </div>
                <div className="field">
                  <label className="label" htmlFor="ds-sel">
                    Symptom
                  </label>
                  <select id="ds-sel" className="select" defaultValue="sleep">
                    <option value="sleep">Sleep & temperature</option>
                    <option value="mind">Mind & mood</option>
                  </select>
                </div>
                <div className="field">
                  <label className="label" htmlFor="ds-note">
                    Note (optional)
                  </label>
                  <textarea id="ds-note" className="textarea" placeholder="Anything you want to remember for your doctor" />
                </div>
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                <Sub title="Checkboxes and radios">
                  <fieldset className="min-w-0 border-0 p-0">
                    <legend className="visually-hidden">Checkbox states</legend>
                    <label className="check">
                      <input type="checkbox" /> Heavy or unusual bleeding
                    </label>
                    <label className="check">
                      <input type="checkbox" defaultChecked /> Bleeding after 12+ months without a period
                    </label>
                    <label className="check">
                      <input type="checkbox" disabled /> Not available yet
                    </label>
                    <label className="check">
                      <input type="radio" name="ds-r" defaultChecked /> Daily
                    </label>
                    <label className="check">
                      <input type="radio" name="ds-r" /> Weekly
                    </label>
                  </fieldset>
                </Sub>
                <Sub title="Toggles">
                  <SwitchDemo />
                </Sub>
              </div>
              <Sub title="Theme and text size">
                <DisplayControls />
              </Sub>
            </Section>

            {/* ------------------------------------------------ grades */}
            <Section
              id="grades"
              title="Grade meter"
              intro="A five-step scale from harm concern to strong evidence, with the current step marked, an icon and the word. Tap “What does … mean?” for a plain explanation."
            >
              <div className="card">
                <p className="eyebrow">Black cohosh · for hot flashes</p>
                <div className="mt-3">
                  <GradeMeter grade="not_supported" size="lg" use="for hot flashes" showScale />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {[...GRADE_SCALE].reverse().map((g) => (
                  <div key={g} className="card">
                    <GradeMeter grade={g} />
                  </div>
                ))}
                <div className="card">
                  <GradeMeter grade="comfort_only" />
                  <p className="hint mt-2">Comfort only sits off the scale.</p>
                </div>
              </div>
              <Sub title="Treatment row (article tables)">
                <div className="border-t border-[var(--rule)]">
                  {[
                    { n: 'Hormone therapy (HRT)', g: 'strong' as const, f: 'Cuts hot flashes by about three quarters in trials.' },
                    { n: 'CBT', g: 'moderate' as const, f: 'Makes them less bothersome, not less frequent.' },
                    { n: 'Black cohosh', g: 'not_supported' as const, f: 'No better than placebo in good trials.' },
                  ].map((r) => (
                    <a key={r.n} href="#grades" className="grid gap-2 border-b border-[var(--rule)] py-4 text-[var(--ink)] no-underline sm:grid-cols-[12rem_14rem_1fr] sm:items-center">
                      <strong>{r.n}</strong>
                      <GradeMeter grade={r.g} explain={false} />
                      <span className="text-[var(--ink-muted)]">{r.f}</span>
                    </a>
                  ))}
                </div>
              </Sub>
            </Section>

            {/* ------------------------------------------------ callouts */}
            <Section id="callouts" title="Callouts" intro="Each kind has its own look, so readers learn what to expect. Red flags are the strongest style and used sparingly.">
              <Callout kind="answer">
                <p>
                  Night sweats are hot flashes that happen while you sleep. A cooler room, layered bedding and skipping alcohol in the
                  evening help tonight. Hormone therapy has the strongest evidence if they keep waking you.
                </p>
              </Callout>
              <Callout kind="try">
                <ol>
                  <li>Set the bedroom to about 18 °C (65 °F).</li>
                  <li>Swap the duvet for two light layers you can kick off.</li>
                  <li>Skip wine after dinner; it’s a common trigger.</li>
                </ol>
              </Callout>
              <Callout kind="redflag">
                <ul>
                  <li>you have night sweats with a fever, weight loss you can’t explain, or swollen glands</li>
                  <li>you bleed after 12 months without a period</li>
                </ul>
              </Callout>
              <AskDoctor
                questions={[
                  'Could my night sweats be perimenopause, or should we check anything else?',
                  'Is hormone therapy an option for me, given my health history?',
                  'If not hormones, which non-hormonal treatments would you suggest?',
                ]}
              />
              <Callout kind="evidence">
                <p>
                  In large trials, hormone therapy cut hot flashes by about three quarters. Non-hormonal prescriptions help too, by
                  less.
                </p>
              </Callout>
              <Callout kind="comfort">
                <p>Cooling pillows and moisture-wicking pyjamas can make nights easier. They won’t reduce how often hot flashes happen.</p>
              </Callout>
              <Callout kind="careful">
                <p>Talk to a doctor first if you have liver problems or take other medicines regularly.</p>
              </Callout>
              <div className="urgent-block" role="note">
                <p className="urgent-block-title">
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 3 2.5 20h19L12 3Z" />
                    <path d="M12 10v4.5M12 17.5v.01" />
                  </svg>
                  Get help now
                </p>
                <p>Chest pain, fainting, or thoughts of harming yourself: call emergency services.</p>
                <Link href="/urgent-help/" className="btn btn-danger justify-self-start">
                  See urgent help numbers
                </Link>
              </div>
            </Section>

            {/* ------------------------------------------------ notice */}
            <Section id="notice" title="Notice" intro="The site’s “not medical advice / how this page was made” text: calm, clearly readable, its own index-card style.">
              <HonestyNotice variant="short" />
              <HonestyNotice variant="full" lastChecked="2026-11-02" />
            </Section>

            {/* ------------------------------------------------ product */}
            <Section
              id="product"
              title="Product card"
              intro="Clearly labelled, shows the grade, “What it won’t do” and “Check first”. Dashed frame on sunk paper: distinct from editorial without looking like an ad. (Sample content.)"
            >
              <article className="product-card" aria-labelledby="ds-pc">
                <p className="product-card-tag">
                  <span>Paid link · we may earn a commission</span>
                  <span>Sample</span>
                </p>
                <div className="product-card-body">
                  <h3 id="ds-pc" className="product-card-name">
                    Example moisture-wicking pyjamas
                  </h3>
                  <GradeBadge grade="comfort_only" explain />
                  <dl>
                    <div>
                      <dt>Best for</dt>
                      <dd>Waking damp after a night sweat and needing to get back to sleep.</dd>
                    </div>
                    <div className="pc-wont">
                      <dt>What it won’t do</dt>
                      <dd>It won’t prevent or reduce hot flashes.</dd>
                    </div>
                    <div className="pc-check">
                      <dt>Check first</dt>
                      <dd>See a doctor if night sweats come with fever, weight loss or swollen glands.</dd>
                    </div>
                  </dl>
                  <div className="flex flex-wrap items-center gap-3">
                    <a href="#product" className="btn btn-secondary">
                      See it at the retailer ↗
                    </a>
                  </div>
                  <p className="product-card-fine">A commission never changes a grade.</p>
                </div>
              </article>
            </Section>

            {/* ------------------------------------------------ citations */}
            <Section id="citations" title="Citations and tables" intro="Tap a number to see the source. Under 600px, tables turn into stacked cards.">
              <div className="prose">
                <p>
                  The Menopause Society does not recommend black cohosh for hot flashes
                  <Cite n={1} source={{ title: 'The 2023 nonhormone therapy position statement of The North American Menopause Society', publisher: 'Menopause', year: 2023, url: 'https://doi.org/10.1097/GME.0000000000002200' }} />
                  , and a large review found it no better than placebo
                  <Cite n={2} source={{ title: 'Black cohosh (Cimicifuga spp.) for menopausal symptoms', publisher: 'Cochrane Database of Systematic Reviews', year: 2012, url: 'https://doi.org/10.1002/14651858.CD007244.pub2' }} />.
                </p>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Option</th>
                        <th>Evidence</th>
                        <th>What trials found</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td data-label="Option">Hormone therapy</td>
                        <td data-label="Evidence">
                          <GradeBadge grade="strong" />
                        </td>
                        <td data-label="What trials found">About three quarters fewer hot flashes</td>
                      </tr>
                      <tr>
                        <td data-label="Option">Fezolinetant (Veozah)</td>
                        <td data-label="Evidence">
                          <GradeBadge grade="strong" />
                        </td>
                        <td data-label="What trials found">Fewer and milder hot flashes than placebo</td>
                      </tr>
                      <tr>
                        <td data-label="Option">Black cohosh</td>
                        <td data-label="Evidence">
                          <GradeBadge grade="not_supported" />
                        </td>
                        <td data-label="What trials found">No better than placebo</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <ol className="mt-6 text-base">
                  <li id="ref-1">The 2023 nonhormone therapy position statement. Menopause, 2023.</li>
                  <li id="ref-2">Black cohosh for menopausal symptoms. Cochrane, 2012.</li>
                </ol>
              </div>
            </Section>

            {/* ------------------------------------------------ disclosure */}
            <Section id="disclosure" title="Accordion, tabs, steps">
              <div className="accordion">
                <details open>
                  <summary>Is this perimenopause?</summary>
                  <div className="accordion-body">Often, if you’re in your 40s and your periods are changing too. A doctor can help rule out other causes.</div>
                </details>
                <details>
                  <summary>What else could cause night sweats?</summary>
                  <div className="accordion-body">Infections, an overactive thyroid, some medicines, and rarely other conditions.</div>
                </details>
              </div>
              <TabsDemo />
              <ol className="step-list">
                <li className="is-done">
                  <span className="step-title">What it does</span>
                  <span className="text-[var(--ink-muted)]">Log how you feel in under 30 seconds.</span>
                </li>
                <li>
                  <span className="step-title">Where your data lives</span>
                  <span className="text-[var(--ink-muted)]">Only on this device. Nothing is sent to us.</span>
                </li>
                <li>
                  <span className="step-title">Daily or weekly</span>
                  <span className="text-[var(--ink-muted)]">Pick what you’ll actually keep up.</span>
                </li>
              </ol>
            </Section>

            {/* ------------------------------------------------ feedback */}
            <Section id="feedback" title="Progress, toast, sheet" intro="Motion is 150–250ms and switches off with reduced motion.">
              <div className="grid gap-3">
                <div className="progress" role="progressbar" aria-label="Quiz progress" aria-valuemin={0} aria-valuemax={8} aria-valuenow={3}>
                  <span style={{ width: '37.5%' }} />
                </div>
                <div className="progress-dots" aria-hidden="true">
                  <span className="is-done" />
                  <span className="is-done" />
                  <span className="is-current" />
                  <span />
                  <span />
                </div>
                <p className="hint">Question 3 of 5</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <ToastDemo />
                <SheetDemo />
              </div>
              <p className="hint">The slim reading-progress bar sits at the very top of article pages (CSS scroll-driven, no JavaScript).</p>
            </Section>

            {/* ------------------------------------------------ states */}
            <Section id="states" title="Empty, loading, error">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="empty-state">
                  <IlloEmpty />
                  <strong>Nothing logged yet</strong>
                  <span>Your first entry takes under a minute.</span>
                  <a href="#states" className="btn btn-primary btn-sm">
                    Log today
                  </a>
                </div>
                <div className="card grid gap-3" aria-busy="true" aria-label="Loading your timeline">
                  <span className="skeleton h-6 w-2/3" />
                  <span className="skeleton h-24 w-full" />
                  <span className="skeleton h-4 w-1/2" />
                </div>
                <div className="error-state" role="alert">
                  <strong>We couldn’t open your saved entries.</strong>
                  <span>Your data is still on this device. Try reloading; if it keeps happening, restore from a backup in Settings.</span>
                  <button type="button" className="btn btn-secondary btn-sm justify-self-start">
                    Try again
                  </button>
                </div>
              </div>
            </Section>

            {/* ------------------------------------------------ illustration */}
            <Section id="illustration" title="Illustration" intro="Abstract, warm, no faces. Line art in the accent with soft fills, so it works in both themes.">
              <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
                {[IlloSleep, IlloMind, IlloBody, IlloCycle, IlloDoctor, IlloEmpty].map((I, i) => (
                  <I key={i} className="h-20 w-20" />
                ))}
              </div>
              <Sub title="Transition timeline (quiz result marker)">
                <TransitionTimeline marker="perimenopause" />
              </Sub>
              <Sub title="How a hot flash happens">
                <HotFlashDiagram />
              </Sub>
            </Section>
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <TocRail items={SECTIONS} />
            </div>
          </aside>
        </div>
      </main>
      <GradeExplainers />
    </>
  );
}
