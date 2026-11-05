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

    const totalHours = recordedSleep.reduce((acc, c) => acc + (c.sleepHours || 0), 0);
    const avg = Number((totalHours / recordedSleep.length).toFixed(1));
    const wokeNights = checkins.filter((c) => c.wokeAtNight === true).length;
    const wakingPercent = Math.round((wokeNights / checkins.length) * 100);

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

    for (const c of checkins) {
      const count = c.hotFlashCount || 0;
      if (count > 0) {
        total += count;
        daysWith += 1;
        if (count > maxFlash) maxFlash = count;
      }
    }

    const dailyAvg = checkins.length > 0 ? Number((total / checkins.length).toFixed(1)) : 0;

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
