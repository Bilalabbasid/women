'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Pill,
  ArrowRight,
  Flame,
  Brain,
  ChevronRight,
  Check,
  Stethoscope,
  PlusCircle,
  CalendarClock,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AppHeader } from '@/components/app/app-header';
import { LocalDataService } from '@/lib/db/service';
import { LocalCheckin, LocalSymptomEntry, LocalTreatment, LocalTreatmentEvent } from '@/lib/db/schema';
import { NotificationService } from '@/lib/notifications/treatment-reminders';
import { describeStorageError } from '@/lib/storage/errors';
import { useLocalToday } from '@/components/storage/use-tool-state';
import { getMissedDays } from '@/lib/tracker/catch-up';

const CATCH_UP_DISMISSED_KEY = 'catch_up_dismissed_on';

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

  const feelings = [
    { value: 1, label: 'Rough' },
    { value: 2, label: 'Low' },
    { value: 3, label: 'Okay' },
    { value: 4, label: 'Good' },
    { value: 5, label: 'Great' },
  ];

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
      await LocalDataService.setSetting(CATCH_UP_DISMISSED_KEY, todayStr);
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

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader
        title="Today"
        subtitle={formattedToday}
        showPrivacyBadge={true}
        showSettings={true}
      />

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-5 space-y-5">
        {saveError && (
          <p role="alert" className="rounded-2xl bg-[var(--color-urgent-soft)] p-3 text-sm font-semibold text-[var(--color-urgent)]">
            {saveError}
          </p>
        )}

        {/* Catch-up: no notification server exists yet, so she's only reminded of a gap when she opens the app herself. */}
        {missedDays.length > 0 && !catchUpDismissed && (
          <Card className="bg-[#FDF9F0] border-[#E9DFC4] p-4 flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#F3E8CE] text-[#8A6D2F] flex items-center justify-center shrink-0">
                <CalendarClock className="w-4.5 h-4.5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#231F1D]">
                  You haven&apos;t logged in {missedDays.length} {missedDays.length === 1 ? 'day' : 'days'}
                </p>
                <p className="text-xs text-[#5C554F] mt-0.5">
                  Want to add those days to your report? Nothing is filled in for you.
                </p>
                <Link href="/app/catch-up/">
                  <Button size="sm" variant="secondary" className="mt-2 text-xs">
                    Catch up
                  </Button>
                </Link>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDismissCatchUp}
              aria-label="Dismiss catch-up reminder for today"
              className="p-1.5 text-[#8A6D2F] hover:text-[#231F1D] shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </Card>
        )}

        {/* Storage status banner */}
        <div className="bg-[#F7F6F2] border border-[#E5DED5] rounded-xl px-3.5 py-1.5 flex items-center justify-between text-xs text-[#68615C]">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#2C6E49]" />
            <span>Stored on this device (IndexedDB)</span>
          </span>
          <span className="font-medium text-[#231F1D]">
            {recentCheckins.length} {recentCheckins.length === 1 ? 'day' : 'days'} logged
          </span>
        </div>

        {/* Primary CTA: How are you feeling today? */}
        <section aria-labelledby="today-feeling-heading">
          <Card className="bg-gradient-to-b from-[#FDF9F6] to-white border-[#E5DCD2] p-5 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <Badge variant="primary" className="text-xs">
                Daily Check-in
              </Badge>
              <span className="text-xs text-[#68615C]">
                {todayCheckin ? 'Logged today • Tap to edit' : 'Takes ~30 seconds'}
              </span>
            </div>

            <h2
              id="today-feeling-heading"
              className="text-xl sm:text-2xl font-serif font-semibold text-[#231F1D] mb-1"
            >
              How are you feeling today?
            </h2>
            <p className="text-xs sm:text-sm text-[#68615C] mb-5">
              Select your overall baseline, or open the full check-in for symptoms, sleep, and notes.
            </p>

            {/* 5-scale feeling selector */}
            <div className="grid grid-cols-5 gap-2 sm:gap-3 mb-5">
              {feelings.map((f) => {
                const isSelected = selectedFeeling === f.value;
                return (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => handleQuickFeelingSelect(f.value as 1 | 2 | 3 | 4 | 5)}
                    className={`flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-2xl border transition-all text-center select-none active:scale-95 ${
                      isSelected
                        ? 'border-[#1F5A4C] bg-[#E6EFEB] text-[#231F1D] font-semibold ring-2 ring-[#1F5A4C]/20'
                        : 'border-[#E5DED5] bg-white text-[#554E48] hover:border-[#D0C7BC] hover:bg-[#FDFBF8]'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-serif font-bold mb-1.5 transition-colors ${
                        isSelected ? 'bg-[#1F5A4C] text-white' : 'bg-[#EEF1EF] text-[#68615C]'
                      }`}
                    >
                      {f.value}
                    </div>
                    <span className="text-xs leading-none font-medium">{f.label}</span>
                  </button>
                );
              })}
            </div>

            <Link href="/app/check-in/">
              <Button variant="primary" fullWidth size="lg" className="gap-2 text-sm sm:text-base">
                <Sparkles className="w-4 h-4" />
                <span>{todayCheckin ? 'Edit Today’s Check-in' : 'Complete Full Check-in'}</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </Card>
        </section>

        {/* Treatment Schedule */}
        <section aria-labelledby="treatment-heading">
          <div className="flex items-center justify-between mb-2 px-1">
            <h3 id="treatment-heading" className="text-sm font-semibold text-[#231F1D]">
              Today’s Treatment Schedule
            </h3>
            <Link href="/app/treatments/" className="text-xs text-[#1F5A4C] hover:underline font-medium">
              Manage Regimens
            </Link>
          </div>

          {activeTreatments.length === 0 ? (
            <Card variant="muted" className="p-4 flex items-center justify-between gap-3 text-xs text-[#68615C]">
              <span>No active treatments or supplements recorded.</span>
              <Link href="/app/treatments/">
                <Button size="sm" variant="outline" className="text-xs">
                  Add Regimen
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="space-y-2.5">
              {(() => {
                const { due, completed } = NotificationService.calculateDueTreatments(
                  activeTreatments,
                  todayEvents,
                  todayStr
                );

                if (due.length === 0 && completed.length === 0) {
                  return (
                    <Card variant="muted" className="p-4 text-xs text-[#68615C] text-center">
                      No treatments scheduled for today.
                    </Card>
                  );
                }

                return (
                  <>
                    {due.map((t) => (
                      <Card key={t.id} className="p-4 flex items-center justify-between gap-3 bg-white">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#E6EFEB] text-[#1F5A4C] flex items-center justify-center shrink-0">
                            <Pill className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-sm text-[#231F1D]">{t.name}</p>
                              <Badge variant="primary" className="text-xs capitalize">
                                {t.type.replace('hrt_', '')}
                              </Badge>
                            </div>
                            <p className="text-xs text-[#68615C] mt-0.5">
                              {t.dosage ? `${t.dosage} • ` : ''}
                              {t.frequency}
                              {t.defaultSite ? ` • Site: ${t.defaultSite}` : ''}
                            </p>
                          </div>
                        </div>

                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleLogTreatmentDone(t)}
                          className="shrink-0 text-xs px-3 min-h-[44px]"
                        >
                          <Check className="w-3.5 h-3.5 mr-1" />
                          {t.type === 'patch' || t.type === 'hrt_patch' ? 'Change Patch' : 'Mark Done'}
                        </Button>
                      </Card>
                    ))}

                    {completed.map((t) => (
                      <Card
                        key={t.id}
                        variant="muted"
                        className="p-3 bg-[#F7F6F2] border-[#E2DBD1] flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-5 h-5 rounded-full bg-[#EFF7F2] text-[#2C6E49] flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                          <span className="font-semibold text-[#231F1D] line-through opacity-75">{t.name}</span>
                        </div>
                        <span className="text-xs text-[#2C6E49] font-medium">Logged for today</span>
                      </Card>
                    ))}
                  </>
                );
              })()}
            </div>
          )}
        </section>

        {/* Recent Checkins List */}
        <section aria-labelledby="recent-summary-heading">
          <div className="flex items-center justify-between mb-2 px-1">
            <h3 id="recent-summary-heading" className="text-sm font-semibold text-[#231F1D]">
              Recent Logs
            </h3>
            <Link href="/app/timeline/" className="text-xs text-[#1F5A4C] hover:underline font-medium">
              View Full Timeline
            </Link>
          </div>

          {recentCheckins.length === 0 && !isLoading ? (
            <Card variant="muted" className="p-5 text-center space-y-3">
              <p className="text-xs text-[#68615C]">
                No check-ins recorded yet on this device.
              </p>
              <div className="flex items-center justify-center gap-2">
                <Link href="/app/check-in/">
                  <Button size="sm" variant="primary" className="gap-1.5 text-xs">
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Log First Check-in</span>
                  </Button>
                </Link>
              </div>
            </Card>
          ) : (
            <div className="space-y-2">
              {recentCheckins.slice(0, 3).map((item) => (
                <Card key={item.id} variant="muted" className="p-3.5 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-[#231F1D]">
                        {new Date(item.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      <Badge variant={item.overallFeeling >= 4 ? 'success' : 'neutral'} className="text-xs">
                        Feeling: {item.overallFeeling}/5
                      </Badge>
                      {item.hotFlashCount ? (
                        <span className="text-xs text-[#1F5A4C] flex items-center gap-0.5">
                          <Flame className="w-3 h-3" /> {item.hotFlashCount} flashes
                        </span>
                      ) : null}
                    </div>
                    {item.notes && (
                      <p className="text-xs text-[#554E48] mt-1.5 line-clamp-1 italic">
                        &quot;{item.notes}&quot;
                      </p>
                    )}
                  </div>
                  <Link
                    href="/app/timeline/"
                    className="text-[#5C554F] hover:text-[#231F1D] p-1 mt-1 shrink-0"
                    aria-label="View entry in timeline"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Quick Navigation Cards */}
        <section className="grid grid-cols-2 gap-3 pt-2">
          <Link href="/app/insights/" className="block group">
            <Card variant="default" className="p-4 h-full group-hover:border-[#1F5A4C] transition-colors">
              <div className="w-8 h-8 rounded-lg bg-[#E6EFEB] text-[#1F5A4C] flex items-center justify-center mb-2">
                <Brain className="w-4 h-4" />
              </div>
              <p className="font-semibold text-xs text-[#231F1D] group-hover:text-[#1F5A4C] transition">
                Symptom Trends
              </p>
              <p className="text-xs text-[#68615C] mt-0.5">
                Deterministic calculations of sleep & hot flash frequencies.
              </p>
            </Card>
          </Link>

          <Link href="/app/doctor-report/" className="block group">
            <Card variant="default" className="p-4 h-full group-hover:border-[#1F5A4C] transition-colors">
              <div className="w-8 h-8 rounded-lg bg-[#EFF5F0] text-[#2C6E49] flex items-center justify-center mb-2">
                <Stethoscope className="w-4 h-4" />
              </div>
              <p className="font-semibold text-xs text-[#231F1D] group-hover:text-[#2C6E49] transition">
                Doctor Mode
              </p>
              <p className="text-xs text-[#68615C] mt-0.5">
                Generate a 1-page summary for your next appointment.
              </p>
            </Card>
          </Link>
        </section>
      </div>
    </div>
  );
}
