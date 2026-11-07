'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppHeader } from '@/components/app/app-header';
import { AppPage, Icon, Panel, QuickPick } from '@/components/app/kit';
import { FeelingSpread, SymptomBars, type Entry } from '@/components/app/charts';
import { IlloEmpty } from '@/components/ui/illustrations';
import { LocalDataService } from '@/lib/db/service';
import { InsightsEngine, SymptomStats, SleepStats, HotFlashStats } from '@/lib/insights/calculations';
import { localDateString, localDaysAgo } from '@/lib/utils/local-date';

export default function InsightsPage() {
  const [selectedRange, setSelectedRange] = useState<'30' | '60' | '90'>('30');
  const [symptomStats, setSymptomStats] = useState<SymptomStats[]>([]);
  const [sleepStats, setSleepStats] = useState<SleepStats | null>(null);
  const [hotFlashStats, setHotFlashStats] = useState<HotFlashStats | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [recordCount, setRecordCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchInsights() {
      const days = parseInt(selectedRange, 10);
      const end = localDateString();
      const start = localDaysAgo(days);

      const checkinsWithSymptoms = await LocalDataService.getCheckinsForRange(start, end);

      if (!isMounted) return;

      setRecordCount(checkinsWithSymptoms.length);
      setEntries(checkinsWithSymptoms);

      if (checkinsWithSymptoms.length > 0) {
        const allSymptoms = checkinsWithSymptoms.flatMap((c) => c.symptoms);
        const symStats = InsightsEngine.calculateSymptomStats(checkinsWithSymptoms, allSymptoms);
        const slpStats = InsightsEngine.calculateSleepStats(checkinsWithSymptoms);
        const hfStats = InsightsEngine.calculateHotFlashStats(checkinsWithSymptoms);

        setSymptomStats(symStats);
        setSleepStats(slpStats);
        setHotFlashStats(hfStats);
      } else {
        setSymptomStats([]);
        setSleepStats(null);
        setHotFlashStats(null);
      }
      setIsLoading(false);
    }

    void fetchInsights();

    return () => {
      isMounted = false;
    };
  }, [selectedRange]);

  const rangeOptions = [
    { value: '30' as const, label: '30 days' },
    { value: '60' as const, label: '60 days' },
    { value: '90' as const, label: '90 days' },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader title="Insights" subtitle="Patterns in what you’ve logged" showPrivacyBadge={true} showSettings={true} />

      <AppPage>
        <Panel tone="quiet">
          <div className="grid gap-2">
            <span className="label">Show the last</span>
            <QuickPick label="Time range" options={rangeOptions} value={selectedRange} onChange={setSelectedRange} />
          </div>
          <p className="text-[1rem] text-[var(--ink-muted)]">
            {recordCount} {recordCount === 1 ? 'day' : 'days'} logged in the last {selectedRange} days.
          </p>
        </Panel>

        {isLoading ? (
          <div className="grid gap-3" role="status" aria-busy="true" aria-label="Loading your insights">
            <span className="skeleton h-28 w-full" />
            <span className="skeleton h-48 w-full" />
          </div>
        ) : recordCount === 0 ? (
          <div className="empty-state">
            <IlloEmpty />
            <strong>Nothing logged in the last {selectedRange} days</strong>
            <span className="max-w-[26rem]">
              Log a few days and you’ll see how often your symptoms come up, your average sleep and your hot flashes here.
            </span>
            <Link href="/app/check-in/" className="btn btn-primary mt-2">
              Log today
            </Link>
          </div>
        ) : (
          <>
            <div className="stats grid-cols-2 sm:grid-cols-3">
              <div className="stat">
                <span className="stat-label inline-flex items-center gap-1.5">
                  <Icon.Flame width={18} height={18} className="text-[var(--accent)]" />
                  Hot flashes
                </span>
                <span className="stat-value">{hotFlashStats?.dailyAverage ?? 0}</span>
                <span className="stat-label">
                  a day on average · {hotFlashStats?.totalRecorded ?? 0} in all
                </span>
              </div>
              <div className="stat">
                <span className="stat-label inline-flex items-center gap-1.5">
                  <Icon.Moon width={18} height={18} className="text-[var(--accent)]" />
                  Sleep
                </span>
                <span className="stat-value">
                  {sleepStats?.averageHours ?? 0}
                  <span className="ml-1 font-sans text-[1rem] font-bold text-[var(--ink-muted)]">h</span>
                </span>
                <span className="stat-label">a night on average</span>
              </div>
              <div className="stat col-span-2 sm:col-span-1">
                <span className="stat-label">Woke at night</span>
                <span className="stat-value">{sleepStats?.wakingPercent ?? 0}%</span>
                <span className="stat-label">
                  {sleepStats?.nightsWokeAtNight ?? 0} of {recordCount} nights
                </span>
              </div>
            </div>

            <Panel
              title="How often each symptom came up"
              hint={`Share of your ${recordCount} ${recordCount === 1 ? 'entry' : 'entries'}, with your average strength (1 mild, 5 severe).`}
            >
              <SymptomBars
                total={recordCount}
                limit={12}
                items={symptomStats.map((s) => ({
                  id: s.symptomId,
                  name: s.name,
                  count: s.count,
                  percent: s.frequencyPercent,
                  strength: s.averageSeverity,
                }))}
              />
            </Panel>

            <Panel title="How you felt" hint="Your overall rating on each day you logged.">
              <FeelingSpread entries={entries} />
            </Panel>

            <Link href="/app/timeline/" className="row rounded-[var(--radius-lg)] border border-[var(--rule)] bg-[var(--paper-raised)]">
              <span className="row-icon" aria-hidden="true">
                <Icon.Timeline width={22} height={22} />
              </span>
              <span className="row-main">
                <span className="row-title block">See it day by day</span>
                <span className="row-meta block">Charts of your hot flashes and sleep on the Timeline</span>
              </span>
              <Icon.Chevron width={20} height={20} className="text-[var(--ink-muted)]" />
            </Link>
          </>
        )}

        <section className="notice" aria-labelledby="ins-note">
          <span className="notice-stamp" aria-hidden="true">
            i
          </span>
          <h2 id="ins-note" className="font-serif text-[1.15rem] font-semibold">
            What these numbers are
          </h2>
          <p className="text-[1rem]">
            Counts and averages from your own entries, worked out on this device. They show patterns over time, not what
            caused them: sleep, stress, treatments and more can all change symptoms at once.
          </p>
        </section>
      </AppPage>
    </div>
  );
}
