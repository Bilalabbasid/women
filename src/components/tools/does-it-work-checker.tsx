'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { evaluateUrgentTriggers } from '@/lib/safety/urgent-triggers';
import { UrgentGuidance } from '@/components/safety/urgent-guidance';
import { markToolUsed } from '@/lib/pwa/install-gate';

const STORAGE_KEY = 'menoverdict_evidence_checker_v1';

export type VerdictGrade = 'strong' | 'moderate' | 'limited' | 'not_supported';

export interface EvidenceEntry {
  id: string;
  name: string;
  category: 'Hormonal' | 'Non-hormonal Rx' | 'Behavioral & Physical' | 'Topical & Devices' | 'Supplements & Cooling';
  symptoms: string[];
  grade: VerdictGrade;
  gradeLabel: string;
  verdictSummary: string;
  guidelineSource: string;
  articleUrl?: string;
}

export const EVIDENCE_CATALOG: readonly EvidenceEntry[] = [
  {
    id: 'systemic-hrt',
    name: 'Systemic hormone therapy (estrogen + progestogen, or estrogen alone after hysterectomy)',
    category: 'Hormonal',
    symptoms: ['Hot flashes & night sweats', 'Bone loss prevention', 'Genitourinary symptoms'],
    grade: 'strong',
    gradeLabel: 'Strong evidence',
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
    grade: 'strong',
    gradeLabel: 'Strong evidence',
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
    grade: 'strong',
    gradeLabel: 'Strong evidence (with liver monitoring warning)',
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
    grade: 'strong',
    gradeLabel: 'Strong evidence',
    verdictSummary:
      'FDA-approved in October 2025 for moderate-to-severe vasomotor symptoms based on the Phase 3 OASIS 1–3 randomized trials in 1,420 women.',
    guidelineSource: 'FDA Approval / OASIS 1–3 clinical trial program (2025)',
    articleUrl: '/symptoms/hot-flashes/',
  },
  {
    id: 'ssri-snri-gabapentin',
    name: 'Certain SSRIs, SNRIs, gabapentin, and oxybutynin',
    category: 'Non-hormonal Rx',
    symptoms: ['Hot flashes & night sweats'],
    grade: 'strong',
    gradeLabel: 'Strong to moderate evidence (Level I–II)',
    verdictSummary:
      'Recommended by The Menopause Society (2023) as non-hormonal prescription options that reduce hot flash frequency and severity when hormone therapy is contraindicated or not chosen.',
    guidelineSource: 'The Menopause Society 2023 Nonhormone Therapy Position Statement',
    articleUrl: '/symptoms/hot-flashes/',
  },
  {
    id: 'cbt-hypnosis',
    name: 'Cognitive behavioral therapy (CBT) and clinical hypnosis',
    category: 'Behavioral & Physical',
    symptoms: ['Hot flashes & night sweats', 'Sleep & mood'],
    grade: 'strong',
    gradeLabel: 'Strong evidence (Level I)',
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
    grade: 'strong',
    gradeLabel: 'Strong evidence',
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
    grade: 'strong',
    gradeLabel: 'Strong evidence (for bone density & strength)',
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
    grade: 'moderate',
    gradeLabel: 'Moderate evidence (First-line non-hormonal)',
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
    grade: 'limited',
    gradeLabel: 'Limited clinical evidence (Comfort aid only)',
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
    grade: 'not_supported',
    gradeLabel: 'Not recommended by guidelines for hot flashes (Level I–II)',
    verdictSummary:
      'The Menopause Society (2023) does not recommend over-the-counter supplements, herbal remedies, soy extracts, or cannabinoids for vasomotor symptoms because randomized trial results are inconsistent or no better than placebo.',
    guidelineSource: 'The Menopause Society 2023 Nonhormone Therapy Position Statement',
    articleUrl: '/does-it-work/magnesium/',
  },
  {
    id: 'paced-respiration-acupuncture',
    name: 'Paced respiration, acupuncture, and relaxation alone for hot flashes',
    category: 'Behavioral & Physical',
    symptoms: ['Hot flashes & night sweats'],
    grade: 'not_supported',
    gradeLabel: 'Not recommended for hot flashes (Level I–II)',
    verdictSummary:
      'Controlled trials found paced respiration (Level I) and acupuncture or relaxation (Level II) did not consistently outperform sham or control groups for reducing hot flashes.',
    guidelineSource: 'The Menopause Society 2023 Nonhormone Therapy Position Statement',
    articleUrl: '/symptoms/hot-flashes/',
  },
];

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
  selectedGrade: 'all' | VerdictGrade;
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

function loadInitialState(): CheckerState {
  if (typeof window === 'undefined') return DEFAULT_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as Partial<CheckerState>;
    return {
      selectedSymptom: parsed.selectedSymptom ?? 'All symptoms',
      selectedGrade: parsed.selectedGrade ?? 'all',
      query: parsed.query ?? '',
      bookmarkedIds: Array.isArray(parsed.bookmarkedIds) ? parsed.bookmarkedIds : [],
      redFlags: Array.isArray(parsed.redFlags) ? parsed.redFlags : [],
    };
  } catch {
    return DEFAULT_STATE;
  }
}

export function DoesItWorkChecker({ liveUrls }: { liveUrls: string[] }) {
  const [state, setState] = useState<CheckerState>(loadInitialState);
  const live = useMemo(() => new Set(liveUrls), [liveUrls]);

  const persist = (next: CheckerState) => {
    setState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      markToolUsed();
    } catch {
      // ignore
    }
  };

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

  const exportJson = () => {
    try {
      const payload = {
        tool: 'does-it-work-checker',
        app: 'MenoVerdict',
        exportedAt: new Date().toISOString(),
        bookmarkedOptions: bookmarkedItems.map((i) => ({
          id: i.id,
          name: i.name,
          gradeLabel: i.gradeLabel,
          guidelineSource: i.guidelineSource,
        })),
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `menoverdict-evidence-shortlist-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
  };

  const deleteAllData = () => {
    setState(DEFAULT_STATE);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-6" data-tool-ui="does-it-work-checker">
      <fieldset className="space-y-2 rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)] p-4">
        <legend className="px-1 font-serif text-lg font-semibold">
          Safety check first: do any of these apply right now?
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            { id: 'postmenopausal_bleeding', label: 'Bleeding or spotting after 12+ months without a period' },
            { id: 'heavy_flow', label: 'Heavy or unusual vaginal bleeding' },
            { id: 'palpitations', label: 'Palpitations with chest pain, shortness of breath, or fainting' },
            { id: 'low_mood', label: 'Thoughts of harming yourself or feeling unable to stay safe' },
          ].map((item) => (
            <label key={item.id} className="tap flex cursor-pointer items-center gap-3 py-1 text-sm">
              <input
                type="checkbox"
                checked={state.redFlags.includes(item.id)}
                onChange={() => toggleRedFlag(item.id)}
                className="h-5 w-5 shrink-0 accent-[var(--color-accent)]"
              />
              <span>{item.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <UrgentGuidance triggers={urgent} />

      <form onSubmit={(e) => e.preventDefault()} className="space-y-4 rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)] p-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="checker-symptom" className="block text-sm font-semibold">
              Filter by symptom or goal
            </label>
            <select
              id="checker-symptom"
              value={state.selectedSymptom}
              onChange={(e) => persist({ ...state, selectedSymptom: e.target.value })}
              className="mt-1 min-h-[44px] w-full rounded-lg border border-[var(--color-rule)] bg-[var(--color-paper)] px-3"
            >
              {SYMPTOM_FILTERS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="checker-grade" className="block text-sm font-semibold">
              Filter by evidence grade
            </label>
            <select
              id="checker-grade"
              value={state.selectedGrade}
              onChange={(e) => persist({ ...state, selectedGrade: e.target.value as CheckerState['selectedGrade'] })}
              className="mt-1 min-h-[44px] w-full rounded-lg border border-[var(--color-rule)] bg-[var(--color-paper)] px-3"
            >
              <option value="all">All evidence grades</option>
              <option value="strong">Strong evidence</option>
              <option value="moderate">Moderate evidence</option>
              <option value="limited">Limited / comfort aid</option>
              <option value="not_supported">Not recommended by guidelines</option>
            </select>
          </div>

          <div>
            <label htmlFor="checker-search" className="block text-sm font-semibold">
              Search treatment or supplement
            </label>
            <input
              id="checker-search"
              type="search"
              placeholder="e.g. fezolinetant, CBT, black cohosh..."
              value={state.query}
              onChange={(e) => persist({ ...state, query: e.target.value })}
              className="mt-1 min-h-[44px] w-full rounded-lg border border-[var(--color-rule)] bg-[var(--color-paper)] px-3"
            />
          </div>
        </div>
      </form>

      <section aria-labelledby="checker-results-heading" aria-live="polite" className="space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="checker-results-heading" className="text-2xl">
            Evidence verdicts ({filtered.length})
          </h2>
          <p className="text-sm text-[var(--color-ink-muted)]">
            Summaries reflect guideline consensus; never a personal recommendation or dose.
          </p>
        </div>

        {filtered.length === 0 ? (
          <p className="rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)] p-4">
            No treatments matched your filter. Try clearing the search box or switching to &ldquo;All symptoms&rdquo;.
          </p>
        ) : (
          <ul className="space-y-4">
            {filtered.map((item) => {
              const saved = state.bookmarkedIds.includes(item.id);
              return (
                <li
                  key={item.id}
                  className="space-y-2 rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)] p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">
                        {item.category}
                      </span>
                      <h3 className="text-xl font-semibold">{item.name}</h3>
                    </div>
                    {/* Same .grade-* classes the article pages use (globals.css) — one
                        evidence-grade color system site-wide, not a one-off palette. */}
                    <span className={`grade grade-${item.grade}`}>{item.gradeLabel}</span>
                  </div>
                  <p>{item.verdictSummary}</p>
                  <p className="text-sm text-[var(--color-ink-muted)]">
                    <strong>Guideline source:</strong> {item.guidelineSource}
                  </p>
                  <div className="no-print flex flex-wrap items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => toggleBookmark(item.id)}
                      className="tap rounded-lg border border-[var(--color-rule)] bg-[var(--color-paper)] px-3 text-sm font-semibold"
                    >
                      {saved ? 'Remove from my doctor list' : 'Save to ask my doctor'}
                    </button>
                    {item.articleUrl && live.has(item.articleUrl) && (
                      <Link href={item.articleUrl} className="tap text-sm font-semibold text-[var(--color-link)] underline">
                        Read full evidence guide
                      </Link>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="checker-saved-heading" className="space-y-3 rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)] p-5">
        <h2 id="checker-saved-heading" className="text-2xl">
          Options saved to discuss with your clinician ({bookmarkedItems.length})
        </h2>
        {bookmarkedItems.length === 0 ? (
          <p className="text-[var(--color-ink-muted)]">
            Tap &ldquo;Save to ask my doctor&rdquo; on any option above to build a printable shortlist on this device.
          </p>
        ) : (
          <ul className="list-disc space-y-1 pl-6">
            {bookmarkedItems.map((i) => (
              <li key={i.id}>
                <strong>{i.name}</strong> — {i.gradeLabel} ({i.guidelineSource})
              </li>
            ))}
          </ul>
        )}

        <div className="no-print flex flex-wrap gap-3 pt-2">
          <button
            type="button"
            onClick={() => {
              markToolUsed();
              window.print();
            }}
            className="tap rounded-xl bg-[var(--color-accent)] px-5 font-semibold text-white"
          >
            Print shortlist
          </button>
          {bookmarkedItems.length > 0 && (
            <button
              type="button"
              onClick={exportJson}
              className="tap rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper)] px-5 font-semibold"
            >
              Export shortlist (JSON)
            </button>
          )}
          <button
            type="button"
            onClick={deleteAllData}
            className="tap rounded-xl px-3 font-semibold text-[var(--color-urgent)] underline"
          >
            Delete all my data
          </button>
        </div>
      </section>
    </div>
  );
}

