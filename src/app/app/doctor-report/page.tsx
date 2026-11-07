'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AppHeader } from '@/components/app/app-header';
import { AppPage, Icon, Panel, QuickPick } from '@/components/app/kit';
import { CopyButton } from '@/components/ui/copy-button';
import { LocalDataService } from '@/lib/db/service';
import type { LocalTreatment, LocalCheckin, LocalSymptomEntry } from '@/lib/db/schema';
import { DOCTOR_QUESTION_STARTERS } from '@/lib/config/doctor-questions';
import { buildDoctorReport } from '@/lib/tools/doctor-report';
import { markToolUsed } from '@/lib/pwa/install-gate';
import { localDateString, localDaysAgo } from '@/lib/utils/local-date';
import { APPOINTMENT_KEY } from '@/lib/tracker/nudges';

const WINDOWS = [14, 30, 60, 90] as const;
const QUESTIONS_KEY = 'doctor_report_questions';

const fmt = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

const fmtLong = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' });

/** Whole days from today to an ISO date (local calendar dates, both at noon UTC). */
function daysUntil(iso: string, todayIso: string): number {
  const a = Date.parse(`${todayIso}T12:00:00Z`);
  const b = Date.parse(`${iso}T12:00:00Z`);
  return Math.round((b - a) / 86400000);
}

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
  const [appointment, setAppointment] = useState<string | null>(null);

  useEffect(() => {
    LocalDataService.getSetting<string[]>(QUESTIONS_KEY, []).then(setQuestions);
    // Same setting Today's reminder reads (Settings → Reminders → next appointment).
    LocalDataService.getSetting<string | null>(APPOINTMENT_KEY, null)
      .then(setAppointment)
      .catch(() => {});
  }, []);

  useEffect(() => {
    const end = localDateString();
    const start = localDaysAgo(windowDays - 1);
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

  const today = localDateString();
  const daysToGo = appointment && appointment >= today ? daysUntil(appointment, today) : null;

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader title="Report" subtitle="A one-page summary for your doctor" showPrivacyBadge showSettings />

      <AppPage className="print:max-w-none print:p-0">
        {/* Before your appointment */}
        {daysToGo !== null && appointment && (
          <section aria-labelledby="appt-h" className="no-print panel panel-feature">
            <div className="flex items-start gap-4">
              <div className="grid h-16 w-16 shrink-0 place-items-center rounded-[var(--radius)] bg-[var(--accent)] text-center text-[var(--on-accent)]">
                <span className="font-serif text-[1.9rem] leading-none font-semibold">{daysToGo}</span>
                <span className="text-[0.75rem] leading-none font-bold">{daysToGo === 1 ? 'day' : 'days'}</span>
              </div>
              <div className="grid gap-1">
                <p className="eyebrow">Before your appointment</p>
                <h2 id="appt-h" className="panel-title">
                  {daysToGo === 0 ? 'Your appointment is today' : `${fmtLong(appointment)}`}
                </h2>
                <p className="text-[var(--ink-muted)]">
                  {questions.length === 0
                    ? 'Pick the questions you want to ask below, then print this page or save it as a PDF.'
                    : `You have ${questions.length} ${questions.length === 1 ? 'question' : 'questions'} ready. Print this page or save it as a PDF to take with you.`}
                </p>
                <a href="#add-q" className="link link-arrow inline-flex min-h-[44px] items-center gap-1.5 justify-self-start">
                  {questions.length === 0 ? 'Choose my questions' : 'Review my questions'}
                </a>
              </div>
            </div>
          </section>
        )}

        {/* Controls */}
        <section aria-labelledby="period-h" className="no-print panel">
          <div>
            <h2 id="period-h" className="panel-title">
              Your report
            </h2>
            <p className="panel-hint">
              It uses only what you logged. Choose a period, add your questions, then print it or save it as a PDF.
            </p>
          </div>
          <QuickPick
            label="Report period"
            columns={4}
            value={windowDays}
            onChange={setWindowDays}
            options={WINDOWS.map((d) => ({ value: d, label: d === 14 ? '2 weeks' : `${d} days` }))}
          />
          <div className="grid gap-2 sm:grid-cols-2">
            <button type="button" onClick={print} className="btn btn-primary btn-lg">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
                <path d="M7 9V3h10v6M7 17H4v-7h16v7h-3" />
                <path d="M7 14h10v7H7z" />
              </svg>
              Print my report
            </button>
            <button type="button" onClick={downloadPdf} aria-busy={pdfBusy || undefined} disabled={pdfBusy} className="btn btn-secondary btn-lg">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
              </svg>
              {pdfBusy ? 'Preparing PDF…' : 'Download PDF'}
            </button>
          </div>
          <p className="hint flex items-center gap-2">
            <Icon.Lock width={16} height={16} className="shrink-0 text-[var(--accent)]" />
            The PDF is made on this device. Nothing is uploaded.
          </p>
        </section>

        {/* The printable page: a live preview that looks like the sheet she'll hand over. */}
        <div className="grid gap-2">
          <p className="eyebrow no-print">Preview</p>
          <article
            aria-label="Doctor report"
            className="grid gap-6 rounded-[var(--radius-sm)] border border-[var(--rule)] bg-[var(--paper-raised)] px-5 py-6 text-[var(--ink)] shadow-[var(--shadow-lift)] sm:px-9 sm:py-9 print:rounded-none print:border-0 print:p-0 print:text-[11pt] print:shadow-none"
          >
            <header className="grid gap-2 border-b-2 border-[var(--ink)] pb-4">
              <p className="text-[0.85rem] font-bold tracking-[0.08em] text-[var(--ink-muted)] uppercase">
                Patient-recorded symptom summary
              </p>
              <h2 className="font-serif text-[1.85rem] leading-tight font-semibold">Menopause symptom log</h2>
              <p className="text-[0.95rem] text-[var(--ink-muted)]">
                {fmt(report.startDate)} to {fmt(report.endDate)} · {report.entries} {report.entries === 1 ? 'entry' : 'entries'}
                {report.weeklyEntries > 0 && ` (${report.dailyEntries} daily, ${report.weeklyEntries} weekly)`} covering{' '}
                {report.daysCovered} of {report.windowDays} days · Printed {fmt(localDateString())}
              </p>
              <p className="text-[0.95rem] text-[var(--ink-muted)]">
                Recorded by me on my own device. Ratings are my own (1 = mild, 5 = severe); this is not a validated
                scale and not a diagnosis.
              </p>
            </header>

            {report.entries === 0 ? (
              <>
              <p className="print-only italic">No entries in this period.</p>
              <div className="empty-state no-print">
                <strong>Nothing logged in this period yet</strong>
                <span>Log a few days and your summary will build itself here.</span>
                <Link href="/app/check-in/" className="btn btn-primary btn-sm">
                  Log today
                </Link>
              </div>
              </>
            ) : (
              <>
                <section aria-labelledby="r-symptoms" className="grid gap-2">
                  <h3 id="r-symptoms" className="font-serif text-[1.25rem] font-semibold">
                    Symptoms, most frequent first
                  </h3>
                  {report.symptoms.length === 0 ? (
                    <p>No symptoms logged.</p>
                  ) : (
                    <table className="w-full border-collapse text-left text-[0.95rem] leading-snug">
                      <thead>
                        <tr className="border-b-2 border-[var(--rule-strong)]">
                          <th scope="col" className="py-2 pr-3 font-bold">
                            Symptom
                          </th>
                          <th scope="col" className="py-2 pr-3 font-bold">
                            Entries
                          </th>
                          <th scope="col" className="py-2 font-bold">
                            Average rating
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.symptoms.map((s) => (
                          <tr key={s.symptomId} className="border-b border-[var(--rule)]">
                            <th scope="row" className="py-2 pr-3 font-normal">
                              {s.name}
                            </th>
                            <td className="py-2 pr-3 whitespace-nowrap tabular-nums">
                              {s.count} of {report.entries}{' '}
                              <span className="text-[var(--ink-muted)]">({s.frequencyPercent}%)</span>
                            </td>
                            <td className="py-2 whitespace-nowrap tabular-nums">{s.averageSeverity} / 5</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </section>

                <section aria-labelledby="r-body" className="grid gap-x-8 gap-y-2 text-[0.95rem] sm:grid-cols-2 print:grid-cols-2">
                  <h3 id="r-body" className="font-serif text-[1.25rem] font-semibold sm:col-span-2 print:col-span-2">
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

            <section aria-labelledby="r-treatments" className="grid gap-2 text-[0.95rem]">
              <h3 id="r-treatments" className="font-serif text-[1.25rem] font-semibold">
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

            <section aria-labelledby="r-questions" className="grid gap-2 text-[0.95rem]">
              <h3 id="r-questions" className="font-serif text-[1.25rem] font-semibold">
                My questions
              </h3>
              {questions.length === 0 ? (
                <p className="text-[var(--ink-muted)] italic">No questions added.</p>
              ) : (
                <ol id="report-questions" className="grid list-decimal gap-1 pl-5">
                  {questions.map((q, i) => (
                    <li key={`${i}-${q}`} className="pl-1">
                      <span className="flex items-start justify-between gap-2">
                        <span className="py-2.5">{q}</span>
                        <button
                          type="button"
                          onClick={() => saveQuestions(questions.filter((_, j) => j !== i))}
                          aria-label={`Remove question ${i + 1}`}
                          className="icon-btn no-print shrink-0 text-[var(--ink-muted)] hover:text-[var(--urgent)]"
                        >
                          <Icon.Close width={20} height={20} />
                        </button>
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </article>
        </div>

        {/* Questions (screen only: the chosen ones print inside the report above) */}
        <div className="no-print">
        <Panel
          id="add-q"
          title="Add your questions"
          hint="They’re printed on your report and saved on this device only."
          action={questions.length > 0 ? <CopyButton targetId="report-questions" label="Copy" className="btn btn-quiet btn-sm" /> : undefined}
        >
          <form onSubmit={addQuestion} className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <label htmlFor="custom-question" className="visually-hidden">
              Your question
            </label>
            <input
              id="custom-question"
              type="text"
              value={customQuestion}
              onChange={(e) => setCustomQuestion(e.target.value)}
              placeholder="Type a question for your doctor"
              className="input"
            />
            <button type="submit" className="btn btn-secondary">
              Add question
            </button>
          </form>
          {DOCTOR_QUESTION_STARTERS.some((q) => !questions.includes(q)) && (
            <div className="grid gap-2">
              <p className="label">Or tap a starter to add it</p>
              <ul className="grid gap-2">
                {DOCTOR_QUESTION_STARTERS.filter((q) => !questions.includes(q)).map((q) => (
                  <li key={q}>
                    <button
                      type="button"
                      onClick={() => saveQuestions([...questions, q])}
                      className="flex min-h-[48px] w-full items-start gap-3 rounded-[var(--radius)] border-[1.5px] border-[var(--rule-strong)] bg-[var(--paper-raised)] px-4 py-3 text-left text-[1rem] leading-snug text-[var(--ink)] transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]"
                    >
                      <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
                        <Icon.Plus width={14} height={14} />
                      </span>
                      <span>{q}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Panel>
        </div>
      </AppPage>
    </div>
  );
}
