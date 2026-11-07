'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppHeader } from '@/components/app/app-header';
import { AppPage, Icon, LevelPicker, Panel, SectionHead } from '@/components/app/kit';
import { IlloEmpty } from '@/components/ui/illustrations';
import { LocalDataService } from '@/lib/db/service';
import { LocalCheckin, LocalSymptomEntry, LocalTreatment, LocalTreatmentEvent } from '@/lib/db/schema';
import { NotificationService } from '@/lib/notifications/treatment-reminders';
import { describeStorageError } from '@/lib/storage/errors';
import { useLocalToday } from '@/components/storage/use-tool-state';
import { getMissedDays } from '@/lib/tracker/catch-up';
import { TodayNudges } from '@/components/app/today-nudges';
import { canStorePreferences } from '@/lib/storage/consent';

const CATCH_UP_DISMISSED_KEY = 'catch_up_dismissed_on';

const FEELINGS = [
  { value: 1 as const, label: 'Rough' },
  { value: 2 as const, label: 'Low' },
  { value: 3 as const, label: 'Okay' },
  { value: 4 as const, label: 'Good' },
  { value: 5 as const, label: 'Great' },
];
const FEELING_WORD: Record<number, string> = { 1: 'Rough', 2: 'Low', 3: 'Okay', 4: 'Good', 5: 'Great' };

/** "Mon 3 Nov" from "2026-11-03", in her local calendar. */
function shortDay(date: string) {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function DashboardPage() {
  // Her local date; '' during server render so hydration matches.
  const todayStr = useLocalToday();
  const [saveError, setSaveError] = useState<string | null>(null);
  const [selectedFeeling, setSelectedFeeling] = useState<number | null>(null);
  const [todayCheckin, setTodayCheckin] = useState<(LocalCheckin & { symptoms: LocalSymptomEntry[] }) | null>(null);
  const [recentCheckins, setRecentCheckins] = useState<Array<LocalCheckin & { symptoms: LocalSymptomEntry[] }>>([]);
  const [activeTreatments, setActiveTreatments] = useState<LocalTreatment[]>([]);
  const [todayEvents, setTodayEvents] = useState<LocalTreatmentEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reloadTrigger, setReloadTrigger] = useState(0);
  const [missedDays, setMissedDays] = useState<string[]>([]);
  const [catchUpDismissed, setCatchUpDismissed] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [onboardingDone, setOnboardingDone] = useState(true);

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- read once from storage after mount
      setOnboardingDone(window.localStorage.getItem('menowell_onboarding_completed') === 'true');
    } catch {
      // storage unavailable: just don't show the intro card
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      if (!todayStr) return;
      const today = await LocalDataService.getCheckinByDate(todayStr);
      if (!isMounted) return;
      if (today) {
        setTodayCheckin(today);
        setSelectedFeeling(today.overallFeeling);
      } else {
        setTodayCheckin(null);
        setSelectedFeeling(null);
      }

      const all = await LocalDataService.getAllCheckins();
      if (!isMounted) return;
      setRecentCheckins(all);

      const lastLoggedDate = all.find((c) => c.date < todayStr)?.date ?? null;
      const missed = getMissedDays(lastLoggedDate, todayStr);
      const dismissedOn = await LocalDataService.getSetting<string | null>(CATCH_UP_DISMISSED_KEY, null);
      if (!isMounted) return;
      setMissedDays(missed);
      setCatchUpDismissed(dismissedOn === todayStr);

      const trts = await LocalDataService.getTreatments(true);
      const evts = await LocalDataService.getTreatmentEvents(todayStr, todayStr);
      if (!isMounted) return;
      setActiveTreatments(trts);
      setTodayEvents(evts);

      setIsLoading(false);
    }

    void loadDashboard();

    return () => {
      isMounted = false;
    };
  }, [todayStr, reloadTrigger]);

  // Only the feeling changes: everything else already logged today is kept, and nothing is filled in for her.
  const handleQuickFeelingSelect = async (val: 1 | 2 | 3 | 4 | 5) => {
    if (!todayStr) return;
    setSelectedFeeling(val);
    setSaveError(null);
    const t = todayCheckin;
    try {
      await LocalDataService.saveCheckin({
        date: todayStr,
        overallFeeling: val,
        coversDays: t?.coversDays,
        notes: t?.notes,
        sleepHours: t?.sleepHours,
        sleepQuality: t?.sleepQuality,
        wokeAtNight: t?.wokeAtNight,
        hotFlashCount: t?.hotFlashCount,
        flow: t?.flow,
        lifestyle: t?.lifestyle,
        symptoms: (t?.symptoms ?? []).map((s) => ({
          symptomId: s.symptomId,
          name: s.name,
          category: s.category,
          severity: s.severity,
          notes: s.notes,
        })),
      });
      setJustSaved(true);
    } catch (err) {
      setSelectedFeeling(t?.overallFeeling ?? null);
      setSaveError(describeStorageError(err));
    }
    setReloadTrigger((n) => n + 1);
  };

  const handleDismissCatchUp = async () => {
    setCatchUpDismissed(true);
    if (!todayStr) return;
    try {
      // Remembering a closed message is a preference: only with the visitor's OK.
      if (canStorePreferences()) await LocalDataService.setSetting(CATCH_UP_DISMISSED_KEY, todayStr);
    } catch {
      // Not critical: worst case the banner reappears next visit today.
    }
  };

  const handleLogTreatmentDone = async (t: LocalTreatment) => {
    const action =
      t.type === 'patch' || t.type === 'hrt_patch'
        ? 'changed'
        : t.type === 'oral' || t.type === 'oral_tablet' || t.type === 'supplement'
        ? 'taken'
        : 'applied';

    if (!todayStr) return;
    setSaveError(null);
    try {
      await LocalDataService.logTreatmentEvent({
        treatmentId: t.id,
        treatmentName: t.name,
        date: todayStr,
        action,
        notes: `${t.name} logged on ${todayStr}.`,
      });
    } catch (err) {
      setSaveError(describeStorageError(err));
    }
    setReloadTrigger((n) => n + 1);
  };

  const formattedToday = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  // This week at a glance: simple counts from her own entries (last 7 logged days).
  const week = recentCheckins.slice(0, 7);
  const withFlashes = week.filter((c) => typeof c.hotFlashCount === 'number');
  const withSleep = week.filter((c) => typeof c.sleepHours === 'number');
  const avgFlashes = withFlashes.length ? withFlashes.reduce((n, c) => n + (c.hotFlashCount ?? 0), 0) / withFlashes.length : null;
  const avgSleep = withSleep.length ? withSleep.reduce((n, c) => n + (c.sleepHours ?? 0), 0) / withSleep.length : null;

  const schedule = activeTreatments.length > 0 ? NotificationService.calculateDueTreatments(activeTreatments, todayEvents, todayStr) : null;

  return (
    <>
      <AppHeader title="Today" subtitle={formattedToday} />

      <AppPage>
        {saveError && (
          <div role="alert" className="error-state">
            <strong>That didn’t save.</strong>
            <span>{saveError}</span>
          </div>
        )}

        {/* Catch-up: no notification server exists yet, so she's only reminded of a gap when she opens the app herself. */}
        {missedDays.length > 0 && !catchUpDismissed && (
          <section className="callout callout-try m-0 max-w-none" aria-labelledby="catchup-title">
            <div className="flex items-start justify-between gap-2">
              <h2 id="catchup-title" className="callout-title">
                You haven’t logged in {missedDays.length} {missedDays.length === 1 ? 'day' : 'days'}
              </h2>
              <button type="button" onClick={handleDismissCatchUp} aria-label="Hide this reminder for today" className="icon-btn -mt-3 -mr-3">
                <Icon.Close width={20} height={20} />
              </button>
            </div>
            <p>Want to add those days so your report is complete? Nothing is filled in for you.</p>
            <div className="callout-actions">
              <Link href="/app/catch-up/" className="btn btn-secondary btn-sm">
                Catch up
              </Link>
            </div>
          </section>
        )}

        {/* First visit: a gentle way into the 3-step intro (no forced redirect, so "Essential only" visitors aren't looped back). */}
        {!isLoading && recentCheckins.length === 0 && !onboardingDone && (
          <section className="panel panel-quiet" aria-labelledby="new-here">
            <h2 id="new-here" className="panel-title">
              New here?
            </h2>
            <p className="text-[var(--ink-muted)]">
              A quick 3-step intro: what this tracker does, where your entries live, and how often to log.
            </p>
            <Link href="/app/onboarding/" className="btn btn-secondary justify-self-start">
              Show me how it works
            </Link>
          </section>
        )}

        {todayStr && (
          <TodayNudges
            todayStr={todayStr}
            lastLoggedDate={recentCheckins[0]?.date ?? null}
            firstEntryDate={recentCheckins[recentCheckins.length - 1]?.date ?? null}
          />
        )}

        {/* Primary: how are you today? Tapping a level saves it straight away. */}
        <Panel
          tone="feature"
          title="How are you today?"
          hint={
            todayCheckin
              ? `Saved for today: ${FEELING_WORD[todayCheckin.overallFeeling]}. Tap to change.`
              : 'Tap one. It saves straight away.'
          }
        >
          <LevelPicker
            label="How you feel today, from rough to great"
            levels={FEELINGS}
            value={selectedFeeling as 1 | 2 | 3 | 4 | 5 | null}
            onChange={(v) => void handleQuickFeelingSelect(v)}
          />
          {justSaved && (
            <p className="saved-note" role="status">
              <Icon.Check width={20} height={20} />
              Saved on this device.
            </p>
          )}
          <Link href="/app/check-in/" className="btn btn-primary btn-lg btn-block">
            {todayCheckin ? 'Add symptoms, sleep and notes' : 'Log today'}
            <Icon.Chevron width={20} height={20} />
          </Link>
          <p className="hint text-center">Symptoms, hot flashes, sleep and bleeding. Under a minute.</p>
        </Panel>

        {/* This week at a glance */}
        {recentCheckins.length > 0 && (
          <section aria-labelledby="week-heading" className="grid gap-3">
            <SectionHead
              id="week-heading"
              title="Your last 7 entries"
              action={
                <Link href="/app/insights/" className="link text-base">
                  Insights
                </Link>
              }
            />
            <div className="stats">
              <div className="stat">
                <span className="stat-value">{recentCheckins.length}</span>
                <span className="stat-label">{recentCheckins.length === 1 ? 'day logged' : 'days logged'} in all</span>
              </div>
              {avgFlashes !== null && (
                <div className="stat">
                  <span className="stat-value">{avgFlashes.toFixed(1)}</span>
                  <span className="stat-label">hot flashes a day</span>
                </div>
              )}
              {avgSleep !== null && (
                <div className="stat">
                  <span className="stat-value">{avgSleep.toFixed(1)}h</span>
                  <span className="stat-label">sleep a night</span>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Treatments due today */}
        <section aria-labelledby="treatment-heading" className="grid gap-3">
          <SectionHead
            id="treatment-heading"
            title="Treatments today"
            action={
              <Link href="/app/treatments/" className="link text-base">
                Manage
              </Link>
            }
          />

          {activeTreatments.length === 0 ? (
            <div className="panel panel-quiet">
              <p className="text-[var(--ink-muted)]">
                If you take something (HRT, a prescription, a supplement), add it here to tick it off each day.
              </p>
              <Link href="/app/treatments/" className="btn btn-secondary justify-self-start">
                <Icon.Plus width={18} height={18} />
                Add a treatment
              </Link>
            </div>
          ) : schedule && schedule.due.length === 0 && schedule.completed.length === 0 ? (
            <p className="panel panel-quiet text-[var(--ink-muted)]">Nothing scheduled for today.</p>
          ) : (
            schedule && (
              <ul className="row-list" role="list">
                {schedule.due.map((t) => (
                  <li key={t.id} className="row">
                    <span className="row-icon" aria-hidden="true">
                      <Icon.Treatments width={22} height={22} />
                    </span>
                    <div className="row-main">
                      <p className="row-title">{t.name}</p>
                      <p className="row-meta">
                        {[t.dosage, t.frequency, t.defaultSite ? `Site: ${t.defaultSite}` : null].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    <button type="button" onClick={() => handleLogTreatmentDone(t)} className="btn btn-secondary btn-sm shrink-0">
                      <Icon.Check width={18} height={18} />
                      {t.type === 'patch' || t.type === 'hrt_patch' ? 'Patch changed' : 'Done'}
                    </button>
                  </li>
                ))}
                {schedule.completed.map((t) => (
                  <li key={t.id} className="row">
                    <span className="row-icon bg-[var(--g-strong-soft)] text-[var(--g-strong-ink)]" aria-hidden="true">
                      <Icon.Check width={20} height={20} />
                    </span>
                    <div className="row-main">
                      <p className="row-title text-[var(--ink-muted)]">{t.name}</p>
                      <p className="row-meta">Done for today</p>
                    </div>
                  </li>
                ))}
              </ul>
            )
          )}
        </section>

        {/* Recent days */}
        <section aria-labelledby="recent-heading" className="grid gap-3">
          <SectionHead
            id="recent-heading"
            title="Recent days"
            action={
              recentCheckins.length > 0 ? (
                <Link href="/app/timeline/" className="link text-base">
                  Timeline
                </Link>
              ) : undefined
            }
          />

          {recentCheckins.length === 0 && !isLoading ? (
            <div className="empty-state">
              <IlloEmpty />
              <strong>Nothing logged yet</strong>
              <span>Your first entry takes under a minute. It stays on this device.</span>
              <Link href="/app/check-in/" className="btn btn-primary">
                Log today
              </Link>
            </div>
          ) : (
            <ul className="row-list" role="list">
              {recentCheckins.slice(0, 4).map((item) => (
                <li key={item.id}>
                  <Link href={`/app/check-in/?date=${item.date}`} className="row" aria-label={`${shortDay(item.date)}: ${FEELING_WORD[item.overallFeeling]}. Edit this day`}>
                    <span className="feel-dot" aria-hidden="true">
                      {item.overallFeeling}
                    </span>
                    <div className="row-main">
                      <p className="row-title">
                        {shortDay(item.date)} · {FEELING_WORD[item.overallFeeling]}
                      </p>
                      <p className="row-meta">
                        {[
                          typeof item.hotFlashCount === 'number' ? `${item.hotFlashCount} hot ${item.hotFlashCount === 1 ? 'flash' : 'flashes'}` : null,
                          typeof item.sleepHours === 'number' ? `${item.sleepHours}h sleep` : null,
                          item.symptoms.length ? `${item.symptoms.length} ${item.symptoms.length === 1 ? 'symptom' : 'symptoms'}` : null,
                        ]
                          .filter(Boolean)
                          .join(' · ') || 'Feeling only'}
                      </p>
                      {item.notes && <p className="row-meta mt-0.5 line-clamp-1 italic">“{item.notes}”</p>}
                    </div>
                    <Icon.Chevron width={20} height={20} className="shrink-0 text-[var(--ink-muted)]" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Where to next */}
        <section className="grid grid-cols-2 gap-3" aria-label="More tools">
          <Link href="/app/insights/" className="card grid gap-1">
            <span className="row-icon" aria-hidden="true">
              <Icon.Insights width={22} height={22} />
            </span>
            <span className="mt-1 font-bold">Your patterns</span>
            <span className="text-[1rem] leading-snug text-[var(--ink-muted)]">Hot flashes, sleep and symptoms over time.</span>
          </Link>
          <Link href="/app/doctor-report/" className="card grid gap-1">
            <span className="row-icon" aria-hidden="true">
              <Icon.Report width={22} height={22} />
            </span>
            <span className="mt-1 font-bold">Doctor report</span>
            <span className="text-[1rem] leading-snug text-[var(--ink-muted)]">A one-page summary to print or save.</span>
          </Link>
        </section>

        <p className="flex items-center justify-center gap-2 text-center text-[1rem] text-[var(--ink-muted)]">
          <Icon.Lock width={16} height={16} />
          Saved only in this browser on this device. Nothing is uploaded.
        </p>
      </AppPage>
    </>
  );
}
