'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AppHeader } from '@/components/app/app-header';
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

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader title="Catch up" subtitle="Add the days you missed" showBack backHref="/app/today/" showSettings={false} />

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-5 space-y-4">
        <Card className="p-4 bg-white space-y-1.5">
          <p className="text-sm text-[#231F1D]">
            There's no notification server behind this app yet, so nothing reminded you while it was closed. Add what
            you remember below for each day — or skip any of them. Nothing here is filled in for you, and a day you
            leave blank just stays unlogged.
          </p>
        </Card>

        {saveError && (
          <p role="alert" className="rounded-2xl bg-[var(--color-urgent-soft)] p-3 text-sm font-semibold text-[var(--color-urgent)]">
            {saveError}
          </p>
        )}

        {missedDays === null ? null : missedDays.length === 0 ? (
          <Card variant="muted" className="p-5 text-center text-sm text-[#68615C]">
            No missed days to catch up on.
          </Card>
        ) : (
          <div className="space-y-2.5">
            {missedDays.map((date) => {
              const savedFeeling = logged[date];
              return (
                <Card key={date} className="p-4 bg-white space-y-2.5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-[#231F1D]">{formatDay(date)}</p>
                    {savedFeeling ? (
                      <span className="text-xs font-medium text-[#2C6E49] flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Logged
                      </span>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-5 gap-2">
                    {FEELINGS.map((f) => {
                      const isSelected = savedFeeling === f.value;
                      return (
                        <button
                          key={f.value}
                          type="button"
                          onClick={() => handleLog(date, f.value)}
                          className={`min-h-[44px] py-2 rounded-xl border text-xs font-semibold transition active:scale-95 ${
                            isSelected
                              ? 'bg-[#1F5A4C] border-[#1F5A4C] text-white'
                              : 'bg-[#F7F6F2] border-[#E5DED5] text-[#554E48] hover:border-[#D0C7BC]'
                          }`}
                        >
                          {f.label}
                        </button>
                      );
                    })}
                  </div>

                  <Link
                    href={`/app/check-in/?date=${date}`}
                    className="inline-flex items-center gap-1 text-xs text-[#1F5A4C] font-medium hover:underline"
                  >
                    Add symptoms, sleep, or notes for this day
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </Card>
              );
            })}
          </div>
        )}

        <Button variant="primary" fullWidth size="lg" onClick={() => router.push('/app/today/')} className="mt-2">
          Done
        </Button>
      </div>
    </div>
  );
}
