'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { AppHeader } from '@/components/app/app-header';
import { AppPage, Icon, Panel, QuickPick, SectionHead } from '@/components/app/kit';
import {
  FEELING_LABELS,
  HotFlashChart,
  SleepChart,
  SymptomBars,
  dailySeries,
  symptomBarsFromEntries,
} from '@/components/app/charts';
import { IlloEmpty } from '@/components/ui/illustrations';
import { LocalDataService } from '@/lib/db/service';
import { LocalCheckin, LocalSymptomEntry, LocalTreatmentEvent } from '@/lib/db/schema';
import {
  TreatmentComparisonEngine,
  TreatmentComparisonResult,
} from '@/lib/insights/treatment-comparison';
import { localDateString, localDaysAgo } from '@/lib/utils/local-date';

/** Charts never draw more than this many days, so years of history stay readable. */
const CHART_MAX_DAYS = 90;

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
    </svg>
  );
}

export default function TimelinePage() {
  /** Days back to show; 0 = all time, so years of history stay reachable. */
  const [filterDays, setFilterDays] = useState<number>(30);
  const [viewMode, setViewMode] = useState<'all' | 'checkins' | 'treatments'>('all');
  const [checkins, setCheckins] = useState<Array<LocalCheckin & { symptoms: LocalSymptomEntry[] }>>([]);
  const [treatmentEvents, setTreatmentEvents] = useState<LocalTreatmentEvent[]>([]);
  const [allCheckins, setAllCheckins] = useState<Array<LocalCheckin & { symptoms: LocalSymptomEntry[] }>>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  // Before / After Comparison Modal State
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [activeComparisonEvent, setActiveComparisonEvent] = useState<LocalTreatmentEvent | null>(null);
  const [comparisonWindow, setComparisonWindow] = useState<7 | 14 | 30>(14);
  const [comparisonResult, setComparisonResult] = useState<TreatmentComparisonResult | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadTimeline() {
      const end = localDateString();
      const start = filterDays > 0 ? localDaysAgo(filterDays) : '0000-01-01';

      const data = await LocalDataService.getCheckinsForRange(start, end);
      const events = await LocalDataService.getTreatmentEvents(start, end);
      const all = await LocalDataService.getAllCheckins();

      if (!isMounted) return;
      setCheckins(data);
      setTreatmentEvents(events);
      setAllCheckins(all);
      setIsLoading(false);
    }

    void loadTimeline();

    return () => {
      isMounted = false;
    };
  }, [filterDays, reloadTrigger]);

  // Open / close the native dialog with the modal state.
  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (showComparisonModal && !d.open) d.showModal();
    if (!showComparisonModal && d.open) d.close();
  }, [showComparisonModal, comparisonResult]);

  const handleDeleteEntry = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this check-in entry from your local device?')) {
      await LocalDataService.deleteCheckin(id);
      setReloadTrigger((n) => n + 1);
    }
  };

  // A dose logged by mistake can be removed; the treatment plan itself is untouched.
  const handleDeleteEvent = async (evt: LocalTreatmentEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Remove the "${evt.action}" entry for ${evt.treatmentName} on ${evt.date}? Your treatment plan is not affected.`)) {
      await LocalDataService.deleteTreatmentEvent(evt.id);
      setReloadTrigger((n) => n + 1);
    }
  };

  const handleOpenComparison = (evt: LocalTreatmentEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveComparisonEvent(evt);
    const result = TreatmentComparisonEngine.comparePeriods(
      evt.treatmentName,
      evt.date,
      comparisonWindow,
      allCheckins
    );
    setComparisonResult(result);
    setShowComparisonModal(true);
  };

  const handleChangeComparisonWindow = (win: 7 | 14 | 30) => {
    setComparisonWindow(win);
    if (activeComparisonEvent) {
      const result = TreatmentComparisonEngine.comparePeriods(
        activeComparisonEvent.treatmentName,
        activeComparisonEvent.date,
        win,
        allCheckins
      );
      setComparisonResult(result);
    }
  };

  const filters = [
    { label: '7 days', value: 7 },
    { label: '14 days', value: 14 },
    { label: '30 days', value: 30 },
    { label: '60 days', value: 60 },
    { label: '90 days', value: 90 },
    { label: '6 months', value: 182 },
    { label: '1 year', value: 365 },
    { label: 'All', value: 0 },
  ];

  // Unique list of dates having check-ins or treatment events
  const allDates = Array.from(
    new Set([
      ...checkins.map((c) => c.date),
      ...treatmentEvents.map((te) => te.date),
    ])
  ).sort((a, b) => b.localeCompare(a));

  // ---- chart window: the selected range, capped at CHART_MAX_DAYS, and never before her first entry.
  const today = localDateString();
  const firstLogged = checkins.length ? checkins[checkins.length - 1].date : null;
  const sortedDates = checkins.map((c) => c.date).sort();
  const earliest = sortedDates[0] ?? today;
  const capStart = localDaysAgo(CHART_MAX_DAYS - 1);
  const rangeStart = filterDays > 0 ? localDaysAgo(filterDays - 1) : earliest;
  let chartStart = rangeStart > capStart ? rangeStart : capStart;
  if (firstLogged && earliest > chartStart) chartStart = earliest;
  const chartCapped = (filterDays === 0 || filterDays > CHART_MAX_DAYS) && rangeStart < capStart;
  const hfPoints = dailySeries(checkins, chartStart, today, (e) => e.hotFlashCount);
  const sleepPoints = dailySeries(checkins, chartStart, today, (e) => e.sleepHours);
  const hasWeekly = checkins.some((c) => c.coversDays === 7);
  const symptomBars = symptomBarsFromEntries(checkins);
  const showCharts = checkins.length > 0 && viewMode !== 'treatments';

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader title="Timeline" subtitle="Your entries over time" showPrivacyBadge={true} showSettings={true} />

      <AppPage>
        {/* Filters */}
        <Panel tone="quiet">
          <div className="grid gap-2">
            <span className="label" id="tl-range">
              Show the last
            </span>
            <QuickPick
              label="Time range"
              options={filters}
              value={filterDays}
              onChange={(v) => setFilterDays(v)}
              columns={4}
            />
          </div>
          <div className="grid gap-2">
            <span className="label">Include</span>
            <QuickPick
              label="What to include"
              options={[
                { value: 'all' as const, label: 'Everything' },
                { value: 'checkins' as const, label: 'Check-ins' },
                { value: 'treatments' as const, label: 'Treatments' },
              ]}
              value={viewMode}
              onChange={setViewMode}
            />
          </div>
        </Panel>

        {isLoading ? (
          <div className="grid gap-3" aria-busy="true" aria-label="Loading your timeline">
            <span className="skeleton h-40 w-full" />
            <span className="skeleton h-24 w-full" />
          </div>
        ) : allDates.length === 0 ? (
          <div className="empty-state">
            <IlloEmpty />
            <strong>{filterDays > 0 ? `Nothing logged in the last ${filters.find((f) => f.value === filterDays)?.label ?? `${filterDays} days`}` : 'Nothing logged yet'}</strong>
            <span className="max-w-[26rem]">
              Your charts and day-by-day history appear here once you log. A check-in takes under a minute.
            </span>
            <div className="mt-2 flex flex-wrap justify-center gap-3">
              <Link href="/app/check-in/" className="btn btn-primary">
                Log today
              </Link>
              {filterDays > 0 && filterDays < 365 && (
                <button type="button" className="btn btn-secondary" onClick={() => setFilterDays(0)}>
                  Show all time
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            {showCharts && (
              <>
                <SectionHead title="Your patterns" />
                {chartCapped && (
                  <p className="-mt-2 px-0.5 text-[1rem] text-[var(--ink-muted)]">
                    Charts show your last {CHART_MAX_DAYS} days. The list below has everything.
                  </p>
                )}
                <Panel title="Hot flashes per day" headingLevel={3}>
                  <HotFlashChart points={hfPoints} />
                </Panel>
                <Panel title="Sleep each night" headingLevel={3}>
                  <SleepChart points={sleepPoints} />
                </Panel>
                <Panel
                  title="How often each symptom came up"
                  hint={`Out of ${checkins.length} ${checkins.length === 1 ? 'entry' : 'entries'} in this period.`}
                  headingLevel={3}
                >
                  <SymptomBars items={symptomBars} total={checkins.length} />
                </Panel>
                {hasWeekly && (
                  <p className="px-0.5 text-[1rem] text-[var(--ink-muted)]">
                    Weekly entries cover a whole week, so they appear in the list but not in the daily charts.
                  </p>
                )}
              </>
            )}

            <SectionHead title="Day by day" />
            <ol className="grid gap-3" aria-label="Your entries, newest first">
              {allDates.map((dateStr) => {
                const entry = checkins.find((c) => c.date === dateStr);
                const dayEvents = treatmentEvents.filter((te) => te.date === dateStr);

                // Filter based on viewMode
                if (viewMode === 'checkins' && !entry) return null;
                if (viewMode === 'treatments' && dayEvents.length === 0) return null;

                const isExpanded = entry ? expandedId === entry.id : false;
                const dateObj = new Date(dateStr + 'T00:00:00');
                // The year only when it isn't this year, so the date fits on one line on a phone.
                const formattedDate = dateObj.toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  ...(dateStr.slice(0, 4) === today.slice(0, 4) ? {} : { year: 'numeric' as const }),
                });
                const symId = entry ? `sym-${entry.id}` : '';

                return (
                  <li key={dateStr} className="grid gap-2">
                    {entry && viewMode !== 'treatments' && (
                      <article className="panel gap-3" aria-labelledby={`d-${dateStr}`}>
                        <div className="flex items-start gap-3">
                          <span className="feel-dot" aria-hidden="true">
                            {entry.overallFeeling}
                          </span>
                          <div className="min-w-0 flex-1">
                            <h3 id={`d-${dateStr}`} className="font-serif text-[1.2rem] font-semibold leading-tight">
                              {formattedDate}
                            </h3>
                            <p className="text-[1rem] text-[var(--ink-muted)]">
                              Felt {FEELING_LABELS[entry.overallFeeling]?.toLowerCase()} ({entry.overallFeeling} of 5)
                              {entry.coversDays === 7 ? ' · covers the past 7 days' : ''}
                            </p>
                          </div>
                          <div className="-mr-2 -mt-1 flex shrink-0 items-center">
                            <Link
                              href={`/app/check-in/?date=${entry.date}`}
                              className="btn btn-quiet btn-sm"
                              aria-label={`Edit check-in for ${formattedDate}`}
                            >
                              Edit
                            </Link>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteEntry(entry.id, e)}
                              className="icon-btn text-[var(--ink-muted)] hover:text-[var(--urgent)]"
                              aria-label={`Delete check-in for ${formattedDate}`}
                            >
                              <TrashIcon />
                            </button>
                          </div>
                        </div>

                        {(entry.hotFlashCount || entry.sleepHours || (entry.flow && entry.flow !== 'none')) ? (
                          <ul className="flex flex-wrap gap-2" aria-label="Logged">
                            {entry.hotFlashCount ? (
                              <li className="inline-flex items-center gap-1.5 rounded-[var(--radius)] bg-[var(--accent-soft)] px-3 py-1.5 text-[1rem] font-bold">
                                <Icon.Flame width={18} height={18} className="text-[var(--accent)]" />
                                {entry.hotFlashCount} hot {entry.hotFlashCount === 1 ? 'flash' : 'flashes'}
                              </li>
                            ) : null}
                            {entry.sleepHours ? (
                              <li className="inline-flex items-center gap-1.5 rounded-[var(--radius)] bg-[var(--paper-sunk)] px-3 py-1.5 text-[1rem] font-bold">
                                <Icon.Moon width={18} height={18} className="text-[var(--accent)]" />
                                {entry.sleepHours} h sleep{entry.wokeAtNight ? ', woke at night' : ''}
                              </li>
                            ) : null}
                            {entry.flow && entry.flow !== 'none' ? (
                              <li className="inline-flex items-center gap-1.5 rounded-[var(--radius)] bg-[var(--paper-sunk)] px-3 py-1.5 text-[1rem] font-bold capitalize">
                                <Icon.Drop width={18} height={18} className="text-[var(--accent)]" />
                                Bleeding: {entry.flow}
                              </li>
                            ) : null}
                          </ul>
                        ) : null}

                        {entry.notes && (
                          <blockquote className="border-l-[3px] border-[var(--rule-strong)] pl-3 font-serif text-[1.05rem] italic leading-relaxed text-[var(--ink)]">
                            {entry.notes}
                          </blockquote>
                        )}

                        {entry.symptoms && entry.symptoms.length > 0 && (
                          <div>
                            <button
                              type="button"
                              className="flex min-h-[48px] w-full items-center justify-between gap-2 rounded-[var(--radius)] px-1 text-left font-bold text-[var(--ink)] hover:text-[var(--accent)]"
                              aria-expanded={isExpanded}
                              aria-controls={symId}
                              onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                            >
                              <span>
                                {entry.symptoms.length} {entry.symptoms.length === 1 ? 'symptom' : 'symptoms'}
                                {!isExpanded && (
                                  <span className="font-normal text-[var(--ink-muted)]">
                                    {' '}
                                    · {entry.symptoms.slice(0, 2).map((s) => s.name).join(', ')}
                                    {entry.symptoms.length > 2 ? '…' : ''}
                                  </span>
                                )}
                              </span>
                              <Icon.Chevron
                                width={20}
                                height={20}
                                className={`shrink-0 text-[var(--ink-muted)] transition-transform ${isExpanded ? '-rotate-90' : 'rotate-90'}`}
                              />
                            </button>
                            {isExpanded && (
                              <ul id={symId} className="mt-1 grid gap-2 sm:grid-cols-2">
                                {entry.symptoms.map((s) => (
                                  <li
                                    key={s.id}
                                    className="flex items-center justify-between gap-3 rounded-[var(--radius)] bg-[var(--paper-sunk)] px-3 py-2"
                                  >
                                    <span className="min-w-0 font-bold">{s.name}</span>
                                    <span className="shrink-0 text-[1rem] text-[var(--ink-muted)]">
                                      {s.severity} of 5
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        )}
                      </article>
                    )}

                    {/* Treatment events on this date */}
                    {dayEvents.length > 0 && viewMode !== 'checkins' && (
                      <div className="row-list">
                        {(!entry || viewMode === 'treatments') && (
                          <p className="bg-[var(--paper-sunk)] px-4 py-2 font-serif text-[1.1rem] font-semibold">{formattedDate}</p>
                        )}
                        {dayEvents.map((evt) => (
                          <div key={evt.id} className="row flex-wrap">
                            <span className="row-icon" aria-hidden="true">
                              <Icon.Treatments width={22} height={22} />
                            </span>
                            <div className="row-main">
                              <p className="row-title">
                                {evt.treatmentName}{' '}
                                <span
                                  className={`ml-1 inline-block rounded-full px-2 py-0.5 text-[0.85rem] font-bold capitalize ${
                                    evt.action === 'skipped'
                                      ? 'bg-[var(--paper-sunk)] text-[var(--ink-muted)]'
                                      : 'bg-[var(--g-strong-soft)] text-[var(--g-strong-ink)]'
                                  }`}
                                >
                                  {evt.action}
                                </span>
                              </p>
                              {evt.site && <p className="row-meta">Site: {evt.site}</p>}
                              {evt.notes && <p className="row-meta">{evt.notes}</p>}
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={(e) => handleOpenComparison(evt, e)}
                                className="btn btn-secondary btn-sm"
                              >
                                Before and after
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleDeleteEvent(evt, e)}
                                className="icon-btn text-[var(--ink-muted)] hover:text-[var(--urgent)]"
                                aria-label={`Remove ${evt.action} entry for ${evt.treatmentName}`}
                              >
                                <TrashIcon />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          </>
        )}
      </AppPage>

      {/* Before / after comparison: a native dialog (focus trap, Esc to close). */}
      <dialog
        ref={dialogRef}
        className="sheet"
        aria-labelledby="cmp-title"
        onClose={() => setShowComparisonModal(false)}
        onClick={(e) => {
          if (e.target === dialogRef.current) setShowComparisonModal(false);
        }}
      >
        {activeComparisonEvent && comparisonResult && (
          <>
            <div className="sheet-grip" aria-hidden="true" />
            <div className="sheet-head">
              <div className="min-w-0">
                <h2 id="cmp-title" className="sheet-title">
                  Before and after: {activeComparisonEvent.treatmentName}
                </h2>
                <p className="text-[1rem] text-[var(--ink-muted)]">
                  <span className="capitalize">{activeComparisonEvent.action}</span> on{' '}
                  {new Date(activeComparisonEvent.date + 'T00:00:00').toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <button type="button" className="icon-btn" aria-label="Close" onClick={() => setShowComparisonModal(false)}>
                <Icon.Close width={22} height={22} />
              </button>
            </div>
            <div className="sheet-body grid gap-4">
              <div className="grid gap-2">
                <span className="label">Compare the days on each side</span>
                <QuickPick
                  label="Days to compare"
                  options={[
                    { value: 7 as const, label: '7 days' },
                    { value: 14 as const, label: '14 days' },
                    { value: 30 as const, label: '30 days' },
                  ]}
                  value={comparisonWindow}
                  onChange={handleChangeComparisonWindow}
                />
              </div>

              {[
                {
                  k: 'hf',
                  title: 'Hot flashes',
                  value: `${comparisonResult.hotFlashes.beforeDailyAvg} → ${comparisonResult.hotFlashes.afterDailyAvg} a day`,
                  text: comparisonResult.hotFlashes.statement,
                },
                {
                  k: 'sleep',
                  title: 'Sleep',
                  value: `${comparisonResult.sleep.beforeAvgHours} → ${comparisonResult.sleep.afterAvgHours} hours`,
                  text: comparisonResult.sleep.statement,
                },
                {
                  k: 'feel',
                  title: 'How you felt',
                  value: `${comparisonResult.feeling.beforeAvg} → ${comparisonResult.feeling.afterAvg} out of 5`,
                  text: comparisonResult.feeling.statement,
                },
              ].map((m) => (
                <section key={m.k} className="grid gap-1.5 rounded-[var(--radius)] border border-[var(--rule)] p-4" aria-label={m.title}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <h3 className="font-bold">{m.title}</h3>
                    <span className="font-serif text-[1.15rem] font-semibold tabular-nums">{m.value}</span>
                  </div>
                  <p className="text-[1rem] leading-relaxed text-[var(--ink-muted)]">{m.text}</p>
                </section>
              ))}

              <div className="callout callout-careful m-0">
                <p className="callout-title">This is a pattern, not proof</p>
                <p className="text-[1rem]">{comparisonResult.safetyNotice}</p>
              </div>

              <button type="button" className="btn btn-secondary btn-block" onClick={() => setShowComparisonModal(false)}>
                Close
              </button>
            </div>
          </>
        )}
      </dialog>
    </div>
  );
}
