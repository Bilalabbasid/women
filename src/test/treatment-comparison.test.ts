import { describe, it, expect } from 'vitest';
import { TreatmentComparisonEngine } from '../lib/insights/treatment-comparison';
import { LocalCheckin, LocalSymptomEntry } from '../lib/db/schema';

describe('Phase 3: Before & After Treatment Comparison Engine', () => {
  // Generate sample check-in data before and after 2026-09-15
  const eventDate = '2026-09-15';
  const sampleCheckins: Array<LocalCheckin & { symptoms: LocalSymptomEntry[] }> = [];

  // 14 days before: high hot flashes (4-6), lower sleep (5.5-6h), feeling 2
  for (let i = 14; i >= 1; i--) {
    const d = new Date(new Date(eventDate).getTime() - i * 86400000).toISOString().split('T')[0];
    sampleCheckins.push({
      id: `chk_before_${i}`,
      date: d,
      timestamp: Date.now() - i * 86400000,
      overallFeeling: 2,
      sleepHours: 5.5,
      wokeAtNight: true,
      hotFlashCount: 5,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      symptoms: [
        {
          id: `sym_hf_${i}`,
          checkinId: `chk_before_${i}`,
          date: d,
          symptomId: 'hot_flashes',
          name: 'Hot Flashes',
          category: 'vasomotor',
          severity: 4,
          timestamp: Date.now(),
        },
      ],
    });
  }

  // 14 days after: fewer hot flashes (1-2), more sleep (7.5h), feeling 4
  for (let i = 0; i < 14; i++) {
    const d = new Date(new Date(eventDate).getTime() + i * 86400000).toISOString().split('T')[0];
    sampleCheckins.push({
      id: `chk_after_${i}`,
      date: d,
      timestamp: Date.now() + i * 86400000,
      overallFeeling: 4,
      sleepHours: 7.5,
      wokeAtNight: false,
      hotFlashCount: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      symptoms: [
        {
          id: `sym_hf_after_${i}`,
          checkinId: `chk_after_${i}`,
          date: d,
          symptomId: 'hot_flashes',
          name: 'Hot Flashes',
          category: 'vasomotor',
          severity: 2,
          timestamp: Date.now(),
        },
      ],
    });
  }

  it('calculates deterministic before/after statistics across 14-day window', () => {
    const result = TreatmentComparisonEngine.comparePeriods(
      'Estradiol Patch',
      eventDate,
      14,
      sampleCheckins
    );

    expect(result.treatmentName).toBe('Estradiol Patch');
    expect(result.windowDays).toBe(14);
    expect(result.beforeRange.daysLogged).toBe(14);
    expect(result.afterRange.daysLogged).toBe(14);

    // Hot flashes
    expect(result.hotFlashes.beforeDailyAvg).toBe(5);
    expect(result.hotFlashes.afterDailyAvg).toBe(1);
    expect(result.hotFlashes.difference).toBe(-4);
    expect(result.hotFlashes.reportedTrend).toBe('fewer');

    // Sleep
    expect(result.sleep.beforeAvgHours).toBe(5.5);
    expect(result.sleep.afterAvgHours).toBe(7.5);
    expect(result.sleep.reportedTrend).toBe('more_sleep');

    // Feeling
    expect(result.feeling.beforeAvg).toBe(2);
    expect(result.feeling.afterAvg).toBe(4);
    expect(result.feeling.reportedTrend).toBe('higher');
  });

  it('strictly adheres to patient-reported co-occurrence phrasing and contains NO causation claims', () => {
    const result = TreatmentComparisonEngine.comparePeriods(
      'Estradiol Patch',
      eventDate,
      14,
      sampleCheckins
    );

    const fullReportText = [
      result.hotFlashes.statement,
      result.sleep.statement,
      result.feeling.statement,
      result.safetyNotice,
      ...result.topSymptomSeverities.map((s) => s.statement),
    ]
      .join(' ')
      .toLowerCase();

    // STRICT MEDICAL SAFETY: Forbidden words claiming causation or prescription
    const forbiddenTerms = [
      'caused',
      'cured',
      'cures',
      'improved because of',
      'effective at treating',
      'proves that',
      'should increase',
      'should decrease',
      'should stop',
      'should start',
      'recommend you change',
    ];

    for (const term of forbiddenTerms) {
      expect(fullReportText).not.toContain(term);
    }

    // Required medical disclaimer and patient-reported framing
    expect(result.safetyNotice).toContain('Co-occurrence does not establish');
    expect(result.safetyNotice).toContain('healthcare professional');
    expect(result.hotFlashes.statement).toContain('You reported');
    expect(result.sleep.statement).toContain('You logged');
  });
});
