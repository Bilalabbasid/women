'use client';

import { useMemo, useState } from 'react';
import { evaluateUrgentTriggers } from '@/lib/safety/urgent-triggers';
import { UrgentGuidance } from '@/components/safety/urgent-guidance';
import { markToolUsed } from '@/lib/pwa/install-gate';

const STORAGE_KEY = 'menoverdict_12_month_counter_v1';

interface CounterState {
  lastPeriodDate: string;
  usesHormonesOrHysterectomy: boolean;
  hadBleedingAfter12Months: boolean;
  redFlags: string[];
}

const DEFAULT_STATE: CounterState = {
  lastPeriodDate: '',
  usesHormonesOrHysterectomy: false,
  hadBleedingAfter12Months: false,
  redFlags: [],
};

function loadInitialState(): CounterState {
  if (typeof window === 'undefined') return DEFAULT_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as Partial<CounterState>;
    return {
      lastPeriodDate: typeof parsed.lastPeriodDate === 'string' ? parsed.lastPeriodDate : '',
      usesHormonesOrHysterectomy: Boolean(parsed.usesHormonesOrHysterectomy),
      hadBleedingAfter12Months: Boolean(parsed.hadBleedingAfter12Months),
      redFlags: Array.isArray(parsed.redFlags) ? parsed.redFlags : [],
    };
  } catch {
    return DEFAULT_STATE;
  }
}

export interface CounterCalculation {
  valid: boolean;
  daysElapsed: number;
  daysRemaining: number;
  reachedTwelveMonths: boolean;
  anniversaryIso: string;
  anniversaryFormatted: string;
}

export function calculateTwelveMonthWindow(lastPeriodIso: string, now: Date = new Date()): CounterCalculation {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(lastPeriodIso)) {
    return {
      valid: false,
      daysElapsed: 0,
      daysRemaining: 365,
      reachedTwelveMonths: false,
      anniversaryIso: '',
      anniversaryFormatted: '',
    };
  }
  const [y, m, d] = lastPeriodIso.split('-').map(Number);
  const startUtc = Date.UTC(y, m - 1, d);
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const anniversaryDate = new Date(Date.UTC(y + 1, m - 1, d));
  const anniversaryUtc = anniversaryDate.getTime();

  const daysElapsed = Math.max(0, Math.floor((todayUtc - startUtc) / 86_400_000));
  const daysRemaining = Math.max(0, Math.ceil((anniversaryUtc - todayUtc) / 86_400_000));
  const reachedTwelveMonths = todayUtc >= anniversaryUtc;
  const anniversaryIso = anniversaryDate.toISOString().slice(0, 10);
  const anniversaryFormatted = anniversaryDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });

  return {
    valid: startUtc <= todayUtc,
    daysElapsed,
    daysRemaining,
    reachedTwelveMonths,
    anniversaryIso,
    anniversaryFormatted,
  };
}

export function TwelveMonthCounter() {
  const [state, setState] = useState<CounterState>(loadInitialState);

  const persist = (next: CounterState) => {
    setState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      markToolUsed();
    } catch {
      // ignore
    }
  };

  const toggleRedFlag = (flag: string) => {
    const exists = state.redFlags.includes(flag);
    const nextFlags = exists ? state.redFlags.filter((x) => x !== flag) : [...state.redFlags, flag];
    persist({ ...state, redFlags: nextFlags });
  };

  const calc = useMemo(() => calculateTwelveMonthWindow(state.lastPeriodDate), [state.lastPeriodDate]);

  const urgent = useMemo(() => {
    const ids = [...state.redFlags];
    if (state.hadBleedingAfter12Months && !ids.includes('postmenopausal_bleeding')) {
      ids.push('postmenopausal_bleeding');
    }
    return evaluateUrgentTriggers({ symptomIds: ids });
  }, [state.redFlags, state.hadBleedingAfter12Months]);

  const exportJson = () => {
    try {
      const payload = {
        tool: '12-month-counter',
        app: 'MenoVerdict',
        exportedAt: new Date().toISOString(),
        lastPeriodDate: state.lastPeriodDate,
        calculation: calc,
        usesHormonesOrHysterectomy: state.usesHormonesOrHysterectomy,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `menoverdict-12-month-counter-${new Date().toISOString().slice(0, 10)}.json`;
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
    <div className="space-y-6" data-tool-ui="12-month-counter">
      <form onSubmit={(e) => e.preventDefault()} className="space-y-5" aria-describedby="counter-help">
        <p id="counter-help" className="text-[var(--color-ink-muted)]">
          Enter the first day of your last menstrual period to see how many days have passed and when the 12-month mark
          falls. Your date is saved only in this browser on this device.
        </p>

        <div className="rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)] p-4">
          <label htmlFor="last-period-date" className="block font-serif text-xl font-semibold">
            1. First day of your most recent period
          </label>
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
            If a full period started after a gap, enter the new start date — the 12-month count resets with any menstrual
            period.
          </p>
          <input
            id="last-period-date"
            type="date"
            value={state.lastPeriodDate}
            onChange={(e) => persist({ ...state, lastPeriodDate: e.target.value })}
            className="mt-2 min-h-[44px] rounded-lg border border-[var(--color-rule)] bg-[var(--color-paper)] px-3"
          />
        </div>

        <fieldset className="space-y-2 rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)] p-4">
          <legend className="px-1 font-serif text-xl font-semibold">
            2. Context and bleeding safety check
          </legend>
          <label className="tap flex cursor-pointer items-center gap-3 py-1">
            <input
              type="checkbox"
              checked={state.usesHormonesOrHysterectomy}
              onChange={(e) => persist({ ...state, usesHormonesOrHysterectomy: e.target.checked })}
              className="h-5 w-5 shrink-0 accent-[var(--color-accent)]"
            />
            <span>
              I use hormonal contraception (such as a Mirena IUD, pill, implant, or injection), take hormone therapy
              that affects bleeding, or have had a hysterectomy
            </span>
          </label>

          <label className="tap flex cursor-pointer items-center gap-3 py-1">
            <input
              type="checkbox"
              checked={state.hadBleedingAfter12Months}
              onChange={(e) => persist({ ...state, hadBleedingAfter12Months: e.target.checked })}
              className="h-5 w-5 shrink-0 accent-[var(--color-accent)]"
            />
            <span>
              I have had vaginal bleeding or spotting (even once or a small amount) after going 12 months or more without
              a period
            </span>
          </label>

          {[
            {
              id: 'heavy_flow',
              label: 'I have heavy bleeding, bleeding between periods, or bleeding after sex',
            },
            {
              id: 'palpitations',
              label: 'I have heart palpitations with chest pain, shortness of breath, or fainting',
            },
            {
              id: 'low_mood',
              label: 'I am having thoughts of harming myself',
            },
          ].map((item) => (
            <label key={item.id} className="tap flex cursor-pointer items-center gap-3 py-1">
              <input
                type="checkbox"
                checked={state.redFlags.includes(item.id)}
                onChange={() => toggleRedFlag(item.id)}
                className="h-5 w-5 shrink-0 accent-[var(--color-accent)]"
              />
              <span>{item.label}</span>
            </label>
          ))}
        </fieldset>
      </form>

      <section aria-labelledby="counter-result-heading" aria-live="polite" className="space-y-4">
        <h2 id="counter-result-heading" className="text-2xl">
          Your 12-month count
        </h2>

        {/* Safety first */}
        <UrgentGuidance triggers={urgent} />

        {!state.lastPeriodDate ? (
          <p>Enter a date above to calculate your 12-month timeline.</p>
        ) : !calc.valid ? (
          <p className="rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)] p-4">
            Please enter a date in the past or today.
          </p>
        ) : (
          <div className="space-y-4 rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)] p-5">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg bg-[var(--color-paper)] p-4">
                <p className="text-sm text-[var(--color-ink-muted)]">Days since last period</p>
                <p className="mt-1 font-serif text-3xl font-bold">{calc.daysElapsed}</p>
              </div>
              <div className="rounded-lg bg-[var(--color-paper)] p-4">
                <p className="text-sm text-[var(--color-ink-muted)]">Days until 12-month mark</p>
                <p className="mt-1 font-serif text-3xl font-bold">{calc.daysRemaining}</p>
              </div>
              <div className="rounded-lg bg-[var(--color-paper)] p-4">
                <p className="text-sm text-[var(--color-ink-muted)]">12-month date</p>
                <p className="mt-1 font-serif text-xl font-bold">{calc.anniversaryFormatted}</p>
              </div>
            </div>

            {state.usesHormonesOrHysterectomy && (
              <div className="rounded-lg border-l-4 border-[var(--color-accent)] bg-[var(--color-paper)] p-4">
                <p className="font-semibold">
                  Why the 12-month rule cannot confirm menopause on its own when hormones or surgery affect bleeding
                </p>
                <p className="mt-1">
                  NICE NG23 and STRAW+10 define natural menopause as 12 consecutive months without a period{' '}
                  <strong>when not using hormonal contraception</strong> and when no surgical or medical treatment is
                  suppressing periods. Ask your clinician how to assess your stage and when contraception can safely be
                  stopped.
                </p>
              </div>
            )}

            {calc.reachedTwelveMonths ? (
              <p>
                It has been <strong>12 months or more</strong> since the date you entered ({calc.anniversaryFormatted}).
                In people aged 45 or over who are not using hormonal contraception, clinical guidelines (NICE NG23 and
                STRAW+10) use 12 consecutive period-free months to identify natural menopause retrospectively. Remember
                that <strong>any</strong> vaginal bleeding or spotting after this point should be checked by a doctor.
              </p>
            ) : (
              <p>
                You are <strong>{calc.daysElapsed} days</strong> into the 12-month count, with{' '}
                <strong>{calc.daysRemaining} days</strong> until {calc.anniversaryFormatted}. In the STRAW+10 staging
                system, going 60 days or more without a period is common during the late menopausal transition, when a
                period can still return and reset the count.
              </p>
            )}

            <p className="text-sm text-[var(--color-ink-muted)]">
              <strong>Important limitation:</strong> This counter tracks calendar time only. It cannot diagnose
              menopause or rule out other causes of missed periods (including pregnancy, thyroid changes, or premature
              ovarian insufficiency under 40).
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
            Print my timeline
          </button>
          {calc.valid && (
            <button
              type="button"
              onClick={exportJson}
              className="tap rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)] px-5 font-semibold"
            >
              Export my date (JSON)
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

