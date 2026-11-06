// Deterministic Local Insights Engine
// Pure mathematical calculations performed on-device. Zero AI hallucinations.

import { LocalCheckin, LocalSymptomEntry } from '../db/schema';

export interface SymptomStats {
  symptomId: string;
  name: string;
  category: string;
  count: number;
  frequencyPercent: number; // 0-100% of check-in days
  averageSeverity: number; // 1.0 - 5.0
}

export interface SleepStats {
  averageHours: number;
  totalNightsRecorded: number;
  nightsWokeAtNight: number;
  wakingPercent: number;
}

export interface HotFlashStats {
  dailyAverage: number;
  totalRecorded: number;
  maxInSingleDay: number;
  daysWithFlashes: number;
}

export interface WindowComparison {
  metric: string;
  currentValue: number;
  priorValue: number;
  percentageChange: number; // e.g. -32% or +15%
  isLower: boolean;
}

/** Days an entry covers: 1 for a daily entry, 7 for a weekly entry. */
export const daysCovered = (c: Pick<LocalCheckin, 'coversDays'>) => (c.coversDays === 7 ? 7 : 1);
const isDaily = (c: Pick<LocalCheckin, 'coversDays'>) => daysCovered(c) === 1;

export const InsightsEngine = {
  calculateSymptomStats(checkins: LocalCheckin[], symptoms: LocalSymptomEntry[]): SymptomStats[] {
    const totalDays = checkins.length;
    if (totalDays === 0) return [];

    const map = new Map<string, { name: string; category: string; severities: number[] }>();

    for (const s of symptoms) {
      if (!map.has(s.symptomId)) {
        map.set(s.symptomId, {
          name: s.name,
          category: s.category,
          severities: [],
        });
      }
      map.get(s.symptomId)!.severities.push(s.severity);
    }

    const results: SymptomStats[] = [];

    map.forEach((data, symptomId) => {
      const count = data.severities.length;
      const sum = data.severities.reduce((a, b) => a + b, 0);
      const avg = Number((sum / count).toFixed(1));
      const freq = Math.min(100, Math.round((count / totalDays) * 100));

      results.push({
        symptomId,
        name: data.name,
        category: data.category,
        count,
        frequencyPercent: freq,
        averageSeverity: avg,
      });
    });

    // Sort by most frequent first
    return results.sort((a, b) => b.count - a.count || b.averageSeverity - a.averageSeverity);
  },

  calculateSleepStats(checkins: LocalCheckin[]): SleepStats {
    const recordedSleep = checkins.filter((c) => typeof c.sleepHours === 'number' && c.sleepHours > 0);
    if (recordedSleep.length === 0) {
      return { averageHours: 0, totalNightsRecorded: 0, nightsWokeAtNight: 0, wakingPercent: 0 };
    }

    // Weekly entries record average hours per night, so weight each entry by the days it covers.
    const weightedHours = recordedSleep.reduce((acc, c) => acc + (c.sleepHours || 0) * daysCovered(c), 0);
    const weight = recordedSleep.reduce((acc, c) => acc + daysCovered(c), 0);
    const avg = Number((weightedHours / weight).toFixed(1));
    // "Woke at night" is a per-night answer, so only daily entries count towards it.
    const daily = checkins.filter(isDaily);
    const wokeNights = daily.filter((c) => c.wokeAtNight === true).length;
    const wakingPercent = daily.length ? Math.round((wokeNights / daily.length) * 100) : 0;

    return {
      averageHours: avg,
      totalNightsRecorded: recordedSleep.length,
      nightsWokeAtNight: wokeNights,
      wakingPercent,
    };
  },

  calculateHotFlashStats(checkins: LocalCheckin[]): HotFlashStats {
    let total = 0;
    let daysWith = 0;
    let maxFlash = 0;

    let days = 0;
    for (const c of checkins) {
      const count = c.hotFlashCount || 0;
      days += daysCovered(c);
      total += count;
      // A weekly total is not a single day's count, so only daily entries feed these two.
      if (count > 0 && isDaily(c)) {
        daysWith += 1;
        if (count > maxFlash) maxFlash = count;
      }
    }

    const dailyAvg = days > 0 ? Number((total / days).toFixed(1)) : 0;

    return {
      dailyAverage: dailyAvg,
      totalRecorded: total,
      maxInSingleDay: maxFlash,
      daysWithFlashes: daysWith,
    };
  },

  compareWindows(currentCheckins: LocalCheckin[], priorCheckins: LocalCheckin[]): WindowComparison[] {
    const currentHF = this.calculateHotFlashStats(currentCheckins);
    const priorHF = this.calculateHotFlashStats(priorCheckins);

    const comparisons: WindowComparison[] = [];

    if (priorHF.dailyAverage > 0) {
      const hfChange = Math.round(
        ((currentHF.dailyAverage - priorHF.dailyAverage) / priorHF.dailyAverage) * 100
      );
      comparisons.push({
        metric: 'Hot Flash Daily Frequency',
        currentValue: currentHF.dailyAverage,
        priorValue: priorHF.dailyAverage,
        percentageChange: hfChange,
        isLower: hfChange < 0,
      });
    }

    const currentSleep = this.calculateSleepStats(currentCheckins);
    const priorSleep = this.calculateSleepStats(priorCheckins);

    if (priorSleep.averageHours > 0) {
      const sleepChange = Math.round(
        ((currentSleep.averageHours - priorSleep.averageHours) / priorSleep.averageHours) * 100
      );
      comparisons.push({
        metric: 'Average Sleep Duration',
        currentValue: currentSleep.averageHours,
        priorValue: priorSleep.averageHours,
        percentageChange: sleepChange,
        isLower: sleepChange < 0,
      });
    }

    return comparisons;
  },
};
