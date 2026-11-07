'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { evaluateUrgentTriggers } from '@/lib/safety/urgent-triggers';
import { UrgentGuidance } from '@/components/safety/urgent-guidance';
import { markToolUsed } from '@/lib/pwa/install-gate';
import { useToolState, savedLabel } from '@/components/storage/use-tool-state';
import { ToolHistory } from '@/components/storage/tool-history';
import { btnDanger, btnPrimary } from '@/components/storage/styles';
import { BottomSheet } from '@/components/ui/interactive';
import { GradeMeter } from '@/components/ui/grade';
import '@/app/styles/verdict.css';
import type { EvidenceGrade } from '@/lib/content/schema';
import { GRADE_LABELS, GradeAiNote } from '@/components/site/evidence';
import { requireGrade } from '@/lib/grades/registry';

/** Catalog grades use the site-wide scale (`EvidenceGrade`) so a verdict reads the
 * same way here as it does on an article page — same words, same colors. */
export interface EvidenceEntry {
  id: string;
  name: string;
  category: 'Hormonal' | 'Non-hormonal Rx' | 'Behavioral & Physical' | 'Topical & Devices' | 'Supplements & Cooling';
  symptoms: string[];
  /** Grade registry id (content/_grades/grades.json). The grade itself is read from there. */
  gradeId: string;
  grade: Exclude<EvidenceGrade, 'per_option'>;
  /** Extra nuance beyond the plain grade word, e.g. "(with liver monitoring warning)". */
  gradeNote?: string;
  verdictSummary: string;
  guidelineSource: string;
  articleUrl?: string;
}

const CATALOG_SOURCE: ReadonlyArray<Omit<EvidenceEntry, 'grade'>> = [
  {
    id: 'systemic-hrt',
    name: 'Systemic hormone therapy (estrogen + progestogen, or estrogen alone after hysterectomy)',
    category: 'Hormonal',
    symptoms: ['Hot flashes & night sweats', 'Bone loss prevention', 'Genitourinary symptoms'],
    gradeId: 'mht-vms',
    verdictSummary:
      'The Menopause Society (2022) states systemic hormone therapy is the most effective treatment for vasomotor symptoms and prevents bone loss. Benefit-risk ratio is most favorable under age 60 or within 10 years of menopause onset without contraindications.',
    guidelineSource: 'The Menopause Society 2022 Position Statement; FDA 2025–2026 labeling updates',
    articleUrl: '/treatments/hormone-therapy/boxed-warning/',
  },
  {
    id: 'vaginal-estrogen',
    name: 'Low-dose vaginal estrogen (creams, tablets, or rings)',
    category: 'Hormonal',
    symptoms: ['Vaginal dryness & painful sex'],
    gradeId: 'vaginal-estrogen-gsm',
    verdictSummary:
      'Highly effective for moderate-to-severe genitourinary syndrome of menopause (vaginal dryness and painful sex) when non-hormonal moisturisers are not enough, with minimal systemic absorption.',
    guidelineSource: 'NAMS 2020 GSM Position Statement; Cochrane 2021',
    articleUrl: '/symptoms/vaginal-dryness/',
  },
  {
    id: 'fezolinetant',
    name: 'Fezolinetant (Veozah) — NK3 receptor antagonist',
    category: 'Non-hormonal Rx',
    symptoms: ['Hot flashes & night sweats'],
    gradeId: 'fezolinetant-vms',
    gradeNote: 'with liver monitoring warning',
    verdictSummary:
      'FDA-approved non-hormonal prescription option with Level I evidence for moderate-to-severe hot flashes. Carries an FDA boxed warning for liver injury (hepatotoxicity), requiring baseline and scheduled blood liver tests.',
    guidelineSource: 'NAMS 2023 Nonhormone Statement; FDA Veozah Prescribing Information (2026)',
    articleUrl: '/symptoms/hot-flashes/',
  },
  {
    id: 'elinzanetant',
    name: 'Elinzanetant (Lynkuet) — dual NK1/NK3 receptor antagonist',
    category: 'Non-hormonal Rx',
    symptoms: ['Hot flashes & night sweats'],
    gradeId: 'elinzanetant-vms',
    verdictSummary:
      'FDA-approved in October 2025 for moderate-to-severe vasomotor symptoms. Efficacy came from two 12-week phase 3 trials (OASIS 1 and 2) in 796 women; safety data covered 1,420 women across OASIS 1–3, including 627 followed for up to a year.',
    guidelineSource: 'Manufacturer (Bayer) approval announcement, 2025, reporting the OASIS 1–3 trials; brand-funded source',
    articleUrl: '/symptoms/hot-flashes/',
  },
  {
    id: 'ssri-snri-gabapentin',
    name: 'Certain SSRIs, SNRIs and gabapentin',
    category: 'Non-hormonal Rx',
    symptoms: ['Hot flashes & night sweats'],
    gradeId: 'ssri-snri-gabapentin-vms',
    gradeNote: 'Level I',
    verdictSummary:
      'Recommended by The Menopause Society (2023) as non-hormonal prescription options that reduce hot flash frequency and severity when hormone therapy is contraindicated or not chosen.',
    guidelineSource: 'The Menopause Society 2023 Nonhormone Therapy Position Statement',
    articleUrl: '/symptoms/hot-flashes/',
  },
  {
    id: 'oxybutynin',
    name: 'Oxybutynin',
    category: 'Non-hormonal Rx',
    symptoms: ['Hot flashes & night sweats'],
    gradeId: 'oxybutynin-vms',
    gradeNote: 'Levels I–II',
    verdictSummary:
      'Recommended by The Menopause Society (2023) at Levels I–II for hot flashes, with a caution about cognitive decline in older adults.',
    guidelineSource: 'The Menopause Society 2023 Nonhormone Therapy Position Statement',
    articleUrl: '/treatments/nonhormonal/oxybutynin/',
  },
  {
    id: 'cbt-hypnosis',
    name: 'Cognitive behavioral therapy (CBT) and clinical hypnosis',
    category: 'Behavioral & Physical',
    symptoms: ['Hot flashes & night sweats', 'Sleep & mood'],
    gradeId: 'cbt-hypnosis-vms',
    gradeNote: 'Level I',
    verdictSummary:
      'The Menopause Society (2023) recommends CBT and clinical hypnosis (Level I) for reducing how much hot flashes bother daily life and sleep.',
    guidelineSource: 'The Menopause Society 2023 Nonhormone Therapy Position Statement',
    articleUrl: '/symptoms/hot-flashes/',
  },
  {
    id: 'pelvic-floor-training',
    name: 'Supervised pelvic floor muscle training (PFMT)',
    category: 'Behavioral & Physical',
    symptoms: ['Bladder leaks & urgency'],
    gradeId: 'pfmt-incontinence',
    verdictSummary:
      'First-line treatment in NICE NG123 and Cochrane systematic reviews (at least 3 months of structured contractions); participants in PFMT trials were 8 times more likely to report complete resolution of urinary leakage than inactive controls.',
    guidelineSource: 'NICE NG123 (2019); Cochrane Review CD005654 (2018)',
    articleUrl: '/symptoms/incontinence/',
  },
  {
    id: 'heavy-resistance-training',
    name: 'High-intensity resistance and impact training (HiRIT)',
    category: 'Behavioral & Physical',
    symptoms: ['Bone loss prevention'],
    gradeId: 'strength-training-bone',
    gradeNote: 'for bone density & strength',
    verdictSummary:
      'In the LIFTMOR randomized trial, twice-weekly supervised high-intensity resistance and impact training improved lumbar spine and femoral neck bone mineral density and functional strength in postmenopausal women with low bone mass. (Not recommended by NAMS 2023 as a treatment for hot flashes.)',
    guidelineSource: 'LIFTMOR Trial (JBMR 2018); NAMS 2023 Nonhormone Statement',
    articleUrl: '/does-it-work/exercise/',
  },
  {
    id: 'vaginal-moisturisers-lubricants',
    name: 'Non-hormonal vaginal moisturisers and personal lubricants',
    category: 'Topical & Devices',
    symptoms: ['Vaginal dryness & painful sex'],
    gradeId: 'vaginal-moisturizers-gsm',
    gradeNote: 'first-line non-hormonal option',
    verdictSummary:
      'Recommended by NAMS (2020) and ACOG (2021) as first-line non-hormonal care: vaginal moisturisers used several times a week hydrate tissue continuously, while lubricants reduce friction during sex.',
    guidelineSource: 'NAMS 2020 GSM Statement; ACOG Clinical Consensus No. 2 (2021); Cochrane 2021',
    articleUrl: '/care/moisturizers-and-lubricants/',
  },
  {
    id: 'cooling-bedding-sleepwear',
    name: 'Cooling pillows, breathable bedding, and moisture-wicking sleepwear',
    category: 'Supplements & Cooling',
    symptoms: ['Hot flashes & night sweats', 'Sleep & mood'],
    gradeId: 'cooling-comfort',
    gradeNote: 'comfort aid only, not a treatment',
    verdictSummary:
      'The Menopause Society (2023) notes that cooling techniques are not recommended as a clinical treatment that stops vasomotor flashes (Level II), though many women use breathable layers and cooling pillows for practical comfort when night sweats wake them.',
    guidelineSource: 'The Menopause Society 2023 Nonhormone Therapy Position Statement',
    articleUrl: '/does-it-work/cooling-products/',
  },
  {
    id: 'otc-supplements-herbs',
    name: 'Over-the-counter herbal supplements (black cohosh, evening primrose, soy extracts, cannabinoids)',
    category: 'Supplements & Cooling',
    symptoms: ['Hot flashes & night sweats', 'Sleep & mood'],
    gradeId: 'otc-supplements-vms',
    gradeNote: 'Level I–II trials',
    verdictSummary:
      'The Menopause Society (2023) does not recommend over-the-counter supplements, herbal remedies, soy extracts, or cannabinoids for vasomotor symptoms because randomized trial results are inconsistent or no better than placebo.',
    guidelineSource: 'The Menopause Society 2023 Nonhormone Therapy Position Statement',
    articleUrl: '/does-it-work/black-cohosh/',
  },
  {
    id: 'paced-respiration-acupuncture',
    name: 'Paced respiration, acupuncture, and relaxation alone for hot flashes',
    category: 'Behavioral & Physical',
    symptoms: ['Hot flashes & night sweats'],
    gradeId: 'paced-respiration-acupuncture-vms',
    gradeNote: 'Level I–II trials',
    verdictSummary:
      'Controlled trials found paced respiration (Level I) and acupuncture or relaxation (Level II) did not consistently outperform sham or control groups for reducing hot flashes.',
    guidelineSource: 'The Menopause Society 2023 Nonhormone Therapy Position Statement',
    articleUrl: '/symptoms/hot-flashes/',
  },
];

/** Every checker grade is read from the one grade registry, so it matches the articles. */
export const EVIDENCE_CATALOG: readonly EvidenceEntry[] = CATALOG_SOURCE.map((e) => ({ ...e, grade: requireGrade(e.gradeId).grade }));

const SYMPTOM_FILTERS = [
  'All symptoms',
  'Hot flashes & night sweats',
  'Vaginal dryness & painful sex',
  'Bladder leaks & urgency',
  'Bone loss prevention',
  'Sleep & mood',
] as const;

interface CheckerState {
  selectedSymptom: string;
  selectedGrade: 'all' | Exclude<EvidenceGrade, 'per_option'>;
  query: string;
  bookmarkedIds: string[];
  redFlags: string[];
}

const DEFAULT_STATE: CheckerState = {
  selectedSymptom: 'All symptoms',
  selectedGrade: 'all',
  query: '',
  bookmarkedIds: [],
  redFlags: [],
};

const ENTRY_IDS = new Set(EVIDENCE_CATALOG.map((e) => e.id));
const GRADES: ReadonlyArray<CheckerState['selectedGrade']> = ['all', 'strong', 'moderate', 'limited', 'comfort_only', 'not_supported'];

/** Strongest first. Comfort only sits with not supported: it helps you feel better but is not a treatment. */
const GRADE_RANK: Record<EvidenceEntry['grade'], number> = { strong: 5, moderate: 4, limited: 3, comfort_only: 2, not_supported: 1, harm_concern: 0 };

function normalize(raw: unknown): CheckerState {
  const p = (raw ?? {}) as Partial<CheckerState>;
  return {
    selectedSymptom: (SYMPTOM_FILTERS as readonly string[]).includes(p.selectedSymptom as string) ? (p.selectedSymptom as string) : 'All symptoms',
    selectedGrade: GRADES.includes(p.selectedGrade as CheckerState['selectedGrade']) ? (p.selectedGrade as CheckerState['selectedGrade']) : 'all',
    query: typeof p.query === 'string' ? p.query.slice(0, 200) : '',
    bookmarkedIds: Array.isArray(p.bookmarkedIds) ? p.bookmarkedIds.filter((x): x is string => typeof x === 'string' && ENTRY_IDS.has(x)) : [],
    redFlags: Array.isArray(p.redFlags) ? p.redFlags.filter((x): x is string => typeof x === 'string') : [],
  };
}

function summarize(s: CheckerState): string {
  const names = EVIDENCE_CATALOG.filter((e) => s.bookmarkedIds.includes(e.id)).map((e) => e.name.split(' (')[0].split(' — ')[0]);
  if (!names.length) return 'Empty shortlist';
  return `${names.length} option${names.length === 1 ? '' : 's'}: ${names.slice(0, 3).join('; ')}${names.length > 3 ? '; …' : ''}`;
}

export function DoesItWorkChecker({ liveUrls }: { liveUrls: string[] }) {
  const { state, update, reset, status } = useToolState('does-it-work-checker', DEFAULT_STATE, normalize);
  const live = useMemo(() => new Set(liveUrls), [liveUrls]);
  const persist = (next: CheckerState) => update(next);

  const toggleBookmark = (id: string) => {
    const exists = state.bookmarkedIds.includes(id);
    const nextIds = exists ? state.bookmarkedIds.filter((x) => x !== id) : [...state.bookmarkedIds, id];
    persist({ ...state, bookmarkedIds: nextIds });
  };

  const toggleRedFlag = (flag: string) => {
    const exists = state.redFlags.includes(flag);
    const nextFlags = exists ? state.redFlags.filter((x) => x !== flag) : [...state.redFlags, flag];
    persist({ ...state, redFlags: nextFlags });
  };

  const urgent = useMemo(
    () =>
      evaluateUrgentTriggers({
        symptomIds: state.redFlags,
      }),
    [state.redFlags],
  );

  const filtered = useMemo(() => {
    const q = state.query.trim().toLowerCase();
    return EVIDENCE_CATALOG.filter((item) => {
      if (state.selectedSymptom !== 'All symptoms' && !item.symptoms.includes(state.selectedSymptom)) {
        return false;
      }
      if (state.selectedGrade !== 'all' && item.grade !== state.selectedGrade) {
        return false;
      }
      if (
        q &&
        !item.name.toLowerCase().includes(q) &&
        !item.verdictSummary.toLowerCase().includes(q) &&
        !item.category.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [state.selectedSymptom, state.selectedGrade, state.query]);

  const bookmarkedItems = useMemo(
    () => EVIDENCE_CATALOG.filter((item) => state.bookmarkedIds.includes(item.id)),
    [state.bookmarkedIds],
  );

  const [sort, setSort] = useState<'grade' | 'az'>('grade');

  /** Counts for the chips: how many options each choice would show, given the other filters. */
  const matches = (item: EvidenceEntry, symptom: string, grade: CheckerState['selectedGrade']) => {
    const q = state.query.trim().toLowerCase();
    if (symptom !== 'All symptoms' && !item.symptoms.includes(symptom)) return false;
    if (grade !== 'all' && item.grade !== grade) return false;
    if (q && !item.name.toLowerCase().includes(q) && !item.verdictSummary.toLowerCase().includes(q) && !item.category.toLowerCase().includes(q)) {
      return false;
    }
    return true;
  };

  const shown = useMemo(() => {
    const list = [...filtered];
    // Strongest evidence first by default; stable, so catalog order breaks ties.
    if (sort === 'grade') list.sort((a, b) => GRADE_RANK[b.grade] - GRADE_RANK[a.grade]);
    else list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [filtered, sort]);

  const shortName = (name: string) => name.split(' (')[0].split(' — ')[0];
  const filtersActive = state.selectedSymptom !== 'All symptoms' || state.selectedGrade !== 'all' || state.query.trim() !== '';

  const printShortlist = () => {
    markToolUsed();
    window.print();
  };

  return (
    <div className="checker" data-tool-ui="does-it-work-checker">
      <fieldset className="panel min-w-0">
        <legend className="panel-title mb-1">Safety check first: do any of these apply right now?</legend>
        <p className="panel-hint -mt-2">Tick any that do. You’ll see where to get help straight away.</p>
        <div className="grid sm:grid-cols-2 sm:gap-x-6">
          {[
            { id: 'postmenopausal_bleeding', label: 'Bleeding or spotting after 12+ months without a period' },
            { id: 'heavy_flow', label: 'Heavy or unusual vaginal bleeding' },
            { id: 'palpitations', label: 'Palpitations with chest pain, shortness of breath, or fainting' },
            { id: 'low_mood', label: 'Thoughts of harming yourself or feeling unable to stay safe' },
          ].map((item) => (
            <label key={item.id} className="check">
              <input type="checkbox" checked={state.redFlags.includes(item.id)} onChange={() => toggleRedFlag(item.id)} />
              <span>{item.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <UrgentGuidance triggers={urgent} />

      <form onSubmit={(e) => e.preventDefault()} className="panel checker-filters" aria-label="Filter treatments">
        <div className="field">
          <label htmlFor="checker-search" className="label">
            Search a treatment or supplement
          </label>
          <div className="search-input">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              id="checker-search"
              type="search"
              className="input"
              placeholder="e.g. fezolinetant, CBT, black cohosh"
              value={state.query}
              onChange={(e) => persist({ ...state, query: e.target.value })}
            />
          </div>
        </div>

        <div>
          <p className="checker-filter-label" id="checker-symptom-label">
            Symptom or goal
          </p>
          <div className="chip-row" role="group" aria-labelledby="checker-symptom-label">
            {SYMPTOM_FILTERS.map((s) => {
              const n = EVIDENCE_CATALOG.filter((item) => matches(item, s, state.selectedGrade)).length;
              return (
                <button
                  key={s}
                  type="button"
                  className="chip"
                  aria-pressed={state.selectedSymptom === s}
                  onClick={() => persist({ ...state, selectedSymptom: s })}
                >
                  {s === 'All symptoms' ? 'All' : s} <span className="chip-count">{n}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="checker-filter-label" id="checker-grade-label">
            Evidence
          </p>
          <div className="chip-row" role="group" aria-labelledby="checker-grade-label">
            {GRADES.map((g) => {
              const n = EVIDENCE_CATALOG.filter((item) => matches(item, state.selectedSymptom, g)).length;
              return (
                <button
                  key={g}
                  type="button"
                  className="chip"
                  aria-pressed={state.selectedGrade === g}
                  disabled={n === 0 && state.selectedGrade !== g}
                  onClick={() => persist({ ...state, selectedGrade: g })}
                >
                  {g === 'all' ? 'Any grade' : GRADE_LABELS[g]} <span className="chip-count">{n}</span>
                </button>
              );
            })}
          </div>
        </div>
      </form>

      <section aria-labelledby="checker-results-heading" className="grid gap-4">
        <div className="checker-head">
          <h2 id="checker-results-heading" className="text-[length:var(--fs-h3)]" aria-live="polite">
            {shown.length} {shown.length === 1 ? 'option' : 'options'}
          </h2>
          <div className="seg-control" role="group" aria-label="Sort">
            <button type="button" aria-pressed={sort === 'grade'} onClick={() => setSort('grade')}>
              Strongest first
            </button>
            <button type="button" aria-pressed={sort === 'az'} onClick={() => setSort('az')}>
              A–Z
            </button>
          </div>
        </div>
        <p className="hint -mt-2">Summaries of guideline consensus, never a personal recommendation or dose.</p>

        {shown.length === 0 ? (
          <div className="empty-state">
            <strong>Nothing matches those filters</strong>
            <span>Try “All” symptoms, “Any grade”, or a shorter search.</span>
            {filtersActive && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => persist({ ...state, selectedSymptom: 'All symptoms', selectedGrade: 'all', query: '' })}
              >
                Show every option
              </button>
            )}
          </div>
        ) : (
          <ul className="checker-list">
            {shown.map((item) => {
              const saved = state.bookmarkedIds.includes(item.id);
              return (
                <li key={item.id} className={`checker-card g-${item.grade}${saved ? ' is-saved' : ''}`}>
                  <div>
                    <p className="checker-card-cat">{item.category}</p>
                    <h3 className="checker-card-name">{item.name}</h3>
                  </div>
                  <GradeMeter grade={item.grade} use={item.symptoms.join(', ')} />
                  {item.gradeNote && <p className="hint -mt-1">{item.gradeNote}</p>}
                  <p>{item.verdictSummary}</p>
                  <p className="checker-source">
                    <strong>Source:</strong> {item.guidelineSource} · <GradeAiNote />
                  </p>
                  <div className="checker-actions no-print">
                    <button
                      type="button"
                      onClick={() => toggleBookmark(item.id)}
                      aria-pressed={saved}
                      className="btn btn-secondary btn-sm save-toggle"
                    >
                      {saved ? 'Remove from my doctor list' : 'Save to ask my doctor'}
                    </button>
                    {item.articleUrl && live.has(item.articleUrl) && (
                      <Link href={item.articleUrl} className="link link-arrow">
                        Read the full guide
                      </Link>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="checker-saved-heading" className="panel scroll-mt-20" id="checker-saved">
        <h2 id="checker-saved-heading" className="panel-title">
          My doctor list ({bookmarkedItems.length})
        </h2>
        {bookmarkedItems.length === 0 ? (
          <p className="text-[var(--ink-muted)]">
            Tap &ldquo;Save to ask my doctor&rdquo; on any option above to build a list you can print. It stays on this device.
          </p>
        ) : (
          <ul className="row-list" role="list">
            {bookmarkedItems.map((i) => (
              <li key={i.id} className={`row g-${i.grade}`}>
                <div className="row-main">
                  <p className="row-title">{i.name}</p>
                  <p className="row-meta">
                    {GRADE_LABELS[i.grade]}
                    {i.gradeNote ? ` (${i.gradeNote})` : ''} · {i.guidelineSource}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}

        <p className={`no-print hint ${status.error ? 'font-bold text-[var(--urgent)]' : ''}`}>{savedLabel(status)}</p>

        <div className="no-print flex flex-wrap gap-3">
          <button type="button" disabled={bookmarkedItems.length === 0} onClick={printShortlist} className={btnPrimary}>
            Print shortlist
          </button>
          <button type="button" onClick={() => void reset()} className={btnDanger}>
            Clear my shortlist and filters
          </button>
        </div>
      </section>

      <ToolHistory
        tool="does-it-work-checker"
        noun="shortlist"
        current={state}
        canSave={state.bookmarkedIds.length > 0}
        normalize={normalize}
        summarize={summarize}
        onOpen={(data) => update(data)}
      />

      {/* Phones: the shortlist stays one tap away while scrolling the results. */}
      {bookmarkedItems.length > 0 && (
        <>
          <div className="checker-spacer" aria-hidden="true" />
          <div className="shortlist-tray no-print">
            <BottomSheet
              title={`My doctor list (${bookmarkedItems.length})`}
              triggerClassName="btn btn-primary btn-block"
              trigger={
                <>
                  My doctor list <span className="tray-count">{bookmarkedItems.length}</span>
                </>
              }
            >
              <ul className="row-list" role="list">
                {bookmarkedItems.map((i) => (
                  <li key={i.id} className="row">
                    <div className="row-main">
                      <p className="row-title">{shortName(i.name)}</p>
                      <p className="row-meta">{GRADE_LABELS[i.grade]}</p>
                    </div>
                    <button
                      type="button"
                      className="icon-btn"
                      aria-label={`Take ${shortName(i.name)} off the list`}
                      onClick={() => toggleBookmark(i.id)}
                    >
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                        <path d="M6 6l12 12M18 6L6 18" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex flex-wrap gap-3">
                <button type="button" onClick={printShortlist} className="btn btn-primary">
                  Print my list
                </button>
                <a href="#checker-saved" className="btn btn-quiet">
                  See it on the page
                </a>
              </div>
            </BottomSheet>
          </div>
        </>
      )}
    </div>
  );
}
