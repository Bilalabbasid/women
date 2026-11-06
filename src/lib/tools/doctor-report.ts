import type { LocalCheckin, LocalSymptomEntry, LocalTreatment, FlowLevel } from '../db/schema';
import { InsightsEngine, daysCovered, type SymptomStats } from '../insights/calculations';
import { localDateString, localDaysAgo } from '../utils/local-date';

/**
 * Builds the one-page doctor report from her own entries. Pure and local, so
 * it can be tested and clinically reviewed (content/_tools/symptom-tracker.yaml).
 * Numbers only describe what she logged. Nothing here interprets, diagnoses or scores.
 */

export interface DoctorReport {
  windowDays: number;
  startDate: string;
  endDate: string;
  entries: number;
  dailyEntries: number;
  weeklyEntries: number;
  /** Days covered by entries (daily = 1, weekly = 7), capped at the window. */
  daysCovered: number;
  feelingAverage: number | null;
  hotFlashes: { total: number; perDay: number; maxInOneDay: number | null } | null;
  sleep: { averageHours: number; nightsWithWaking: number; dailyEntries: number } | null;
  symptoms: SymptomStats[];
  bleeding: { entries: number; heaviest: FlowLevel | null; dates: string[] };
  treatments: Array<Pick<LocalTreatment, 'id' | 'name' | 'dosage' | 'frequency' | 'startDate'>>;
}

const FLOW_ORDER: FlowLevel[] = ['none', 'spotting', 'light', 'medium', 'heavy'];
export const MAX_REPORT_SYMPTOMS = 8;

export function buildDoctorReport(
  checkins: Array<LocalCheckin & { symptoms: LocalSymptomEntry[] }>,
  treatments: LocalTreatment[],
  windowDays: number,
  today: Date = new Date(),
): DoctorReport {
  const endDate = localDateString(today);
  const startDate = localDaysAgo(windowDays - 1, today);
  const inWindow = checkins.filter((c) => c.date >= startDate && c.date <= endDate);

  const weeklyEntries = inWindow.filter((c) => daysCovered(c) === 7).length;
  const covered = Math.min(windowDays, inWindow.reduce((n, c) => n + daysCovered(c), 0));
  const feelings = inWindow.map((c) => c.overallFeeling).filter((x): x is NonNullable<typeof x> => typeof x === 'number');

  const hf = InsightsEngine.calculateHotFlashStats(inWindow);
  const sleep = InsightsEngine.calculateSleepStats(inWindow);
  const symptoms = InsightsEngine.calculateSymptomStats(inWindow, inWindow.flatMap((c) => c.symptoms)).slice(0, MAX_REPORT_SYMPTOMS);

  const bleedingEntries = inWindow.filter((c) => c.flow && c.flow !== 'none').sort((a, b) => a.date.localeCompare(b.date));
  const heaviest = bleedingEntries.reduce<FlowLevel | null>(
    (h, c) => (h === null || FLOW_ORDER.indexOf(c.flow!) > FLOW_ORDER.indexOf(h) ? c.flow! : h),
    null,
  );

  return {
    windowDays,
    startDate,
    endDate,
    entries: inWindow.length,
    dailyEntries: inWindow.length - weeklyEntries,
    weeklyEntries,
    daysCovered: covered,
    feelingAverage: feelings.length ? Number((feelings.reduce((a, b) => a + b, 0) / feelings.length).toFixed(1)) : null,
    hotFlashes: inWindow.some((c) => typeof c.hotFlashCount === 'number')
      ? { total: hf.totalRecorded, perDay: hf.dailyAverage, maxInOneDay: hf.daysWithFlashes > 0 ? hf.maxInSingleDay : null }
      : null,
    sleep:
      sleep.totalNightsRecorded > 0
        ? {
            averageHours: sleep.averageHours,
            nightsWithWaking: sleep.nightsWokeAtNight,
            dailyEntries: inWindow.filter((c) => daysCovered(c) === 1).length,
          }
        : null,
    symptoms,
    bleeding: { entries: bleedingEntries.length, heaviest, dates: bleedingEntries.slice(0, 10).map((c) => c.date) },
    treatments: treatments
      .filter((t) => t.active)
      .map((t) => ({ id: t.id, name: t.name, dosage: t.dosage, frequency: t.frequency, startDate: t.startDate })),
  };
}
