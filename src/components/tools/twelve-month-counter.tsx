'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { evaluateUrgentTriggers } from '@/lib/safety/urgent-triggers';
import { UrgentGuidance } from '@/components/safety/urgent-guidance';
import { markToolUsed } from '@/lib/pwa/install-gate';
import { requestPersistentStorage } from '@/lib/pwa/persist-storage';
import type { LocalCycleEntry } from '@/lib/db/schema';
import { Periods, daysBetween } from '@/lib/storage/periods';
import { localToday } from '@/lib/storage/tool-records';
import { migrateLegacyToolStorage } from '@/lib/storage/legacy-migration';
import { describeStorageError } from '@/lib/storage/errors';
import { useToolState, savedLabel, useLocalToday } from '@/components/storage/use-tool-state';
import { btnDanger, btnDangerSolid, btnPrimary, btnSecondary, field, formatIsoDate } from '@/components/storage/styles';

/** Context answers (autosaved). Period dates themselves live in the shared period log. */
interface CounterState {
  usesHormonesOrHysterectomy: boolean;
  hadBleedingAfter12Months: boolean;
  redFlags: string[];
}

const DEFAULT_STATE: CounterState = {
  usesHormonesOrHysterectomy: false,
  hadBleedingAfter12Months: false,
  redFlags: [],
};

function normalize(raw: unknown): CounterState {
  const p = (raw ?? {}) as Partial<CounterState>;
  return {
    usesHormonesOrHysterectomy: Boolean(p.usesHormonesOrHysterectomy),
    hadBleedingAfter12Months: Boolean(p.hadBleedingAfter12Months),
    redFlags: Array.isArray(p.redFlags) ? p.redFlags.filter((x): x is string => typeof x === 'string') : [],
  };
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

type Msg = { kind: 'ok' | 'error'; text: string } | null;

export function TwelveMonthCounter() {
  const { state, update, status } = useToolState('12-month-counter', DEFAULT_STATE, normalize);
  const [periods, setPeriods] = useState<LocalCycleEntry[] | null>(null);
  const [newDate, setNewDate] = useState('');
  const today = useLocalToday();
  const [msg, setMsg] = useState<Msg>(null);
  const [editing, setEditing] = useState<{ id: string; date: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    let alive = true;
    migrateLegacyToolStorage()
      .then(() => Periods.list())
      .then(
        (rows) => {
          if (alive) setPeriods(rows);
        },
        (err) => {
          if (!alive) return;
          setPeriods([]);
          setMsg({ kind: 'error', text: describeStorageError(err) });
        },
      );
    return () => {
      alive = false;
    };
  }, [version]);

  const act = async (fn: () => Promise<string>) => {
    setMsg(null);
    try {
      const text = await fn();
      reload();
      setMsg({ kind: 'ok', text });
      markToolUsed();
    } catch (err) {
      setMsg({ kind: 'error', text: err instanceof Error && err.name === 'Error' ? err.message : describeStorageError(err) });
    }
  };

  const addPeriod = () =>
    act(async () => {
      if (!newDate) throw new Error('Choose the date your period started.');
      if (newDate > localToday()) throw new Error('That date is in the future. Enter the first day of a period that has started.');
      const added = await Periods.add(newDate);
      if (!added) throw new Error(`${formatIsoDate(newDate)} is already in your list.`);
      setNewDate('');
      void requestPersistentStorage();
      return `Added ${formatIsoDate(newDate)}. Your count now runs from your most recent period.`;
    });

  const toggleRedFlag = (flag: string) => {
    const exists = state.redFlags.includes(flag);
    update({ ...state, redFlags: exists ? state.redFlags.filter((x) => x !== flag) : [...state.redFlags, flag] });
  };

  const list = useMemo(() => periods ?? [], [periods]);
  const latest = list[0]?.startDate ?? '';
  const calc = useMemo(() => calculateTwelveMonthWindow(latest), [latest]);

  const urgent = useMemo(() => {
    const ids = [...state.redFlags];
    if (state.hadBleedingAfter12Months && !ids.includes('postmenopausal_bleeding')) ids.push('postmenopausal_bleeding');
    return evaluateUrgentTriggers({ symptomIds: ids });
  }, [state.redFlags, state.hadBleedingAfter12Months]);

  // Gaps between consecutive logged periods, oldest first.
  const gaps = useMemo(() => {
    const asc = [...list].reverse();
    return asc.slice(1).map((p, i) => ({ id: p.id, from: asc[i].startDate, to: p.startDate, days: daysBetween(asc[i].startDate, p.startDate) }));
  }, [list]);
  const maxGap = Math.max(1, ...gaps.map((g) => g.days));

  return (
    <div className="space-y-6" data-tool-ui="12-month-counter">
      <form onSubmit={(e) => e.preventDefault()} className="space-y-5" aria-describedby="counter-help">
        <p id="counter-help" className="text-[var(--color-ink-muted)]">
          Log the first day of each period. The count runs from your most recent one, and every date is saved in this
          browser on this device, never sent anywhere.
        </p>

        <div className="panel gap-3">
          <h3 className="panel-title">1. First day of your periods</h3>
          <p className="text-sm text-[var(--color-ink-muted)]">
            Add the date your most recent period started. If a period comes back after a gap, add the new date — any
            period restarts the 12-month count. Adding earlier dates too shows the gaps between your periods.
          </p>
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[12rem]">
              <label htmlFor="last-period-date" className="block text-sm font-semibold">
                Period start date
              </label>
              <input
                id="last-period-date"
                type="date"
                value={newDate}
                max={today || undefined}
                onChange={(e) => setNewDate(e.target.value)}
                className={`mt-1 ${field}`}
              />
            </div>
            <button type="button" onClick={() => void addPeriod()} disabled={!newDate} className={btnPrimary}>
              Add this date
            </button>
          </div>
          <p role="status" aria-live="polite" className={msg?.kind === 'error' ? 'font-semibold text-[var(--color-urgent)]' : 'text-[var(--color-accent)]'}>
            {msg?.text ?? ''}
          </p>

          {periods === null ? (
            <p className="text-[var(--color-ink-muted)]">Loading your dates…</p>
          ) : list.length === 0 ? (
            <p className="empty-state py-6">No period dates logged yet.</p>
          ) : (
            <ul className="space-y-2" aria-label="Your logged period start dates">
              {list.map((p, i) => {
                const prev = list[i + 1];
                return (
                  <li key={p.id} className="space-y-2 rounded-lg border border-[var(--color-rule)] bg-[var(--color-paper)] p-3">
                    {editing?.id === p.id ? (
                      <div className="flex flex-wrap items-end gap-2">
                        <div>
                          <label htmlFor={`edit-${p.id}`} className="block text-sm font-semibold">
                            Start date
                          </label>
                          <input
                            id={`edit-${p.id}`}
                            type="date"
                            max={today || undefined}
                            value={editing.date}
                            onChange={(e) => setEditing({ ...editing, date: e.target.value })}
                            className={`mt-1 ${field}`}
                          />
                        </div>
                        <button
                          type="button"
                          className={btnPrimary}
                          onClick={() =>
                            void act(async () => {
                              if (editing.date > localToday()) throw new Error('That date is in the future.');
                              await Periods.update(p.id, { startDate: editing.date });
                              setEditing(null);
                              return 'Date updated.';
                            })
                          }
                        >
                          Save
                        </button>
                        <button type="button" className={btnSecondary} onClick={() => setEditing(null)}>
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p>
                          <span className="font-semibold">{formatIsoDate(p.startDate)}</span>
                          {i === 0 && <span className="text-[var(--color-ink-muted)]"> · most recent, counting from here</span>}
                          {prev && (
                            <span className="text-[var(--color-ink-muted)]"> · {daysBetween(prev.startDate, p.startDate)} days after the one before</span>
                          )}
                        </p>
                        {confirmDelete === p.id ? (
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold">Delete this date?</span>
                            <button
                              type="button"
                              className={btnDangerSolid}
                              onClick={() =>
                                void act(async () => {
                                  await Periods.remove(p.id);
                                  setConfirmDelete(null);
                                  return `Deleted ${formatIsoDate(p.startDate)}.`;
                                })
                              }
                            >
                              Yes, delete
                            </button>
                            <button type="button" className={btnSecondary} onClick={() => setConfirmDelete(null)}>
                              Cancel
                            </button>
                          </span>
                        ) : (
                          <span className="no-print flex flex-wrap gap-2">
                            <button type="button" className={btnSecondary} onClick={() => setEditing({ id: p.id, date: p.startDate })}>
                              Edit<span className="sr-only"> {formatIsoDate(p.startDate)}</span>
                            </button>
                            <button type="button" className={btnDanger} onClick={() => setConfirmDelete(p.id)}>
                              Delete<span className="sr-only"> {formatIsoDate(p.startDate)}</span>
                            </button>
                          </span>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <fieldset className="panel min-w-0 gap-1">
          <legend className="panel-title mb-1">2. Context and bleeding safety check</legend>
          <label className="check">
            <input
              type="checkbox"
              checked={state.usesHormonesOrHysterectomy}
              onChange={(e) => update({ ...state, usesHormonesOrHysterectomy: e.target.checked })}
             
            />
            <span>
              I use hormonal contraception (such as a Mirena IUD, pill, implant, or injection), take hormone therapy
              that affects bleeding, or have had a hysterectomy
            </span>
          </label>

          <label className="check">
            <input
              type="checkbox"
              checked={state.hadBleedingAfter12Months}
              onChange={(e) => update({ ...state, hadBleedingAfter12Months: e.target.checked })}
             
            />
            <span>
              I have had vaginal bleeding or spotting (even once or a small amount) after going 12 months or more without
              a period
            </span>
          </label>

          {[
            { id: 'heavy_flow', label: 'I have heavy bleeding, bleeding between periods, or bleeding after sex' },
            { id: 'palpitations', label: 'I have heart palpitations with chest pain, shortness of breath, or fainting' },
            { id: 'low_mood', label: 'I am having thoughts of harming myself' },
          ].map((item) => (
            <label key={item.id} className="check">
              <input
                type="checkbox"
                checked={state.redFlags.includes(item.id)}
                onChange={() => toggleRedFlag(item.id)}
               
              />
              <span>{item.label}</span>
            </label>
          ))}
          <p className={`text-sm ${status.error ? 'font-semibold text-[var(--color-urgent)]' : 'text-[var(--color-ink-muted)]'}`}>
            {savedLabel(status)}
          </p>
        </fieldset>
      </form>

      <section aria-labelledby="counter-result-heading" aria-live="polite" className="space-y-4">
        <h2 id="counter-result-heading" className="text-2xl">
          Your 12-month count
        </h2>

        {/* Safety first */}
        <UrgentGuidance triggers={urgent} />

        {!latest ? (
          <p>Add the date your most recent period started to see your 12-month timeline.</p>
        ) : !calc.valid ? (
          <p className="panel">
            Your most recent date is in the future. Edit it to the day your period actually started.
          </p>
        ) : (
          <div className="panel panel-feature gap-4">
            <div className="stats">
              <div className="stat">
                <p className="text-sm text-[var(--color-ink-muted)]">Days since last period</p>
                <p className="stat-value mt-1">{calc.daysElapsed}</p>
              </div>
              <div className="stat">
                <p className="text-sm text-[var(--color-ink-muted)]">Days until 12-month mark</p>
                <p className="stat-value mt-1">{calc.daysRemaining}</p>
              </div>
              <div className="stat">
                <p className="text-sm text-[var(--color-ink-muted)]">12-month date</p>
                <p className="mt-1 font-serif text-[1.35rem] font-semibold leading-tight">{calc.anniversaryFormatted}</p>
              </div>
            </div>

            {state.usesHormonesOrHysterectomy && (
              <div className="rounded-[var(--radius)] border-l-4 border-[var(--accent)] bg-[var(--accent-soft)] p-4">
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
                It has been <strong>12 months or more</strong> since your most recent logged period (
                {formatIsoDate(latest)}). In people aged 45 or over who are not using hormonal contraception, clinical
                guidelines (NICE NG23 and STRAW+10) use 12 consecutive period-free months to identify natural menopause
                retrospectively. Remember that <strong>any</strong> vaginal bleeding or spotting after this point should be
                checked by a doctor.
              </p>
            ) : (
              <p>
                You are <strong>{calc.daysElapsed} days</strong> into the 12-month count, with{' '}
                <strong>{calc.daysRemaining} days</strong> until {calc.anniversaryFormatted}. In the STRAW+10 staging
                system, going 60 days or more without a period is common during the late menopausal transition, when a
                period can still return and reset the count.
              </p>
            )}

            {gaps.length > 0 && (
              <figure className="space-y-2">
                <figcaption className="font-semibold">Days between your logged periods</figcaption>
                <ul className="space-y-1.5">
                  {gaps.map((g) => (
                    <li key={g.id} className="grid grid-cols-[7rem_1fr_3.5rem] items-center gap-2 text-sm">
                      <span className="text-[var(--color-ink-muted)]">{g.to}</span>
                      <span className="h-3 rounded bg-[var(--color-accent-soft)]" aria-hidden="true">
                        <span className="block h-3 rounded bg-[var(--color-accent)]" style={{ width: `${(g.days / maxGap) * 100}%` }} />
                      </span>
                      <span className="text-right font-semibold">{g.days} d</span>
                    </li>
                  ))}
                </ul>
                <p className="text-sm text-[var(--color-ink-muted)]">
                  STRAW+10 describes gaps of 60 days or more as part of the late menopausal transition. Your clinician can
                  read these alongside your age, symptoms and history.
                </p>
              </figure>
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
            disabled={!latest}
            onClick={() => {
              markToolUsed();
              window.print();
            }}
            className={btnPrimary}
          >
            Print my timeline
          </button>
        </div>
        <p className="no-print text-sm text-[var(--color-ink-muted)]">
          Your dates stay in this browser on this device until you delete them. Clearing browsing data, private browsing,
          or changing device can remove them, so back up now and then.{' '}
          <Link href="/app/storage/" className="font-semibold text-[var(--color-link)] underline">
            Manage storage, back up or restore
          </Link>
        </p>
      </section>
    </div>
  );
}
