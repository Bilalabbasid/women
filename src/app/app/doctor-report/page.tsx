'use client';

import React, { useState, useEffect } from 'react';
import {
  Printer,
  HelpCircle,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AppHeader } from '@/components/app/app-header';
import { LocalDataService } from '@/lib/db/service';
import { LocalTreatment, LocalCheckin, LocalSymptomEntry } from '@/lib/db/schema';
import { DOCTOR_QUESTION_STARTERS } from '@/lib/config/doctor-questions';
import { InsightsEngine, SymptomStats, SleepStats, HotFlashStats } from '@/lib/insights/calculations';

export default function DoctorModePage() {
  const [reportWindow, setReportWindow] = useState<'30' | '60' | '90'>('30');
  const [treatments, setTreatments] = useState<LocalTreatment[]>([]);
  const [checkins, setCheckins] = useState<Array<LocalCheckin & { symptoms: LocalSymptomEntry[] }>>([]);
  const [symptomStats, setSymptomStats] = useState<SymptomStats[]>([]);
  const [sleepStats, setSleepStats] = useState<SleepStats | null>(null);
  const [hotFlashStats, setHotFlashStats] = useState<HotFlashStats | null>(null);

  const [customQuestion, setCustomQuestion] = useState('');
  const [questions, setQuestions] = useState<string[]>([]);

  useEffect(() => {
    async function loadReport() {
      const days = parseInt(reportWindow, 10);
      const end = new Date().toISOString().split('T')[0];
      const start = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];

      const trts = await LocalDataService.getTreatments(true);
      setTreatments(trts);

      const chks = await LocalDataService.getCheckinsForRange(start, end);
      setCheckins(chks);

      if (chks.length > 0) {
        const allSyms = chks.flatMap((c) => c.symptoms);
        setSymptomStats(InsightsEngine.calculateSymptomStats(chks, allSyms));
        setSleepStats(InsightsEngine.calculateSleepStats(chks));
        setHotFlashStats(InsightsEngine.calculateHotFlashStats(chks));
      } else {
        setSymptomStats([]);
        setSleepStats(null);
        setHotFlashStats(null);
      }
    }
    loadReport();
  }, [reportWindow]);

  const addQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuestion.trim()) return;
    setQuestions((q) => [...q, customQuestion.trim()]);
    setCustomQuestion('');
  };

  const addStarter = (q: string) => {
    setQuestions((prev) => (prev.includes(q) ? prev : [...prev, q]));
  };

  const removeQuestion = (idx: number) => {
    setQuestions((q) => q.filter((_, i) => i !== idx));
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader
        title="Doctor Mode"
        subtitle="Prepare concise appointment summaries"
        showPrivacyBadge={true}
        showSettings={true}
      />

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-5 space-y-6">
        {/* Intro Card */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#E5DED5]">
          <div>
            <h2 className="font-serif font-semibold text-base text-[#231F1D]">
              Prepare for Your Clinician Visit
            </h2>
            <p className="text-xs text-[#68615C] mt-0.5">
              Clinicians have 15 minutes. This dossier summarizes your self-reported history at a glance.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="gap-1.5 text-xs min-h-[44px]"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </Button>
          </div>
        </div>

        {/* Window Selector */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-[#68615C]">
            Reporting Period ({checkins.length} {checkins.length === 1 ? 'day' : 'days'} logged):
          </span>
          <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-[#E5DED5]">
            {(['30', '60', '90'] as const).map((days) => (
              <button
                key={days}
                onClick={() => setReportWindow(days)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  reportWindow === days
                    ? 'bg-[#965342] text-white shadow-xs'
                    : 'text-[#68615C] hover:text-[#231F1D]'
                }`}
              >
                Past {days} Days
              </button>
            ))}
          </div>
        </div>

        {/* The Printable Dossier Container */}
        <div className="bg-white rounded-3xl border-2 border-[#D9D1C7] p-5 sm:p-7 space-y-6 shadow-sm print:border-none print:shadow-none print:p-0">
          {/* Header of Report */}
          <div className="border-b border-[#E5DED5] pb-4 space-y-1">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-xs uppercase tracking-wider font-semibold">
                Patient-Generated Health Summary
              </Badge>
              <span className="text-xs text-[#68615C]">
                Generated: {todayFormatted}
              </span>
            </div>
            <h3 className="font-serif font-bold text-xl text-[#231F1D] pt-1">
              Midlife & Menopause Symptom Log
            </h3>
            <p className="text-xs text-[#68615C]">
              Self-reported longitudinal log for clinical review • Period: Past {reportWindow} Days ({checkins.length} check-ins)
            </p>
          </div>

          {/* Clinician Medical Disclaimer */}
          <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#EBE3D8] text-xs text-[#68615C] leading-relaxed">
            <strong>Clinical Notice:</strong> This summary was compiled client-side by the patient from their private local records for discussion during consultation. It does not constitute a diagnostic determination or therapeutic recommendation.
          </div>

          {/* Section 1: Active Treatments */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#231F1D]">
              1. Current Regimens as Recorded ({treatments.length})
            </h4>
            {treatments.length === 0 ? (
              <p className="text-xs text-[#7A736E] italic bg-[#FAF8F5] p-3 rounded-xl border border-[#E5DED5]">
                No active treatments recorded in local app.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {treatments.map((t) => (
                  <div key={t.id} className="p-2.5 rounded-lg border border-[#E5DED5] bg-[#FAF8F5]">
                    <p className="font-semibold text-[#231F1D]">{t.name}</p>
                    <p className="text-[#68615C]">
                      {t.dosage ? `${t.dosage} • ` : ''}{t.frequency}
                      {t.startDate ? ` • Started ${t.startDate}` : ''}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Symptom Frequencies */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#231F1D]">
              2. Reported Symptom Burden (Past {reportWindow} Days)
            </h4>

            {checkins.length === 0 ? (
              <p className="text-xs text-[#7A736E] italic bg-[#FAF8F5] p-3 rounded-xl border border-[#E5DED5]">
                No check-ins recorded during this {reportWindow}-day window.
              </p>
            ) : (
              <div className="space-y-1.5 text-xs text-[#3E3834]">
                {hotFlashStats && (
                  <div className="flex justify-between py-1.5 border-b border-[#F0EBE3]">
                    <span>• Vasomotor (Hot Flashes / Flushes)</span>
                    <span className="font-semibold">
                      {hotFlashStats.dailyAverage}/day avg ({hotFlashStats.totalRecorded} total recorded)
                    </span>
                  </div>
                )}

                {sleepStats && (
                  <div className="flex justify-between py-1.5 border-b border-[#F0EBE3]">
                    <span>• Sleep Recovery</span>
                    <span className="font-semibold">
                      {sleepStats.averageHours} hrs/night avg (Night waking on {sleepStats.nightsWokeAtNight} of {checkins.length} nights)
                    </span>
                  </div>
                )}

                {symptomStats.slice(0, 4).map((sym) => (
                  <div key={sym.symptomId} className="flex justify-between py-1.5 border-b border-[#F0EBE3]">
                    <span>• {sym.name}</span>
                    <span className="font-semibold">
                      {sym.count} of {checkins.length} days ({sym.frequencyPercent}%) • Avg Severity: {sym.averageSeverity}/5
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 3: Questions for My Doctor */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#231F1D] flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-[#965342]" />
              3. Questions to Discuss with Healthcare Provider
            </h4>

            <ul className="space-y-2 text-xs">
              {questions.map((q, idx) => (
                <li
                  key={idx}
                  className="p-3 rounded-xl bg-[#F7EFEA] border border-[#EAD0C2] text-[#231F1D] flex items-start justify-between gap-2"
                >
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-[#965342]">{idx + 1}.</span>
                    <span className="leading-relaxed">{q}</span>
                  </div>
                  <button
                    onClick={() => removeQuestion(idx)}
                    className="text-[#8A817A] hover:text-[#A33A33] p-1 print:hidden"
                    title="Remove question"
                    aria-label="Remove question"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>

            {questions.length === 0 && (
              <p className="text-xs text-[#554E48] print:hidden">
                No questions yet. Add your own below, or tap a starter to add it.
              </p>
            )}

            {/* Optional neutral starters: never pre-filled (DECISIONS.md D-006) */}
            <div className="flex flex-wrap gap-2 print:hidden" aria-label="Question starters">
              {DOCTOR_QUESTION_STARTERS.filter((q) => !questions.includes(q)).map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => addStarter(q)}
                  className="text-left text-xs px-3 py-2 min-h-[44px] rounded-xl border border-[#D9D1C7] bg-white text-[#3E3834] hover:border-[#965342] focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  + {q}
                </button>
              ))}
            </div>

            {/* Add question form */}
            <form onSubmit={addQuestion} className="flex gap-2 print:hidden pt-1">
              <label htmlFor="custom-question" className="sr-only">Your question</label>
              <input
                id="custom-question"
                type="text"
                value={customQuestion}
                onChange={(e) => setCustomQuestion(e.target.value)}
                placeholder="Add a question you'd like to ask your clinician..."
                className="flex-1 px-3 py-2 text-xs rounded-xl border border-[#E5DED5] bg-white focus:outline-none focus:border-[#965342]"
              />
              <Button type="submit" size="sm" variant="secondary" className="text-xs">
                Add
              </Button>
            </form>
          </div>
        </div>

        {/* Client-side privacy statement */}
        <p className="text-center text-xs text-[#7A736E] flex items-center justify-center gap-1.5 pb-6">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#2C6E49]" />
          Generated 100% in your browser • Zero server transmission
        </p>
      </div>
    </div>
  );
}
