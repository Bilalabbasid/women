import { describe, it, expect } from 'vitest';
import { InsightsEngine } from '@/lib/insights/calculations';
import { LocalCheckin, LocalSymptomEntry } from '@/lib/db/schema';

describe('InsightsEngine Calculations', () => {
  it('correctly calculates hot flash stats without division by zero', () => {
    const emptyStats = InsightsEngine.calculateHotFlashStats([]);
    expect(emptyStats.dailyAverage).toBe(0);
    expect(emptyStats.totalRecorded).toBe(0);
    expect(emptyStats.daysWithFlashes).toBe(0);

    const checkins: LocalCheckin[] = [
      {
        id: '1',
        date: '2026-10-01',
        timestamp: 1000,
        overallFeeling: 3,
        hotFlashCount: 4,
        createdAt: 1000,
        updatedAt: 1000,
      },
      {
        id: '2',
        date: '2026-10-02',
        timestamp: 2000,
        overallFeeling: 4,
        hotFlashCount: 2,
        createdAt: 2000,
        updatedAt: 2000,
      },
      {
        id: '3',
        date: '2026-10-03',
        timestamp: 3000,
        overallFeeling: 5,
        hotFlashCount: 0,
        createdAt: 3000,
        updatedAt: 3000,
      },
    ];

    const stats = InsightsEngine.calculateHotFlashStats(checkins);
    expect(stats.totalRecorded).toBe(6);
    expect(stats.dailyAverage).toBe(2);
    expect(stats.daysWithFlashes).toBe(2);
    expect(stats.maxInSingleDay).toBe(4);
  });

  it('correctly calculates sleep statistics and waking percentages', () => {
    const checkins: LocalCheckin[] = [
      {
        id: '1',
        date: '2026-10-01',
        timestamp: 1000,
        overallFeeling: 3,
        sleepHours: 6.0,
        wokeAtNight: true,
        createdAt: 1000,
        updatedAt: 1000,
      },
      {
        id: '2',
        date: '2026-10-02',
        timestamp: 2000,
        overallFeeling: 4,
        sleepHours: 8.0,
        wokeAtNight: false,
        createdAt: 2000,
        updatedAt: 2000,
      },
    ];

    const sleepStats = InsightsEngine.calculateSleepStats(checkins);
    expect(sleepStats.averageHours).toBe(7.0);
    expect(sleepStats.nightsWokeAtNight).toBe(1);
    expect(sleepStats.wakingPercent).toBe(50);
  });

  it('correctly aggregates symptom frequencies and averages', () => {
    const checkins: LocalCheckin[] = [
      { id: '1', date: '2026-10-01', timestamp: 1000, overallFeeling: 3, createdAt: 1000, updatedAt: 1000 },
      { id: '2', date: '2026-10-02', timestamp: 2000, overallFeeling: 4, createdAt: 2000, updatedAt: 2000 },
    ];

    const symptoms: LocalSymptomEntry[] = [
      {
        id: 's1',
        checkinId: '1',
        date: '2026-10-01',
        symptomId: 'hot_flashes',
        name: 'Hot Flashes',
        category: 'vasomotor',
        severity: 4,
        timestamp: 1000,
      },
      {
        id: 's2',
        checkinId: '2',
        date: '2026-10-02',
        symptomId: 'hot_flashes',
        name: 'Hot Flashes',
        category: 'vasomotor',
        severity: 2,
        timestamp: 2000,
      },
      {
        id: 's3',
        checkinId: '1',
        date: '2026-10-01',
        symptomId: 'brain_fog',
        name: 'Brain Fog',
        category: 'cognitive',
        severity: 3,
        timestamp: 1000,
      },
    ];

    const result = InsightsEngine.calculateSymptomStats(checkins, symptoms);
    expect(result.length).toBe(2);

    const hf = result.find((r) => r.symptomId === 'hot_flashes');
    expect(hf).toBeDefined();
    expect(hf!.count).toBe(2);
    expect(hf!.frequencyPercent).toBe(100);
    expect(hf!.averageSeverity).toBe(3);

    const bf = result.find((r) => r.symptomId === 'brain_fog');
    expect(bf).toBeDefined();
    expect(bf!.count).toBe(1);
    expect(bf!.frequencyPercent).toBe(50);
    expect(bf!.averageSeverity).toBe(3);
  });
});
