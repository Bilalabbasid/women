'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Download, Printer, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppHeader } from '@/components/app/app-header';
import { LocalDataService } from '@/lib/db/service';
import type { LocalTreatment, LocalCheckin, LocalSymptomEntry } from '@/lib/db/schema';
import { DOCTOR_QUESTION_STARTERS } from '@/lib/config/doctor-questions';
import { buildDoctorReport } from '@/lib/tools/doctor-report';
import { markToolUsed } from '@/lib/pwa/install-gate';

const WINDOWS = [14, 30, 60, 90] as const;
const QUESTIONS_KEY = 'doctor_report_questions';

const fmt = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

/**
 * One-page doctor report. Everything is computed on the device from her own
 * entries (src/lib/tools/doctor-report.ts) and printed by the browser. Nothing
 * is uploaded. Logic is described for clinical review in content/_tools/symptom-tracker.yaml.
 */
export default function DoctorReportPage() {
  const [windowDays, setWindowDays] = useState<(typeof WINDOWS)[number]>(30);
  const [treatments, setTreatments] = useState<LocalTreatment[]>([]);
  const [checkins, setCheckins] = useState<Array<LocalCheckin & { symptoms: LocalSymptomEntry[] }>>([]);
  const [questions, setQuestions] = useState<string[]>([]);
  const [customQuestion, setCustomQuestion] = useState('');

  useEffect(() => {
    LocalDataService.getSetting<string[]>(QUESTIONS_KEY, []).then(setQuestions);
  }, []);

  useEffect(() => {
    const end = new Date().toISOString().slice(0, 10);
    const start = new Date(Date.now() - (windowDays - 1) * 86_400_000).toISOString().slice(0, 10);
    Promise.all([LocalDataService.getTreatments(true), LocalDataService.getCheckinsForRange(start, end)]).then(([t, c]) => {
      setTreatments(t);
      setCheckins(c);
    });
  }, [windowDays]);

  const report = useMemo(() => buildDoctorReport(checkins, treatments, windowDays), [checkins, treatments, windowDays]);

  const saveQuestions = (next: string[]) => {
    setQuestions(next);
    void LocalDataService.setSetting(QUESTIONS_KEY, next);
  };
  const addQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    const q = customQuestion.trim();
    if (!q) return;
    saveQuestions([...questions, q]);
    setCustomQuestion('');
  };

  const print = () => {
    markToolUsed();
    window.print();
  };

  const [pdfBusy, setPdfBusy] = useState(false);
  // jsPDF is loaded only when she asks for the PDF, so the page itself stays light.
  const downloadPdf = async () => {
    setPdfBusy(true);
    try {
      const { downloadDoctorReportPdf } = await import('@/lib/tools/doctor-report-pdf');
      downloadDoctorReportPdf(report, questions);
      markToolUsed();
    } finally {
      setPdfBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader title="Doctor report" subtitle="A one-page summary to download or print" showPrivacyBadge showSettings />

      <div className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-4 py-5 print:max-w-none print:p-0">
        <div className="no-print space-y-3">
          <p className="text-[var(--color-ink-muted)]">
            This summary uses only what you logged. Choose a period, add your questions, then print it or save it as a
            PDF to take to your appointment.
          </p>
          <fieldset className="flex flex-wrap items-center gap-2">
            <legend className="mb-1 font-semibold text-[var(--color-ink)]">Period</legend>
            {WINDOWS.map((d) => (
              <button
                key={d}
                type="button"
                aria-pressed={windowDays === d}
                onClick={() => setWindowDays(d)}
                className={`min-h-[44px] rounded-xl border px-4 font-semibold ${
                  windowDays === d ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-white' : 'border-[var(--color-rule)] bg-[var(--color-paper-raised)] text-[var(--color-ink-muted)]'
                }`}
              >
                Past {d} days
              </button>
            ))}
          </fieldset>
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={downloadPdf} disabled={pdfBusy} className="gap-2">
              <Download className="h-4 w-4" aria-hidden="true" />
              {pdfBusy ? 'Preparing PDF…' : 'Download PDF'}
            </Button>
            <Button variant="outline" onClick={print} className="gap-2">
              <Printer className="h-4 w-4" aria-hidden="true" />
              Print
            </Button>
          </div>
          <p className="text-xs text-[var(--color-ink-muted)]">The PDF is created on this device. Nothing is uploaded.</p>
        </div>

        {/* The printable page */}
        <article
          aria-label="Doctor report"
          className="space-y-4 rounded-2xl border-2 border-[var(--color-rule)] bg-[var(--color-paper-raised)] p-5 text-[var(--color-ink)] print:rounded-none print:border-0 print:p-0 print:text-[11pt]"
        >
          <header className="space-y-1 border-b border-[var(--color-rule)] pb-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-muted)]">Patient-recorded symptom summary</p>
            <h2 className="font-serif text-xl font-bold">Menopause symptom log</h2>
            <p className="text-xs text-[var(--color-ink-muted)]">
              {fmt(report.startDate)} to {fmt(report.endDate)} · {report.entries} {report.entries === 1 ? 'entry' : 'entries'}
              {report.weeklyEntries > 0 && ` (${report.dailyEntries} daily, ${report.weeklyEntries} weekly)`} covering{' '}
              {report.daysCovered} of {report.windowDays} days · Printed {fmt(new Date().toISOString().slice(0, 10))}
            </p>
            <p className="text-xs text-[var(--color-ink-muted)]">
              Recorded by me on my own device. Ratings are my own (1 = mild, 5 = severe); this is not a
              validated scale and not a diagnosis.
            </p>
          </header>

          {report.entries === 0 ? (
            <p className="italic text-[var(--color-ink-muted)]">No entries in this period.</p>
          ) : (
            <>
              <section aria-labelledby="r-symptoms" className="space-y-1">
                <h3 id="r-symptoms" className="text-base font-bold">
                  Symptoms, most frequent first
                </h3>
                {report.symptoms.length === 0 ? (
                  <p className="text-xs">No symptoms logged.</p>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[var(--color-rule)]">
                        <th className="py-1 font-semibold">Symptom</th>
                        <th className="py-1 font-semibold">Entries</th>
                        <th className="py-1 font-semibold">Average rating</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.symptoms.map((s) => (
                        <tr key={s.symptomId} className="border-b border-[var(--color-rule)]">
                          <td className="py-1">{s.name}</td>
                          <td className="py-1">
                            {s.count} of {report.entries} ({s.frequencyPercent}%)
                          </td>
                          <td className="py-1">{s.averageSeverity} / 5</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </section>

              <section aria-labelledby="r-body" className="grid gap-x-6 gap-y-1 text-xs sm:grid-cols-2 print:grid-cols-2">
                <h3 id="r-body" className="text-base font-bold sm:col-span-2 print:col-span-2">
                  Hot flashes, sleep and bleeding
                </h3>
                <p>
                  <strong>Hot flashes:</strong>{' '}
                  {report.hotFlashes
                    ? `${report.hotFlashes.perDay} a day on average (${report.hotFlashes.total} logged${
                        report.hotFlashes.maxInOneDay !== null ? `; most in one day: ${report.hotFlashes.maxInOneDay}` : ''
                      })`
                    : 'not logged'}
                </p>
                <p>
                  <strong>Sleep:</strong>{' '}
                  {report.sleep
                    ? `${report.sleep.averageHours} hours a night on average${
                        report.sleep.dailyEntries > 0
                          ? `; woke at night on ${report.sleep.nightsWithWaking} of ${report.sleep.dailyEntries} daily entries`
                          : ''
                      }`
                    : 'not logged'}
                </p>
                <p>
                  <strong>Bleeding:</strong>{' '}
                  {report.bleeding.entries === 0
                    ? 'none logged'
                    : `${report.bleeding.entries} ${report.bleeding.entries === 1 ? 'entry' : 'entries'}, heaviest: ${report.bleeding.heaviest}`}
                  {report.bleeding.dates.length > 0 && ` (${report.bleeding.dates.map(fmt).join(', ')})`}
                </p>
                <p>
                  <strong>Overall feeling:</strong>{' '}
                  {report.feelingAverage !== null ? `${report.feelingAverage} / 5 on average (my own rating)` : 'not logged'}
                </p>
              </section>
            </>
          )}

          <section aria-labelledby="r-treatments" className="space-y-1 text-xs">
            <h3 id="r-treatments" className="text-base font-bold">
              Current treatments, as I recorded them
            </h3>
            {report.treatments.length === 0 ? (
              <p>None recorded.</p>
            ) : (
              <ul className="list-disc pl-5">
                {report.treatments.map((t) => (
                  <li key={t.id}>
                    {t.name}
                    {t.dosage ? `, ${t.dosage}` : ''}
                    {t.frequency ? `, ${t.frequency}` : ''}
                    {t.startDate ? `, since ${fmt(t.startDate)}` : ''}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="r-questions" className="space-y-2 text-xs">
            <h3 id="r-questions" className="text-base font-bold">
              My questions
            </h3>
            {questions.length === 0 ? (
              <p className="italic">No questions added.</p>
            ) : (
              <ol className="list-decimal space-y-1 pl-5">
                {questions.map((q, i) => (
                  <li key={`${i}-${q}`} className="pr-2">
                    <span>{q}</span>
                    <button
                      type="button"
                      onClick={() => saveQuestions(questions.filter((_, j) => j !== i))}
                      aria-label={`Remove question ${i + 1}`}
                      className="no-print ml-2 inline-flex min-h-[44px] min-w-[44px] items-center justify-center align-middle text-[var(--color-ink-muted)] hover:text-[var(--color-urgent)]"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </article>

        <section aria-labelledby="add-q" className="no-print space-y-3">
          <h2 id="add-q" className="font-serif text-lg font-semibold">
            Add questions
          </h2>
          <form onSubmit={addQuestion} className="flex gap-2">
            <label htmlFor="custom-question" className="sr-only">
              Your question
            </label>
            <input
              id="custom-question"
              type="text"
              value={customQuestion}
              onChange={(e) => setCustomQuestion(e.target.value)}
              placeholder="Type a question for your clinician"
              className="min-h-[44px] flex-1 rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)] px-3"
            />
            <Button type="submit" variant="secondary">
              Add
            </Button>
          </form>
          <p className="text-[var(--color-ink-muted)]">Or tap a starter to add it:</p>
          <ul className="flex flex-wrap gap-2">
            {DOCTOR_QUESTION_STARTERS.filter((q) => !questions.includes(q)).map((q) => (
              <li key={q}>
                <button
                  type="button"
                  onClick={() => saveQuestions([...questions, q])}
                  className="min-h-[44px] rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)] px-3 py-2 text-left text-xs text-[var(--color-ink-muted)] hover:border-[var(--color-accent)]"
                >
                  + {q}
                </button>
              </li>
            ))}
          </ul>
          <p className="text-xs text-[var(--color-ink-muted)]">Your questions are saved on this device only.</p>
        </section>
      </div>
    </div>
  );
}
