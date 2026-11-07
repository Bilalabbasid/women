/** @vitest-environment node */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { buildDoctorReportPdf, glanceRows } from '@/lib/tools/doctor-report-pdf';
import type { DoctorReport } from '@/lib/tools/doctor-report';

const report: DoctorReport = {
  windowDays: 30,
  startDate: '2026-10-08',
  endDate: '2026-11-06',
  entries: 12,
  dailyEntries: 10,
  weeklyEntries: 2,
  daysCovered: 24,
  feelingAverage: 3.2,
  hotFlashes: { total: 41, perDay: 1.7, maxInOneDay: 6 },
  sleep: { averageHours: 6.4, nightsWithWaking: 7, dailyEntries: 10 },
  symptoms: [
    { symptomId: 'hot_flashes', name: 'Hot Flashes', category: 'vasomotor', count: 11, frequencyPercent: 92, averageSeverity: 3.4 },
    { symptomId: 'brain_fog', name: 'Brain Fog', category: 'cognitive', count: 6, frequencyPercent: 50, averageSeverity: 2.5 },
  ],
  bleeding: { entries: 1, heaviest: 'spotting', dates: ['2026-10-20'] },
  treatments: [{ id: 't1', name: 'Patch from my clinic', dosage: 'as prescribed', frequency: 'twice weekly', startDate: '2026-09-01' }],
};
const questions = ['Could these symptoms be related to perimenopause, and what else should we check?'];

describe('doctor report PDF', () => {
  const doc = buildDoctorReportPdf(report, questions, '2026-11-06');
  const raw = doc.output();

  it('contains the report content she logged', () => {
    for (const s of ['Menopause symptom log', 'Hot Flashes', 'Brain Fog', 'Patch from my clinic', 'My questions', 'Notes from my appointment']) {
      expect(raw).toContain(s);
    }
    // Brackets are escaped inside PDF strings, so check the table text without them.
    expect(raw).toContain('11 of 12');
    expect(glanceRows(report)[0][1]).toBe('1.7 a day on average (41 logged; most in one day: 6)');
  });

  it('carries the not-a-diagnosis line and page numbers', () => {
    expect(raw).toContain('not a diagnosis');
    expect(raw).toContain('Page 1 of 1');
  });

  it('carries the honesty notice (we are not doctors; AI-assisted) on every page', () => {
    const long = buildDoctorReportPdf(
      { ...report, symptoms: Array.from({ length: 60 }, (_, i) => ({ ...report.symptoms[0], symptomId: `s${i}`, name: `Symptom ${i}` })) },
      questions,
      '2026-11-06',
    );
    const pages = long.getNumberOfPages();
    expect(pages).toBeGreaterThan(1);
    const text = long.output();
    // jsPDF writes each page's text stream once; count the footer line per page.
    expect(text.split('is not a medical service').length - 1).toBeGreaterThanOrEqual(pages);
    expect(text).toContain('not by a doctor');
  });

  it('contains no links and no commercial content', () => {
    expect(raw).not.toMatch(/\/URI|amazon|\/go\/|commission/i);
  });

  it('writes a sample for visual inspection when asked', () => {
    const out = process.env.PDF_SAMPLE_OUT;
    if (out) fs.writeFileSync(path.resolve(out), Buffer.from(doc.output('arraybuffer')));
    expect(doc.getNumberOfPages()).toBe(1);
  });
});
