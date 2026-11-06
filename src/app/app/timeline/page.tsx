'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Flame,
  Moon,
  Pill,
  Filter,
  Trash2,
  ChevronDown,
  ChevronUp,
  PlusCircle,
  Calendar,
  Sparkles,
  RotateCcw,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AppHeader } from '@/components/app/app-header';
import { LocalDataService } from '@/lib/db/service';
import { LocalCheckin, LocalSymptomEntry, LocalTreatmentEvent } from '@/lib/db/schema';
import {
  TreatmentComparisonEngine,
  TreatmentComparisonResult,
} from '@/lib/insights/treatment-comparison';

export default function TimelinePage() {
  const [filterDays, setFilterDays] = useState<7 | 14 | 30 | 60 | 90>(30);
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

  useEffect(() => {
    let isMounted = true;

    async function loadTimeline() {
      const end = new Date().toISOString().split('T')[0];
      const start = new Date(Date.now() - filterDays * 86400000).toISOString().split('T')[0];

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

  const handleDeleteEntry = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this check-in entry from your local device?')) {
      await LocalDataService.deleteCheckin(id);
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
    { label: '7D', value: 7 },
    { label: '14D', value: 14 },
    { label: '30D', value: 30 },
    { label: '60D', value: 60 },
    { label: '90D', value: 90 },
  ];

  // Unique list of dates having check-ins or treatment events
  const allDates = Array.from(
    new Set([
      ...checkins.map((c) => c.date),
      ...treatmentEvents.map((te) => te.date),
    ])
  ).sort((a, b) => b.localeCompare(a));

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader
        title="Personal Timeline"
        subtitle="Longitudinal history & treatment events"
        showPrivacyBadge={true}
        showSettings={true}
      />

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-5 space-y-5">
        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-white p-2.5 rounded-2xl border border-[#E5DED5]">
          {/* View mode toggle */}
          <div className="flex items-center gap-1 bg-[#FAF8F5] p-1 rounded-xl border border-[#EBE3D8]">
            <button
              onClick={() => setViewMode('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                viewMode === 'all'
                  ? 'bg-[#965342] text-white'
                  : 'text-[#68615C] hover:text-[#231F1D]'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setViewMode('checkins')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                viewMode === 'checkins'
                  ? 'bg-[#965342] text-white'
                  : 'text-[#68615C] hover:text-[#231F1D]'
              }`}
            >
              Check-ins
            </button>
            <button
              onClick={() => setViewMode('treatments')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                viewMode === 'treatments'
                  ? 'bg-[#965342] text-white'
                  : 'text-[#68615C] hover:text-[#231F1D]'
              }`}
            >
              Treatments
            </button>
          </div>

          {/* Time window selector */}
          <div className="flex items-center justify-between sm:justify-end gap-1">
            <span className="text-xs font-semibold text-[#68615C] pr-1 hidden sm:inline-flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              Window:
            </span>
            {filters.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilterDays(f.value as 7 | 14 | 30 | 60 | 90)}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition ${
                  filterDays === f.value
                    ? 'bg-[#965342] text-white shadow-xs'
                    : 'text-[#68615C] hover:bg-[#F3EFEA] hover:text-[#231F1D]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Timeline Items */}
        {allDates.length === 0 && !isLoading ? (
          <Card variant="muted" className="p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#F7EFEA] text-[#965342] flex items-center justify-center mx-auto">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-serif font-semibold text-base text-[#231F1D]">
                No entries in this {filterDays}-day window
              </h3>
              <p className="text-xs text-[#68615C] mt-1 max-w-xs mx-auto">
                Log a daily check-in or treatment to establish your personal longitudinal timeline.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <Link href="/app/check-in/">
                <Button size="sm" variant="primary" className="gap-1.5 text-xs">
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Log Check-in</span>
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E5DED5]">
            {allDates.map((dateStr) => {
              const entry = checkins.find((c) => c.date === dateStr);
              const dayEvents = treatmentEvents.filter((te) => te.date === dateStr);

              // Filter based on viewMode
              if (viewMode === 'checkins' && !entry) return null;
              if (viewMode === 'treatments' && dayEvents.length === 0) return null;

              const isExpanded = entry ? expandedId === entry.id : false;
              const dateObj = new Date(dateStr + 'T00:00:00');
              const formattedDate = dateObj.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });

              return (
                <div key={dateStr} className="relative space-y-2">
                  {/* Dot indicator */}
                  <div
                    className={`absolute -left-6 sm:-left-8 top-1.5 w-6 h-6 rounded-full border-4 border-[#FAF8F5] flex items-center justify-center text-white ${
                      entry
                        ? entry.overallFeeling >= 4
                          ? 'bg-[#2C6E49]'
                          : entry.overallFeeling === 3
                          ? 'bg-[#965342]'
                          : 'bg-[#B25E4B]'
                        : 'bg-[#5C554F]'
                    }`}
                  />

                  <div className="flex items-center justify-between">
                    <span className="font-serif font-semibold text-sm text-[#231F1D]">
                      {formattedDate}
                    </span>
                    {entry && (
                      <div className="flex items-center gap-1.5">
                        <Badge
                          variant={
                            entry.overallFeeling >= 4
                              ? 'success'
                              : entry.overallFeeling === 3
                              ? 'primary'
                              : 'warning'
                          }
                        >
                          Feeling: {entry.overallFeeling}/5
                        </Badge>
                        <button
                          onClick={(e) => handleDeleteEntry(entry.id, e)}
                          className="text-[#5C554F] hover:text-[#A33A33] p-1 transition"
                          title="Delete check-in"
                          aria-label="Delete check-in"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Checkin card */}
                  {entry && viewMode !== 'treatments' && (
                    <Card
                      className="p-4 bg-white space-y-3 cursor-pointer hover:border-[#D0C7BC] transition"
                      onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        {entry.hotFlashCount ? (
                          <span className="inline-flex items-center gap-1 text-xs text-[#965342] bg-[#F7EFEA] px-2.5 py-1 rounded-lg font-medium">
                            <Flame className="w-3.5 h-3.5" /> {entry.hotFlashCount} Hot Flashes
                          </span>
                        ) : null}

                        {entry.sleepHours ? (
                          <span className="inline-flex items-center gap-1 text-xs text-[#577060] bg-[#EDF3EF] px-2.5 py-1 rounded-lg font-medium">
                            <Moon className="w-3.5 h-3.5" /> {entry.sleepHours} hrs sleep
                            {entry.wokeAtNight ? ' (woke at night)' : ''}
                          </span>
                        ) : null}

                        {entry.flow && entry.flow !== 'none' ? (
                          <span className="inline-flex items-center gap-1 text-xs text-[#965342] bg-[#FAF3F0] px-2.5 py-1 rounded-lg font-medium capitalize">
                            Flow: {entry.flow}
                          </span>
                        ) : null}
                      </div>

                      {entry.notes && (
                        <p className="text-xs text-[#554E48] italic bg-[#FAF8F5] p-3 rounded-xl border border-[#EBE3D8] leading-relaxed">
                          &quot;{entry.notes}&quot;
                        </p>
                      )}

                      {/* Detailed symptoms disclosure */}
                      {entry.symptoms && entry.symptoms.length > 0 && (
                        <div className="pt-1">
                          <div className="flex items-center justify-between text-xs text-[#68615C] font-semibold">
                            <span>Recorded Symptoms ({entry.symptoms.length})</span>
                            <span className="flex items-center gap-0.5">
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </span>
                          </div>

                          {isExpanded && (
                            <div className="grid grid-cols-2 gap-2 pt-2 animate-in fade-in">
                              {entry.symptoms.map((s) => (
                                <div
                                  key={s.id}
                                  className="bg-[#FAF8F5] border border-[#E5DED5] p-2 rounded-lg text-xs"
                                >
                                  <p className="font-medium text-[#231F1D] truncate">{s.name}</p>
                                  <p className="text-[#965342] font-semibold text-xs">
                                    Severity: {s.severity}/5
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </Card>
                  )}

                  {/* Treatment events on this date */}
                  {dayEvents.length > 0 && viewMode !== 'checkins' && (
                    <div className="space-y-2">
                      {dayEvents.map((evt) => (
                        <Card
                          key={evt.id}
                          variant="muted"
                          className="p-3 bg-[#FAF8F5] border-[#E5DCD2] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <Pill className="w-4 h-4 text-[#965342]" />
                              <strong className="text-[#231F1D]">{evt.treatmentName}</strong>
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase ${
                                  evt.action === 'skipped'
                                    ? 'bg-[#F2EDEA] text-[#5C554F]'
                                    : 'bg-[#EFF7F2] text-[#2C6E49]'
                                }`}
                              >
                                {evt.action}
                              </span>
                            </div>
                            {evt.site && (
                              <p className="text-xs text-[#965342] flex items-center gap-1 pl-6">
                                <RotateCcw className="w-3 h-3" /> {evt.site}
                              </p>
                            )}
                            {evt.notes && (
                              <p className="text-xs text-[#68615C] pl-6">{evt.notes}</p>
                            )}
                          </div>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => handleOpenComparison(evt, e)}
                            className="text-xs px-2.5 py-1 min-h-[44px] gap-1 text-[#965342] hover:bg-[#F7EFEA] self-start sm:self-center"
                          >
                            <Sparkles className="w-3 h-3" /> Compare Before & After
                          </Button>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Modal: Before / After Comparison */}
        {showComparisonModal && activeComparisonEvent && comparisonResult && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          >
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#E5DED5] space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between">
                <div>
                  <Badge variant="primary" className="text-xs">
                    Deterministic Comparison
                  </Badge>
                  <h3 className="font-serif font-bold text-lg text-[#231F1D] mt-1">
                    {activeComparisonEvent.treatmentName} ({activeComparisonEvent.action.toUpperCase()})
                  </h3>
                  <p className="text-xs text-[#68615C]">
                    Recorded date: {activeComparisonEvent.date}
                  </p>
                </div>
                <button
                  onClick={() => setShowComparisonModal(false)}
                  className="text-xs text-[#5C554F] hover:text-[#231F1D]"
                >
                  ✕
                </button>
              </div>

              {/* Window Selector */}
              <div className="flex items-center justify-between bg-[#FAF8F5] p-2 rounded-2xl border border-[#E5DED5]">
                <span className="text-xs font-semibold text-[#68615C] pl-2">
                  Comparison Window:
                </span>
                <div className="flex gap-1">
                  {([7, 14, 30] as const).map((win) => (
                    <button
                      key={win}
                      onClick={() => handleChangeComparisonWindow(win)}
                      className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
                        comparisonWindow === win
                          ? 'bg-[#965342] text-white'
                          : 'text-[#68615C] hover:bg-[#F0EBE3]'
                      }`}
                    >
                      {win} Days
                    </button>
                  ))}
                </div>
              </div>

              {/* Metric Cards */}
              <div className="space-y-3 text-xs">
                {/* Hot Flash Frequency */}
                <Card className="p-3.5 bg-white border-[#E5DED5] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#231F1D] flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-[#965342]" /> Hot Flashes
                    </span>
                    <span className="text-xs font-bold text-[#68615C]">
                      {comparisonResult.hotFlashes.beforeDailyAvg}/day → {comparisonResult.hotFlashes.afterDailyAvg}/day
                    </span>
                  </div>
                  <p className="text-[#554E48] text-xs leading-relaxed bg-[#FAF8F5] p-2.5 rounded-xl border border-[#EBE3D8]">
                    {comparisonResult.hotFlashes.statement}
                  </p>
                </Card>

                {/* Sleep Duration */}
                <Card className="p-3.5 bg-white border-[#E5DED5] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#231F1D] flex items-center gap-1.5">
                      <Moon className="w-4 h-4 text-[#577060]" /> Sleep Duration
                    </span>
                    <span className="text-xs font-bold text-[#68615C]">
                      {comparisonResult.sleep.beforeAvgHours}h → {comparisonResult.sleep.afterAvgHours}h
                    </span>
                  </div>
                  <p className="text-[#554E48] text-xs leading-relaxed bg-[#FAF8F5] p-2.5 rounded-xl border border-[#EBE3D8]">
                    {comparisonResult.sleep.statement}
                  </p>
                </Card>

                {/* Overall Feeling */}
                <Card className="p-3.5 bg-white border-[#E5DED5] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#231F1D]">Overall Daily Feeling</span>
                    <span className="text-xs font-bold text-[#68615C]">
                      {comparisonResult.feeling.beforeAvg}/5 → {comparisonResult.feeling.afterAvg}/5
                    </span>
                  </div>
                  <p className="text-[#554E48] text-xs leading-relaxed bg-[#FAF8F5] p-2.5 rounded-xl border border-[#EBE3D8]">
                    {comparisonResult.feeling.statement}
                  </p>
                </Card>
              </div>

              {/* Strict Non-Causation Safety Guardrail */}
              <div className="bg-[#FAF3F0] border border-[#ECD9D1] rounded-2xl p-3.5 text-xs text-[#965342] space-y-1">
                <p className="font-semibold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  Medical Correlation Disclaimer:
                </p>
                <p className="leading-relaxed text-xs text-[#7A4234]">
                  {comparisonResult.safetyNotice}
                </p>
              </div>

              <div className="pt-2">
                <Button
                  variant="outline"
                  fullWidth
                  size="sm"
                  onClick={() => setShowComparisonModal(false)}
                >
                  Close Summary
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
