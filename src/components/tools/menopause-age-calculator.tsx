'use client';

import { useMemo, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import {
  MENOPAUSE_AGE_FACTS,
  calculateMenopauseAgeContext,
  type CantTellReason,
  type PeriodStatus,
  type Smoking,
} from '@/lib/tools/menopause-age';
import { field } from '@/components/storage/styles';

/** Parses a number field; empty or junk input becomes null. */
function num(v: string): number | null {
  if (v.trim() === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const noSubscription = () => () => {};

/** Today's local date on the client, '' during server render (avoids a hydration mismatch). */
function useTodayIso(): string {
  return useSyncExternalStore(noSubscription, todayIso, () => '');
}

const CANT_TELL: Array<{ id: CantTellReason; label: string }> = [
  { id: 'contraception', label: 'Hormonal contraception (pill, implant, injection)' },
  { id: 'hormonal-iud', label: 'A hormonal IUD (such as Mirena)' },
  { id: 'hysterectomy', label: 'A hysterectomy' },
  { id: 'ablation', label: 'Endometrial ablation or another treatment that changed my bleeding' },
];

const { from, to } = MENOPAUSE_AGE_FACTS.typicalRange;

/**
 * Menopause age calculator. Stateless: inputs live in React state only, so
 * nothing is saved and nothing leaves the page. It never predicts an age.
 */
export function MenopauseAgeCalculator() {
  const [ageMode, setAgeMode] = useState<'age' | 'birthYear'>('age');
  const [ageText, setAgeText] = useState('');
  const [yearText, setYearText] = useState('');
  const [periods, setPeriods] = useState<PeriodStatus | ''>('');
  const [lastPeriod, setLastPeriod] = useState('');
  const [reason, setReason] = useState<CantTellReason | ''>('');
  const [motherText, setMotherText] = useState('');
  const [smoking, setSmoking] = useState<Smoking>('');
  const [cancerTreatment, setCancerTreatment] = useState(false);
  const [ovariesRemoved, setOvariesRemoved] = useState(false);
  const today = useTodayIso();
  const maxBirthYear = today ? Number(today.slice(0, 4)) - 18 : undefined;

  const result = useMemo(
    () =>
      calculateMenopauseAgeContext({
        age: ageMode === 'age' ? num(ageText) : null,
        birthYear: ageMode === 'birthYear' ? num(yearText) : null,
        periods,
        lastPeriodIso: lastPeriod,
        cantTellReason: reason,
        mothersAge: num(motherText),
        smoking,
        cancerTreatment,
        ovariesRemoved,
      }),
    [ageMode, ageText, yearText, periods, lastPeriod, reason, motherText, smoking, cancerTreatment, ovariesRemoved],
  );

  const ageEntered = ageMode === 'age' ? ageText.trim() !== '' : yearText.trim() !== '';
  const reset = () => {
    setAgeText('');
    setYearText('');
    setPeriods('');
    setLastPeriod('');
    setReason('');
    setMotherText('');
    setSmoking('');
    setCancerTreatment(false);
    setOvariesRemoved(false);
  };

  return (
    <div className="space-y-6" data-tool-ui="menopause-age-calculator">
      <form onSubmit={(e) => e.preventDefault()} className="space-y-5" aria-describedby="mac-help">
        <p id="mac-help" className="text-[var(--color-ink-muted)]">
          Answer what you can. Nothing is saved or sent anywhere: your answers stay on this page and disappear when you
          close it.
        </p>

        <fieldset className="panel min-w-0 gap-3">
          <legend className="panel-title mb-1">1. Your age</legend>
          <div className="flex flex-wrap gap-x-6">
            <label className="check">
              <input type="radio" name="mac-age-mode" checked={ageMode === 'age'} onChange={() => setAgeMode('age')} />
              <span>Enter my age</span>
            </label>
            <label className="check">
              <input type="radio" name="mac-age-mode" checked={ageMode === 'birthYear'} onChange={() => setAgeMode('birthYear')} />
              <span>Enter my birth year</span>
            </label>
          </div>
          {ageMode === 'age' ? (
            <div className="max-w-[12rem]">
              <label htmlFor="mac-age" className="block text-sm font-semibold">
                Age in years
              </label>
              <input
                id="mac-age"
                type="number"
                inputMode="numeric"
                min={18}
                max={100}
                value={ageText}
                onChange={(e) => setAgeText(e.target.value)}
                className={`mt-1 ${field}`}
              />
            </div>
          ) : (
            <div className="max-w-[12rem]">
              <label htmlFor="mac-birth-year" className="block text-sm font-semibold">
                Year you were born
              </label>
              <input
                id="mac-birth-year"
                type="number"
                inputMode="numeric"
                min={1926}
                max={maxBirthYear}
                value={yearText}
                onChange={(e) => setYearText(e.target.value)}
                className={`mt-1 ${field}`}
              />
            </div>
          )}
          {ageEntered && !result.ready && (
            <p className="text-sm font-semibold text-[var(--color-urgent)]">Enter an age between 18 and 100.</p>
          )}
        </fieldset>

        <fieldset className="panel min-w-0 gap-1">
          <legend className="panel-title mb-1">2. Have your periods stopped?</legend>
          {(
            [
              { id: 'still', label: 'No, I still have periods (regular or not)' },
              { id: 'stopped', label: 'Yes, they have stopped' },
              { id: 'cant-tell', label: "I can't tell, because something else affects my bleeding" },
            ] as Array<{ id: PeriodStatus; label: string }>
          ).map((o) => (
            <label key={o.id} className="check">
              <input type="radio" name="mac-periods" checked={periods === o.id} onChange={() => setPeriods(o.id)} />
              <span>{o.label}</span>
            </label>
          ))}

          {periods === 'stopped' && (
            <div className="mt-2 max-w-[14rem]">
              <label htmlFor="mac-last-period" className="block text-sm font-semibold">
                First day of your last period
              </label>
              <input
                id="mac-last-period"
                type="date"
                max={today || undefined}
                value={lastPeriod}
                onChange={(e) => setLastPeriod(e.target.value)}
                className={`mt-1 ${field}`}
              />
            </div>
          )}

          {periods === 'cant-tell' && (
            <fieldset className="mt-2 min-w-0">
              <legend className="text-sm font-semibold">What affects your bleeding?</legend>
              {CANT_TELL.map((o) => (
                <label key={o.id} className="check">
                  <input type="radio" name="mac-reason" checked={reason === o.id} onChange={() => setReason(o.id)} />
                  <span>{o.label}</span>
                </label>
              ))}
            </fieldset>
          )}
        </fieldset>

        <fieldset className="panel min-w-0 gap-3">
          <legend className="panel-title mb-1">3. Optional: things linked to earlier menopause</legend>
          <div className="max-w-[16rem]">
            <label htmlFor="mac-mother" className="block text-sm font-semibold">
              Age your mother reached menopause, if you know
            </label>
            <input
              id="mac-mother"
              type="number"
              inputMode="numeric"
              min={20}
              max={70}
              value={motherText}
              onChange={(e) => setMotherText(e.target.value)}
              className={`mt-1 ${field}`}
            />
          </div>
          <fieldset className="min-w-0">
            <legend className="text-sm font-semibold">Do you smoke?</legend>
            <div className="flex flex-wrap gap-x-6">
              {(
                [
                  { id: 'never', label: 'Never' },
                  { id: 'past', label: 'I used to' },
                  { id: 'current', label: 'Yes' },
                ] as Array<{ id: Smoking; label: string }>
              ).map((o) => (
                <label key={o.id} className="check">
                  <input type="radio" name="mac-smoking" checked={smoking === o.id} onChange={() => setSmoking(o.id)} />
                  <span>{o.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset className="min-w-0">
            <legend className="text-sm font-semibold">Have you had either of these?</legend>
            <label className="check">
              <input type="checkbox" checked={cancerTreatment} onChange={(e) => setCancerTreatment(e.target.checked)} />
              <span>Chemotherapy or radiation to the pelvis</span>
            </label>
            <label className="check">
              <input type="checkbox" checked={ovariesRemoved} onChange={(e) => setOvariesRemoved(e.target.checked)} />
              <span>Surgery to remove both ovaries</span>
            </label>
          </fieldset>
        </fieldset>
      </form>

      <section aria-labelledby="mac-result-heading" aria-live="polite" className="space-y-4">
        <h2 id="mac-result-heading" className="text-2xl">
          Your menopause age context
        </h2>

        {!result.ready ? (
          <p>Enter your age to see where you are compared with the typical age range.</p>
        ) : (
          <div className="panel panel-feature gap-4">
            <div className="stats">
              <div className="stat">
                <p className="text-sm text-[var(--color-ink-muted)]">Your age{result.ageFromBirthYear ? ' (about)' : ''}</p>
                <p className="stat-value mt-1">{result.age}</p>
              </div>
              <div className="stat">
                <p className="text-sm text-[var(--color-ink-muted)]">Most common range</p>
                <p className="stat-value mt-1">
                  {from} to {to}
                </p>
              </div>
              <div className="stat">
                <p className="text-sm text-[var(--color-ink-muted)]">
                  {result.yearsToRangeStart > 0 ? `Years until ${from}` : result.yearsPastRange > 0 ? `Years past ${to}` : 'Where you are'}
                </p>
                <p className="stat-value mt-1">
                  {result.yearsToRangeStart > 0 ? result.yearsToRangeStart : result.yearsPastRange > 0 ? result.yearsPastRange : 'In range'}
                </p>
              </div>
            </div>

            <p>
              {result.yearsToRangeStart > 0 ? (
                <>
                  You are <strong>{result.yearsToRangeStart} {result.yearsToRangeStart === 1 ? 'year' : 'years'}</strong> from
                  the start of the {from} to {to} range in which most people reach menopause.
                </>
              ) : result.yearsPastRange > 0 ? (
                <>
                  You are <strong>{result.yearsPastRange} {result.yearsPastRange === 1 ? 'year' : 'years'}</strong> past the{' '}
                  {from} to {to} range in which most people reach menopause.
                </>
              ) : (
                <>
                  You are <strong>inside the {from} to {to} range</strong> in which most people reach menopause.
                </>
              )}{' '}
              That is a range for groups of people. No calculator or test can tell you your own age in advance.
            </p>

            {result.twelveMonth &&
              (result.twelveMonth.valid ? (
                <div className="rounded-[var(--radius)] border-l-4 border-[var(--accent)] bg-[var(--accent-soft)] p-4">
                  <p className="font-semibold">
                    {result.twelveMonth.reached
                      ? `You reached 12 months without a period on ${result.twelveMonth.formatted}.`
                      : `Your 12-month date: ${result.twelveMonth.formatted} (${result.twelveMonth.daysRemaining} days to go).`}
                  </p>
                  <p className="mt-1">
                    Menopause is confirmed looking back, after 12 months in a row with no period. If a period comes back
                    before then, the count starts again.{' '}
                    <Link href="/tools/12-month-counter/" className="font-semibold text-[var(--color-link)] underline">
                      Track it with the 12-month counter
                    </Link>
                  </p>
                </div>
              ) : (
                <p className="text-sm font-semibold text-[var(--color-urgent)]">
                  Check the date of your last period: it can&apos;t be in the future.
                </p>
              ))}

            <div>
              <p className="font-semibold">Average ages, as each source reports them</p>
              <ul className="mt-2 grid gap-2">
                {MENOPAUSE_AGE_FACTS.averages.map((a) => (
                  <li key={a.source} className="flex flex-wrap items-baseline gap-x-2">
                    <span className="font-serif text-[1.35rem] font-semibold">{a.age}</span>
                    <span>
                      {a.note} ({a.label})
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {result.notes.length > 0 && (
              <ul className="space-y-3" aria-label="Notes based on your answers">
                {result.notes.map((n) => (
                  <li
                    key={n.id}
                    className={
                      n.kind === 'check'
                        ? 'rounded-[var(--radius)] border-l-4 border-[var(--color-urgent)] bg-[var(--color-paper)] p-4'
                        : 'rounded-[var(--radius)] border border-[var(--color-rule)] bg-[var(--color-paper)] p-4'
                    }
                  >
                    <p className="font-semibold">{n.title}</p>
                    <p className="mt-1">{n.text}</p>
                  </li>
                ))}
              </ul>
            )}

            <p className="text-sm text-[var(--color-ink-muted)]">
              <strong>Important limitation:</strong> this gives context, not a prediction or a diagnosis. Any vaginal
              bleeding after 12 months without a period should be checked by a doctor.
            </p>
          </div>
        )}

        <ul className="no-print grid gap-2 sm:grid-cols-3" aria-label="Next steps">
          <li>
            <Link href="/tools/stage-guide/" className="tap min-h-[var(--tap)] items-center font-semibold text-[var(--color-link)] underline">
              Which stage am I in? Take the stage guide
            </Link>
          </li>
          <li>
            <Link href="/perimenopause/age/" className="tap min-h-[var(--tap)] items-center font-semibold text-[var(--color-link)] underline">
              What age perimenopause starts
            </Link>
          </li>
          <li>
            <Link href="/menopause/age/" className="tap min-h-[var(--tap)] items-center font-semibold text-[var(--color-link)] underline">
              The average age of menopause
            </Link>
          </li>
        </ul>

        <div className="no-print">
          <button type="button" onClick={reset} className="btn btn-secondary">
            Clear my answers
          </button>
        </div>
      </section>
    </div>
  );
}
