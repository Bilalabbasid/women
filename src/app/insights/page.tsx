'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingDown,
  Moon,
  Flame,
  Info,
  PlusCircle,
  BarChart3,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AppHeader } from '@/components/app/app-header';
import { LocalDataService } from '@/lib/db/service';
import { InsightsEngine, SymptomStats, SleepStats, HotFlashStats } from '@/lib/insights/calculations';

export default function InsightsPage() {
  const [selectedRange, setSelectedRange] = useState<'30' | '60' | '90'>('30');
  const [symptomStats, setSymptomStats] = useState<SymptomStats[]>([]);
  const [sleepStats, setSleepStats] = useState<SleepStats | null>(null);
  const [hotFlashStats, setHotFlashStats] = useState<HotFlashStats | null>(null);
  const [recordCount, setRecordCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchInsights() {
      const days = parseInt(selectedRange, 10);
      const end = new Date().toISOString().split('T')[0];
      const start = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];

      const checkinsWithSymptoms = await LocalDataService.getCheckinsForRange(start, end);

      if (!isMounted) return;

      setRecordCount(checkinsWithSymptoms.length);

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


  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader
        title="Insights & Trends"
        subtitle="Verifiable local calculations"
        showPrivacyBadge={true}
        showSettings={true}
      />

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-5 space-y-6">
        {/* Association vs Causation Guardrail Card */}
        <Card variant="muted" className="p-4 flex items-start gap-3 text-xs text-[#554E48]">
          <Info className="w-4 h-4 text-[#965342] shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-[#231F1D] mb-0.5">Scientific Rigor Notice</p>
            <p className="leading-relaxed">
              These metrics reflect mathematically calculated frequencies from your personal logs. Timelines illustrate <em>associations over time</em>, never medical causation. Multiple lifestyle and biological factors influence symptoms simultaneously.
            </p>
          </div>
        </Card>

        {/* Range Selector */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-serif font-semibold text-[#231F1D]">
            Observed Window ({recordCount} {recordCount === 1 ? 'day' : 'days'} logged)
          </h2>
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#E5DED5]">
            {(['30', '60', '90'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setSelectedRange(r)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  selectedRange === r
                    ? 'bg-[#965342] text-white shadow-xs'
                    : 'text-[#68615C] hover:text-[#231F1D]'
                }`}
              >
                {r} Days
              </button>
            ))}
          </div>
        </div>

        {recordCount === 0 && !isLoading ? (
          <Card variant="muted" className="p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#F7EFEA] text-[#965342] flex items-center justify-center mx-auto">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-serif font-semibold text-base text-[#231F1D]">
                No data recorded in this {selectedRange}-day window
              </h3>
              <p className="text-xs text-[#68615C] mt-1 max-w-xs mx-auto">
                Log a few daily check-ins to generate mathematical summaries and trend observations.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <Link href="/check-in">
                <Button size="sm" variant="primary" className="gap-1.5 text-xs">
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Log Check-in</span>
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          <>
            {/* Key Deterministic Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="p-4 bg-white space-y-2">
                <span className="text-xs text-[#68615C] flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-[#965342]" />
                  Hot Flash Frequency
                </span>
                <p className="text-2xl font-serif font-bold text-[#231F1D]">
                  {hotFlashStats?.dailyAverage ?? 0}{' '}
                  <span className="text-xs font-sans font-normal text-[#68615C]">/ day avg</span>
                </p>
                <div className="flex items-center gap-1 text-[11px] text-[#2C6E49] font-medium">
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>{hotFlashStats?.totalRecorded ?? 0} total in window</span>
                </div>
              </Card>

              <Card className="p-4 bg-white space-y-2">
                <span className="text-xs text-[#68615C] flex items-center gap-1.5">
                  <Moon className="w-3.5 h-3.5 text-[#577060]" />
                  Sleep Average
                </span>
                <p className="text-2xl font-serif font-bold text-[#231F1D]">
                  {sleepStats?.averageHours ?? 0}{' '}
                  <span className="text-xs font-sans font-normal text-[#68615C]">hours/night</span>
                </p>
                <p className="text-[11px] text-[#68615C]">
                  Night waking: {sleepStats?.nightsWokeAtNight ?? 0} of {recordCount} nights ({sleepStats?.wakingPercent ?? 0}%)
                </p>
              </Card>
            </div>

            {/* Most Frequently Recorded Symptoms */}
            <Card className="p-5 bg-white space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-serif font-semibold text-sm text-[#231F1D]">
                  Symptom Frequency & Severity ({selectedRange} Days)
                </h3>
                <Badge variant="outline">Deterministic</Badge>
              </div>

              {symptomStats.length === 0 ? (
                <p className="text-xs text-[#7A736E] italic">
                  No specific symptoms rated above zero during this period.
                </p>
              ) : (
                <div className="space-y-3.5 text-xs">
                  {symptomStats.map((sym) => (
                    <div key={sym.symptomId} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[#231F1D] font-medium">{sym.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[#965342] font-semibold">
                            Avg Sev: {sym.averageSeverity}/5
                          </span>
                          <span className="text-[#68615C]">
                            {sym.count} {sym.count === 1 ? 'day' : 'days'} ({sym.frequencyPercent}%)
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-[#F3EFEA] rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-[#965342] h-full rounded-full transition-all duration-300"
                          style={{ width: `${sym.frequencyPercent}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
