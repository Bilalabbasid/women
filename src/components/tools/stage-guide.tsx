'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { evaluateUrgentTriggers } from '@/lib/safety/urgent-triggers';
import { UrgentGuidance } from '@/components/safety/urgent-guidance';
import { markToolUsed } from '@/lib/pwa/install-gate';

const STORAGE_KEY = 'menoverdict_stage_guide_v1';

type AgeGroup = '' | 'under_40' | '40_to_44' | '45_plus';
type CycleContext = '' | 'natural_cycles' | 'hormonal_contraception' | 'hysterectomy';
type CyclePattern =
  | ''
  | 'regular'
  | 'varied_7_plus_days'
  | 'skipped_60_plus_days'
  | 'none_12_plus_months';

interface StageGuideState {
  ageGroup: AgeGroup;
  cycleContext: CycleContext;
  cyclePattern: CyclePattern;
  hasVasomotor: boolean;
  redFlags: string[];
}

const DEFAULT_STATE: StageGuideState = {
  ageGroup: '',
  cycleContext: '',
  cyclePattern: '',
  hasVasomotor: false,
  redFlags: [],
};

function loadInitialState(): StageGuideState {
  if (typeof window === 'undefined') return DEFAULT_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as Partial<StageGuideState>;
    return {
      ageGroup: parsed.ageGroup ?? '',
      cycleContext: parsed.cycleContext ?? '',
      cyclePattern: parsed.cyclePattern ?? '',
      hasVasomotor: Boolean(parsed.hasVasomotor),
      redFlags: Array.isArray(parsed.redFlags) ? parsed.redFlags : [],
    };
  } catch {
    return DEFAULT_STATE;
  }
}

/**
 * Interactive STRAW+10 educational stage guide ("Where am I?").
 * Explains how the STRAW+10 reproductive aging criteria and NICE NG23 clinical
 * rules work without diagnosing or scoring the reader. All answers remain on
 * this device in localStorage.
 */
export function StageGuide() {
  const [state, setState] = useState<StageGuideState>(loadInitialState);

  const persist = (next: StageGuideState) => {
    setState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      markToolUsed();
    } catch {
      // ignore storage errors
    }
  };

  const toggleRedFlag = (flag: string) => {
    const exists = state.redFlags.includes(flag);
    const nextFlags = exists ? state.redFlags.filter((f) => f !== flag) : [...state.redFlags, flag];
    persist({ ...state, redFlags: nextFlags });
  };

  const urgent = useMemo(
    () =>
      evaluateUrgentTriggers({
        symptomIds: state.redFlags,
      }),
    [state.redFlags],
  );

  const hasInputs = Boolean(state.ageGroup || state.cycleContext || state.cyclePattern || state.hasVasomotor || state.redFlags.length > 0);

  const exportJson = () => {
    try {
      const payload = {
        tool: 'stage-guide',
        app: 'MenoVerdict',
        exportedAt: new Date().toISOString(),
        answers: state,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `menoverdict-stage-guide-${new Date().toISOString().slice(0, 10)}.json`;
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
    <div className="space-y-6" data-tool-ui="stage-guide">
      <form onSubmit={(e) => e.preventDefault()} className="space-y-5" aria-describedby="stage-guide-help">
        <p id="stage-guide-help" className="text-[var(--color-ink-muted)]">
          Answer the questions below to see how research staging criteria (STRAW+10) and clinical guidelines (NICE NG23)
          describe menstrual changes. Your answers stay on this device and are never sent anywhere.
        </p>

        <fieldset className="space-y-2 rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)] p-4">
          <legend className="px-1 font-serif text-xl font-semibold">1. What is your age group?</legend>
          {[
            { value: 'under_40', label: 'Under 40' },
            { value: '40_to_44', label: '40 to 44' },
            { value: '45_plus', label: '45 or over' },
          ].map((opt) => (
            <label key={opt.value} className="tap flex cursor-pointer items-center gap-3 py-1">
              <input
                type="radio"
                name="ageGroup"
                value={opt.value}
                checked={state.ageGroup === opt.value}
                onChange={() => persist({ ...state, ageGroup: opt.value as AgeGroup })}
                className="h-5 w-5 accent-[var(--color-accent)]"
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </fieldset>

        <fieldset className="space-y-2 rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)] p-4">
          <legend className="px-1 font-serif text-xl font-semibold">
            2. Do anything below affect your periods?
          </legend>
          {[
            {
              value: 'natural_cycles',
              label: 'None of these — I have a uterus and do not use hormonal contraception or HRT',
            },
            {
              value: 'hormonal_contraception',
              label: 'I use a hormonal IUD (such as Mirena), implant, injection, or birth control pill',
            },
            {
              value: 'hysterectomy',
              label: 'I have had a hysterectomy or endometrial ablation',
            },
          ].map((opt) => (
            <label key={opt.value} className="tap flex cursor-pointer items-center gap-3 py-1">
              <input
                type="radio"
                name="cycleContext"
                value={opt.value}
                checked={state.cycleContext === opt.value}
                onChange={() => persist({ ...state, cycleContext: opt.value as CycleContext })}
                className="h-5 w-5 accent-[var(--color-accent)]"
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </fieldset>

        <fieldset className="space-y-2 rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)] p-4">
          <legend className="px-1 font-serif text-xl font-semibold">
            3. How have your periods behaved over the past year?
          </legend>
          {[
            {
              value: 'regular',
              label: 'Regular — cycle length varies by fewer than 7 days from cycle to cycle',
            },
            {
              value: 'varied_7_plus_days',
              label: 'Shifting — cycle length has varied by 7 days or more in consecutive cycles (repeating within 10 cycles)',
            },
            {
              value: 'skipped_60_plus_days',
              label: 'Skipping — I have gone 60 days (about 2 months) or more between periods, but less than 12 months',
            },
            {
              value: 'none_12_plus_months',
              label: 'Stopped — I have had no period or spotting at all for 12 consecutive months or more',
            },
          ].map((opt) => (
            <label key={opt.value} className="tap flex cursor-pointer items-center gap-3 py-1">
              <input
                type="radio"
                name="cyclePattern"
                value={opt.value}
                checked={state.cyclePattern === opt.value}
                onChange={() => persist({ ...state, cyclePattern: opt.value as CyclePattern })}
                className="h-5 w-5 accent-[var(--color-accent)]"
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </fieldset>

        <fieldset className="space-y-2 rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)] p-4">
          <legend className="px-1 font-serif text-xl font-semibold">
            4. Have hot flashes or night sweats started recently?
          </legend>
          <label className="tap flex cursor-pointer items-center gap-3 py-1">
            <input
              type="checkbox"
              checked={state.hasVasomotor}
              onChange={(e) => persist({ ...state, hasVasomotor: e.target.checked })}
              className="h-6 w-6 accent-[var(--color-accent)]"
            />
            <span>Yes, I have noticed hot flashes or night sweats</span>
          </label>
        </fieldset>

        <fieldset className="space-y-2 rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)] p-4">
          <legend className="px-1 font-serif text-xl font-semibold">
            5. Safety check: have you noticed any of the following?
          </legend>
          {[
            {
              id: 'postmenopausal_bleeding',
              label: 'Any vaginal bleeding or spotting after 12 months or more without a period',
            },
            {
              id: 'heavy_flow',
              label: 'Heavy periods affecting daily life, bleeding between periods, or bleeding after sex',
            },
            {
              id: 'palpitations',
              label: 'Heart palpitations that do not go away, or come with chest pain, breathlessness, or faintness',
            },
            {
              id: 'low_mood',
              label: 'Feeling overwhelmed, hopeless, or having thoughts of harming yourself',
            },
          ].map((item) => (
            <label key={item.id} className="tap flex cursor-pointer items-center gap-3 py-1">
              <input
                type="checkbox"
                checked={state.redFlags.includes(item.id)}
                onChange={() => toggleRedFlag(item.id)}
                className="h-6 w-6 accent-[var(--color-accent)]"
              />
              <span>{item.label}</span>
            </label>
          ))}
        </fieldset>
      </form>

      <section aria-labelledby="stage-guide-results" aria-live="polite" className="space-y-4">
        <h2 id="stage-guide-results" className="text-2xl">
          How guidelines describe your answers
        </h2>

        {/* Safety first: urgent guidance renders before anything else, with zero commercial content. */}
        <UrgentGuidance triggers={urgent} />

        {!hasInputs ? (
          <p>Select your answers above to see how clinical guidelines interpret those patterns.</p>
        ) : (
          <div className="space-y-4 rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)] p-5">
            {state.ageGroup === 'under_40' && (
              <div className="rounded-lg border-l-4 border-[var(--color-accent)] bg-[var(--color-paper)] p-4">
                <p className="font-semibold">Under 40: ask a clinician about premature ovarian insufficiency (POI)</p>
                <p className="mt-1">
                  Standard STRAW+10 cycle rules were developed in midlife cohorts and are not designed to identify
                  menopause under age 40 alone. UK guidance (NICE NG23) advises that when menopause-like symptoms or
                  infrequent periods happen under 40, a clinician should investigate specifically for premature ovarian
                  insufficiency, including blood tests on two occasions.
                </p>
              </div>
            )}

            {state.cycleContext === 'hormonal_contraception' || state.cycleContext === 'hysterectomy' ? (
              <div className="space-y-2">
                <p className="font-semibold">
                  Why standard cycle-staging rules (STRAW+10) do not apply directly here
                </p>
                <p>
                  The STRAW+10 staging criteria rely on natural menstrual bleeding patterns. Because you selected{' '}
                  {state.cycleContext === 'hysterectomy'
                    ? 'a prior hysterectomy or ablation'
                    : 'hormonal contraception or a hormonal IUD'}
                  , your bleeding pattern cannot be used on its own to stage perimenopause or count 12 months to
                  menopause. Clinicians look instead at your age, vasomotor symptoms (such as hot flashes and night
                  sweats), and medical history.
                </p>
              </div>
            ) : (
              <>
                {state.cyclePattern === 'regular' && (
                  <div className="space-y-2">
                    <p className="font-semibold">
                      STRAW+10 pattern: Late reproductive stage (before the menopausal transition)
                    </p>
                    <p>
                      In the STRAW+10 research criteria, cycles that remain regular (varying by fewer than 7 days) are
                      classified before the formal menopausal transition, even when subtle cycle shifts or symptoms
                      begin. If you have new symptoms, other causes (such as thyroid changes or iron deficiency) are
                      also worth checking with a clinician.
                    </p>
                  </div>
                )}

                {state.cyclePattern === 'varied_7_plus_days' && (
                  <div className="space-y-2">
                    <p className="font-semibold">
                      STRAW+10 pattern: Resembles the Early Menopausal Transition (Stage -2)
                    </p>
                    <p>
                      In the STRAW+10 criteria, a persistent difference of 7 days or more in the length of consecutive
                      cycles (recurring within 10 cycles) marks the start of the early menopausal transition, when
                      perimenopause begins.
                    </p>
                  </div>
                )}

                {state.cyclePattern === 'skipped_60_plus_days' && (
                  <div className="space-y-2">
                    <p className="font-semibold">
                      STRAW+10 pattern: Resembles the Late Menopausal Transition (Stage -1)
                    </p>
                    <p>
                      In the STRAW+10 criteria, an interval of 60 days or more without a period places a natural cycle
                      pattern in the late menopausal transition, which lasts on average 1 to 3 years before the final
                      menstrual period. Vasomotor symptoms such as hot flashes are most likely during this stage.
                    </p>
                  </div>
                )}

                {state.cyclePattern === 'none_12_plus_months' && (
                  <div className="space-y-2">
                    <p className="font-semibold">
                      STRAW+10 pattern: 12 months without a period marks Postmenopause (Stage +1a/+1b)
                    </p>
                    <p>
                      Both STRAW+10 and NICE NG23 define natural menopause retrospectively after 12 consecutive months
                      with no menstrual bleeding (when not using hormonal contraception and with no other cause). Notice
                      that any vaginal bleeding or spotting after reaching 12 months should always be checked by a
                      doctor.
                    </p>
                  </div>
                )}
              </>
            )}

            {state.ageGroup === '45_plus' && state.hasVasomotor && state.cyclePattern && state.cyclePattern !== 'regular' && (
              <p className="rounded-lg bg-[var(--color-accent-soft)] p-3">
                <strong>Clinical note (NICE NG23):</strong> In otherwise healthy people aged 45 or over who have
                recently started hot flashes or sweats along with changes in periods, UK guidance advises clinicians to
                identify perimenopause from symptoms and cycle history without routine hormone blood tests.
              </p>
            )}

            <p className="text-sm text-[var(--color-ink-muted)]">
              <strong>Important limitation:</strong> This guide explains how published criteria work; it cannot diagnose
              perimenopause or menopause, and it cannot rule out pregnancy, thyroid conditions, or gynaecological causes
              of cycle change. Take a summary of your answers to your clinician.
            </p>
          </div>
        )}

        <div className="no-print flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              markToolUsed();
              window.print();
            }}
            className="tap rounded-xl bg-[var(--color-accent)] px-5 font-semibold text-white"
          >
            Print summary for my appointment
          </button>
          {hasInputs && (
            <button
              type="button"
              onClick={exportJson}
              className="tap rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)] px-5 font-semibold"
            >
              Export my answers (JSON)
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

        <p className="no-print text-sm text-[var(--color-ink-muted)]">
          Want to track cycles and symptoms over time?{' '}
          <Link href="/tools/symptom-tracker/" className="font-semibold text-[var(--color-link)] underline">
            Open the private symptom tracker
          </Link>{' '}
          or use the{' '}
          <Link href="/tools/12-month-counter/" className="font-semibold text-[var(--color-link)] underline">
            12-month period-free counter
          </Link>
          .
        </p>
      </section>
    </div>
  );
}

