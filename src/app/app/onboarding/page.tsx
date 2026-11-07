'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon, QuickPick } from '@/components/app/kit';
import { IlloDoctor, IlloEmpty, IlloSleep } from '@/components/ui/illustrations';
import { STANDARD_SYMPTOMS } from '@/lib/config/symptoms';
import { LocalDataService } from '@/lib/db/service';
import { setPreference } from '@/lib/storage/consent';
import {
  DEFAULT_LOG_REMINDER,
  LOG_REMINDER_KEY,
  type LogReminderFrequency,
  type LogReminderSettings,
} from '@/lib/tracker/nudges';

type Step = 1 | 2 | 3;
const STEPS: Step[] = [1, 2, 3];

/**
 * First run: three short, skippable screens.
 *  1. What it does   2. Where your data lives   3. Daily or weekly (+ optional symptoms to keep handy)
 * Saves only what she chooses: pinned symptoms (added to any she already pinned),
 * and a reminder frequency if she picks one. Nothing is pre-selected.
 */
export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  // Nothing pre-selected: only symptoms she picks are pinned (DECISIONS.md D-006).
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [frequency, setFrequency] = useState<Exclude<LogReminderFrequency, 'off'> | null>(null);
  const [showAll, setShowAll] = useState(false);

  const toggleSymptom = (id: string) => {
    setSelectedSymptoms((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  };

  const handleFinish = async () => {
    try {
      // Add to any symptoms she already pinned (e.g. from the symptoms checklist); never replace them.
      const existing: unknown = JSON.parse(localStorage.getItem('menowell_pinned_symptoms') ?? '[]');
      const kept = Array.isArray(existing) ? existing.filter((x): x is string => typeof x === 'string') : [];
      localStorage.setItem('menowell_pinned_symptoms', JSON.stringify([...new Set([...kept, ...selectedSymptoms])]));
    } catch {
      // Storage blocked: the tracker still works, pins just aren't remembered.
    }
    if (frequency) {
      // Only when she picked one. Uses the same reminder setting as Settings → Reminders.
      try {
        const current = await LocalDataService.getSetting<LogReminderSettings>(LOG_REMINDER_KEY, DEFAULT_LOG_REMINDER);
        await LocalDataService.setSetting(LOG_REMINDER_KEY, { ...DEFAULT_LOG_REMINDER, ...current, frequency });
      } catch {
        // Not critical: she can set it in Settings.
      }
    }
    // A convenience flag only: stored with her preferences consent, otherwise not at all.
    setPreference('menowell_onboarding_completed', 'true');
    router.push('/app/today/');
  };

  const next = () => (step < 3 ? setStep((s) => (s + 1) as Step) : void handleFinish());

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-xl flex-col px-4 pt-3 pb-6">
      {/* Top bar: back, progress dots, skip */}
      <div className="flex min-h-[3.5rem] items-center justify-between gap-3">
        {step > 1 ? (
          <button type="button" onClick={() => setStep((s) => (s - 1) as Step)} className="icon-btn -ml-2" aria-label="Back">
            <Icon.Back width={24} height={24} />
          </button>
        ) : (
          <span className="w-12" aria-hidden="true" />
        )}

        <div
          className="progress-dots"
          role="progressbar"
          aria-label="Getting started"
          aria-valuemin={1}
          aria-valuemax={3}
          aria-valuenow={step}
          aria-valuetext={`Step ${step} of 3`}
        >
          {STEPS.map((s) => (
            <span key={s} className={s === step ? 'is-current' : s < step ? 'is-done' : ''} />
          ))}
        </div>

        <button type="button" onClick={() => void handleFinish()} className="btn btn-quiet btn-sm">
          Skip
        </button>
      </div>

      <div className="flex flex-1 flex-col justify-center py-6" aria-live="polite">
        {step === 1 && (
          <section aria-labelledby="ob-1" className="grid justify-items-center gap-5 text-center">
            <IlloDoctor className="h-32 w-32" />
            <p className="eyebrow">Step 1 of 3</p>
            <h1 id="ob-1" className="text-[length:var(--fs-h1)] leading-tight">
              A private diary for your symptoms
            </h1>
            <p className="max-w-[30rem] text-[length:var(--fs-lead)] text-[var(--ink-muted)]">
              Log how you feel in under a minute. Over a few weeks you’ll see patterns, and you can print a one-page
              report to take to your doctor.
            </p>
            <ul className="grid w-full max-w-[26rem] gap-2 text-left">
              {['Log today in under a minute', 'See your patterns over time', 'Print a report for your appointment'].map((t) => (
                <li key={t} className="flex items-center gap-3 rounded-[var(--radius)] bg-[var(--paper-raised)] px-4 py-3 border border-[var(--rule)]">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--accent)] text-[var(--on-accent)]">
                    <Icon.Check width={16} height={16} />
                  </span>
                  <span className="font-bold">{t}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {step === 2 && (
          <section aria-labelledby="ob-2" className="grid justify-items-center gap-5 text-center">
            <IlloEmpty className="h-32 w-32" />
            <p className="eyebrow">Step 2 of 3</p>
            <h1 id="ob-2" className="text-[length:var(--fs-h1)] leading-tight">
              Your entries stay on this device
            </h1>
            <p className="max-w-[30rem] text-[length:var(--fs-lead)] text-[var(--ink-muted)]">
              Everything you log is saved in this browser. There’s no account, nothing is uploaded, and nothing is
              deleted unless you delete it.
            </p>
            <div className="panel w-full max-w-[30rem] text-left">
              <p className="flex items-start gap-3">
                <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
                  <Icon.Lock width={18} height={18} />
                </span>
                <span>
                  <strong className="block">One thing to know</strong>
                  <span className="text-[var(--ink-muted)]">
                    It isn’t synced to other devices. Clearing your browsing data or using private browsing can remove
                    it. You can download a backup any time from Settings → Manage storage.
                  </span>
                </span>
              </p>
            </div>
          </section>
        )}

        {step === 3 && (
          <section aria-labelledby="ob-3" className="grid gap-6">
            <div className="grid justify-items-center gap-4 text-center">
              <IlloSleep className="h-28 w-28" />
              <p className="eyebrow">Step 3 of 3</p>
              <h1 id="ob-3" className="text-[length:var(--fs-h1)] leading-tight">
                Daily or weekly?
              </h1>
              <p className="max-w-[30rem] text-[length:var(--fs-lead)] text-[var(--ink-muted)]">
                Pick what you’ll actually keep up. We’ll remind you on Today when it’s time. You can change this later.
              </p>
            </div>

            <QuickPick
              label="How often you’ll log"
              columns={2}
              value={frequency}
              onChange={setFrequency}
              options={[
                { value: 'daily', label: 'Every day' },
                { value: 'weekly', label: 'Once a week' },
              ]}
            />

            <fieldset className="grid min-w-0 gap-3 border-0 p-0">
              <legend className="label">Symptoms to keep handy (optional)</legend>
              <p className="hint">These show first when you log. Tap any you notice.</p>
              <div className="chip-row" role="group" aria-label="Symptoms to keep handy">
                {(showAll ? STANDARD_SYMPTOMS : STANDARD_SYMPTOMS.slice(0, 8)).map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className="chip"
                    aria-pressed={selectedSymptoms.includes(s.id)}
                    onClick={() => toggleSymptom(s.id)}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
              {!showAll && (
                <button type="button" className="btn btn-quiet btn-sm justify-self-start" onClick={() => setShowAll(true)}>
                  Show all {STANDARD_SYMPTOMS.length} symptoms
                </button>
              )}
            </fieldset>
          </section>
        )}
      </div>

      <div className="grid gap-2 border-t border-[var(--rule)] pt-4">
        <button type="button" onClick={next} className="btn btn-primary btn-lg btn-block">
          {step < 3 ? 'Continue' : 'Start my diary'}
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
