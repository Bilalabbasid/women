/** @vitest-environment node */
import { describe, it, expect } from 'vitest';
import { buildDoctorReport, MAX_REPORT_SYMPTOMS } from '@/lib/tools/doctor-report';
import { InsightsEngine } from '@/lib/insights/calculations';
import type { LocalCheckin, LocalSymptomEntry, LocalTreatment } from '@/lib/db/schema';

const TODAY = new Date('2026-11-06T12:00:00Z');
let n = 0;
function entry(date: string, over: Partial<LocalCheckin> = {}, symptoms: Array<[string, number]> = []) {
  const id = `c${n++}`;
  return {
    id,
    date,
    timestamp: 0,
    overallFeeling: 3,
    createdAt: 0,
    updatedAt: 0,
    ...over,
    symptoms: symptoms.map(([s, sev], i) => ({
      id: `${id}-${i}`,
      checkinId: id,
      date,
      symptomId: s,
      name: s,
      category: 'x',
      severity: sev,
      timestamp: 0,
    })) as LocalSymptomEntry[],
  } as LocalCheckin & { symptoms: LocalSymptomEntry[] };
}

describe('weekly entries in calculations', () => {
  it('hot flashes per day divide weekly totals by 7 days', () => {
    const stats = InsightsEngine.calculateHotFlashStats([
      entry('2026-11-01', { hotFlashCount: 14, coversDays: 7 }),
      entry('2026-11-02', { hotFlashCount: 4 }),
    ]);
    expect(stats.totalRecorded).toBe(18);
    expect(stats.dailyAverage).toBe(Number((18 / 8).toFixed(1)));
    // A weekly total is never treated as a single day's maximum.
    expect(stats.maxInSingleDay).toBe(4);
  });

  it('sleep averages are weighted by days covered and night waking uses daily entries only', () => {
    const stats = InsightsEngine.calculateSleepStats([
      entry('2026-11-01', { sleepHours: 6, coversDays: 7 }),
      entry('2026-11-02', { sleepHours: 8, wokeAtNight: true }),
    ]);
    expect(stats.averageHours).toBe(Number(((6 * 7 + 8) / 8).toFixed(1)));
    expect(stats.nightsWokeAtNight).toBe(1);
    expect(stats.wakingPercent).toBe(100);
  });
});

describe('doctor report', () => {
  const treatments = [
    { id: 't1', name: 'My patch', type: 'patch', dosage: 'as prescribed', frequency: 'twice weekly', startDate: '2026-09-01', active: true },
    { id: 't2', name: 'Old', type: 'oral', frequency: 'daily', startDate: '2026-01-01', active: false },
  ] as LocalTreatment[];

  it('covers only entries in the window and describes coverage honestly', () => {
    const r = buildDoctorReport(
      [entry('2026-11-05'), entry('2026-11-01', { coversDays: 7 }), entry('2026-09-01')],
      treatments,
      30,
      TODAY,
    );
    expect(r.startDate).toBe('2026-10-08');
    expect(r.endDate).toBe('2026-11-06');
    expect(r.entries).toBe(2);
    expect(r.weeklyEntries).toBe(1);
    expect(r.daysCovered).toBe(8);
    expect(r.treatments.map((t) => t.name)).toEqual(['My patch']);
  });

  it('lists bleeding entries with the heaviest flow', () => {
    const r = buildDoctorReport(
      [entry('2026-11-01', { flow: 'spotting' }), entry('2026-11-03', { flow: 'heavy' }), entry('2026-11-04', { flow: 'none' })],
      [],
      14,
      TODAY,
    );
    expect(r.bleeding).toEqual({ entries: 2, heaviest: 'heavy', dates: ['2026-11-01', '2026-11-03'] });
  });

  it('shows at most a page worth of symptoms, most frequent first', () => {
    const many = Array.from({ length: 12 }, (_, i) => [`s${i}`, 2] as [string, number]);
    const r = buildDoctorReport([entry('2026-11-05', {}, many), entry('2026-11-04', {}, [['s3', 5]])], [], 30, TODAY);
    expect(r.symptoms).toHaveLength(MAX_REPORT_SYMPTOMS);
    expect(r.symptoms[0].symptomId).toBe('s3');
  });

  it('says "not logged" rather than inventing zeros', () => {
    const r = buildDoctorReport([entry('2026-11-05')], [], 30, TODAY);
    expect(r.hotFlashes).toBeNull();
    expect(r.sleep).toBeNull();
    expect(r.bleeding.entries).toBe(0);
  });
});
