'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/app/app-header';
import { AppPage, Icon, LevelPicker } from '@/components/app/kit';
import { IlloEmpty } from '@/components/ui/illustrations';
import { LocalDataService } from '@/lib/db/service';
import { getMissedDays } from '@/lib/tracker/catch-up';
import { describeStorageError } from '@/lib/storage/errors';
import { useLocalToday } from '@/components/storage/use-tool-state';

const FEELINGS: Array<{ value: 1 | 2 | 3 | 4 | 5; label: string }> = [
  { value: 1, label: 'Rough' },
  { value: 2, label: 'Low' },
  { value: 3, label: 'Okay' },
  { value: 4, label: 'Good' },
  { value: 5, label: 'Great' },
];

function formatDay(dateStr: string): string {
  // Parsed as a local calendar date, not UTC midnight, so it never shows the wrong day.
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export default function CatchUpPage() {
  const router = useRouter();
  const todayStr = useLocalToday();
  const [missedDays, setMissedDays] = useState<string[] | null>(null);
  const [logged, setLogged] = useState<Record<string, 1 | 2 | 3 | 4 | 5>>({});
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      if (!todayStr) return;
      const all = await LocalDataService.getAllCheckins();
      if (!alive) return;
      const lastLoggedDate = all.find((c) => c.date < todayStr)?.date ?? null;
      const missed = getMissedDays(lastLoggedDate, todayStr);
      const already: Record<string, 1 | 2 | 3 | 4 | 5> = {};
      for (const c of all) {
        if (missed.includes(c.date)) already[c.date] = c.overallFeeling;
      }
      setLogged(already);
      setMissedDays(missed);
    }
    void load();
    return () => {
      alive = false;
    };
  }, [todayStr]);

  const handleLog = async (date: string, feeling: 1 | 2 | 3 | 4 | 5) => {
    setSaveError(null);
    try {
      await LocalDataService.saveCheckin({ date, overallFeeling: feeling, symptoms: [] });
      setLogged((prev) => ({ ...prev, [date]: feeling }));
    } catch (err) {
      setSaveError(describeStorageError(err));
    }
  };

  const loggedCount = missedDays ? missedDays.filter((d) => logged[d]).length : 0;

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader title="Catch up" subtitle="Add the days you missed" showBack backHref="/app/today/" showSettings={false} />

      <AppPage>
        <div className="grid gap-2">
          <h2 className="font-serif text-[length:var(--fs-h3)] font-semibold">Fill in what you remember</h2>
          <p className="text-[var(--ink-muted)]">
            Tap how each day felt, or skip it. Nothing is filled in for you, and a day you leave blank just stays
            unlogged.
          </p>
        </div>

        {saveError && (
          <p role="alert" className="error-state">
            <strong>We couldn’t save that day.</strong>
            <span>{saveError}</span>
          </p>
        )}

        {missedDays === null ? (
          <div className="grid gap-3" aria-busy="true" aria-label="Loading the days you missed">
            <span className="skeleton h-40 w-full" />
            <span className="skeleton h-40 w-full" />
          </div>
        ) : missedDays.length === 0 ? (
          <div className="empty-state">
            <IlloEmpty />
            <strong>You’re all caught up</strong>
            <span>There are no missed days to add.</span>
            <Link href="/app/today/" className="btn btn-primary btn-sm">
              Back to Today
            </Link>
          </div>
        ) : (
          <>
            <p className="eyebrow" aria-live="polite">
              {loggedCount} of {missedDays.length} {missedDays.length === 1 ? 'day' : 'days'} added
            </p>
            <ul className="grid gap-3">
              {missedDays.map((date) => {
                const savedFeeling = logged[date] ?? null;
                return (
                  <li key={date} className="panel">
                    <div className="panel-head">
                      <h3 className="panel-title">{formatDay(date)}</h3>
                      {savedFeeling ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--g-strong-soft)] px-3 py-1 text-[0.95rem] font-bold text-[var(--g-strong-ink)]">
                          <Icon.Check width={16} height={16} /> Added
                        </span>
                      ) : (
                        <span className="text-[0.95rem] text-[var(--ink-muted)]">Not logged</span>
                      )}
                    </div>

                    <LevelPicker
                      label={`How ${formatDay(date)} felt`}
                      levels={FEELINGS}
                      value={savedFeeling}
                      onChange={(v) => void handleLog(date, v)}
                    />

                    <Link href={`/app/check-in/?date=${date}`} className="link link-arrow justify-self-start inline-flex min-h-[44px] items-center gap-1.5">
                      Add symptoms, sleep or notes for this day
                    </Link>
                  </li>
                );
              })}
            </ul>
          </>
        )}

        <button type="button" onClick={() => router.push('/app/today/')} className="btn btn-primary btn-lg btn-block">
          Done
        </button>
      </AppPage>
    </div>
  );
}
