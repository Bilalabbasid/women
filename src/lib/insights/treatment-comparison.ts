// Deterministic Before & After Treatment Comparison Engine
// Pure mathematical calculations on self-reported check-in data.
// STRICT MEDICAL SAFETY: No claim of causation. Phrased purely as patient-reported co-occurrence.

import { LocalCheckin, LocalSymptomEntry } from '../db/schema';

export interface TreatmentComparisonResult {
  treatmentName: string;
  eventDate: string; // YYYY-MM-DD
  windowDays: number;
  beforeRange: { start: string; end: string; daysLogged: number };
  afterRange: { start: string; end: string; daysLogged: number };

  hotFlashes: {
    beforeDailyAvg: number;
    afterDailyAvg: number;
    difference: number;
    percentageChange: number;
    reportedTrend: 'fewer' | 'more' | 'similar' | 'insufficient_data';
    statement: string;
  };

  sleep: {
    beforeAvgHours: number;
    afterAvgHours: number;
    beforeWakingRate: number; // percentage
    afterWakingRate: number; // percentage
    differenceHours: number;
    reportedTrend: 'more_sleep' | 'less_sleep' | 'similar' | 'insufficient_data';
    statement: string;
  };

  feeling: {
    beforeAvg: number; // 1.0 - 5.0
    afterAvg: number;
    reportedTrend: 'higher' | 'lower' | 'similar' | 'insufficient_data';
    statement: string;
  };

  topSymptomSeverities: Array<{
    symptomName: string;
    beforeAvgSeverity: number;
    afterAvgSeverity: number;
    difference: number;
    statement: string;
  }>;

  safetyNotice: string;
}

export const TreatmentComparisonEngine = {
  comparePeriods(
    treatmentName: string,
    eventDate: string,
    windowDays: 7 | 14 | 30,
    checkins: Array<LocalCheckin & { symptoms: LocalSymptomEntry[] }>
  ): TreatmentComparisonResult {
    // 1. Calculate Date Ranges
    // Before window: [eventDate - windowDays, eventDate - 1 day]
    // After window: [eventDate, eventDate + windowDays - 1 day]
    const eventTime = new Date(eventDate).getTime();
    const dayMs = 86400000;

    const beforeStartTime = eventTime - windowDays * dayMs;
    const beforeEndTime = eventTime - dayMs;
    const beforeStart = new Date(beforeStartTime).toISOString().split('T')[0];
    const beforeEnd = new Date(beforeEndTime).toISOString().split('T')[0];

    const afterStartTime = eventTime;
    const afterEndTime = eventTime + (windowDays - 1) * dayMs;
    const afterStart = new Date(afterStartTime).toISOString().split('T')[0];
    const afterEnd = new Date(afterEndTime).toISOString().split('T')[0];

    const beforeCheckins = checkins.filter((c) => c.date >= beforeStart && c.date <= beforeEnd);
    const afterCheckins = checkins.filter((c) => c.date >= afterStart && c.date <= afterEnd);

    // 2. Hot Flash Calculation
    const beforeHFSum = beforeCheckins.reduce((acc, c) => acc + (c.hotFlashCount || 0), 0);
    const afterHFSum = afterCheckins.reduce((acc, c) => acc + (c.hotFlashCount || 0), 0);

    const beforeHFAvg = beforeCheckins.length > 0 ? Number((beforeHFSum / beforeCheckins.length).toFixed(1)) : 0;
    const afterHFAvg = afterCheckins.length > 0 ? Number((afterHFSum / afterCheckins.length).toFixed(1)) : 0;
    const hfDiff = Number((afterHFAvg - beforeHFAvg).toFixed(1));

    let hfTrend: 'fewer' | 'more' | 'similar' | 'insufficient_data' = 'similar';
    let hfStatement = 'No hot flash logs recorded during these timeframes.';

    if (beforeCheckins.length === 0 || afterCheckins.length === 0) {
      hfTrend = 'insufficient_data';
      hfStatement = `Need entries from both before and after ${eventDate} to calculate a comparison.`;
    } else if (hfDiff <= -0.5) {
      hfTrend = 'fewer';
      hfStatement = `You reported fewer hot flashes during the ${windowDays} days following this recorded treatment change (daily average: ${afterHFAvg}/day vs ${beforeHFAvg}/day before).`;
    } else if (hfDiff >= 0.5) {
      hfTrend = 'more';
      hfStatement = `You reported more frequent hot flashes during the ${windowDays} days following this recorded treatment change (daily average: ${afterHFAvg}/day vs ${beforeHFAvg}/day before).`;
    } else {
      hfTrend = 'similar';
      hfStatement = `You reported similar hot flash frequencies before and after this recorded date (daily average: ${afterHFAvg}/day vs ${beforeHFAvg}/day).`;
    }

    const hfPctChange =
      beforeHFAvg > 0 ? Math.round(((afterHFAvg - beforeHFAvg) / beforeHFAvg) * 100) : 0;

    // 3. Sleep Calculation
    const beforeSleepRecorded = beforeCheckins.filter((c) => (c.sleepHours || 0) > 0);
    const afterSleepRecorded = afterCheckins.filter((c) => (c.sleepHours || 0) > 0);

    const beforeSleepAvg =
      beforeSleepRecorded.length > 0
        ? Number(
            (
              beforeSleepRecorded.reduce((acc, c) => acc + (c.sleepHours || 0), 0) /
              beforeSleepRecorded.length
            ).toFixed(1)
          )
        : 0;

    const afterSleepAvg =
      afterSleepRecorded.length > 0
        ? Number(
            (
              afterSleepRecorded.reduce((acc, c) => acc + (c.sleepHours || 0), 0) /
              afterSleepRecorded.length
            ).toFixed(1)
          )
        : 0;

    const beforeWokeRate =
      beforeCheckins.length > 0
        ? Math.round((beforeCheckins.filter((c) => c.wokeAtNight).length / beforeCheckins.length) * 100)
        : 0;
    const afterWokeRate =
      afterCheckins.length > 0
        ? Math.round((afterCheckins.filter((c) => c.wokeAtNight).length / afterCheckins.length) * 100)
        : 0;

    const sleepDiffHours = Number((afterSleepAvg - beforeSleepAvg).toFixed(1));
    let sleepTrend: 'more_sleep' | 'less_sleep' | 'similar' | 'insufficient_data' = 'similar';
    let sleepStatement = 'Insufficient sleep records to compare.';

    if (beforeSleepRecorded.length === 0 || afterSleepRecorded.length === 0) {
      sleepTrend = 'insufficient_data';
      sleepStatement = 'Sleep hours were not recorded consistently across both time windows.';
    } else if (sleepDiffHours >= 0.5) {
      sleepTrend = 'more_sleep';
      sleepStatement = `You logged an average of ${afterSleepAvg} hours of sleep per night in the ${windowDays} days following this date, compared to ${beforeSleepAvg} hours in the prior period.`;
    } else if (sleepDiffHours <= -0.5) {
      sleepTrend = 'less_sleep';
      sleepStatement = `You logged an average of ${afterSleepAvg} hours of sleep per night in the ${windowDays} days following this date, compared to ${beforeSleepAvg} hours in the prior period.`;
    } else {
      sleepTrend = 'similar';
      sleepStatement = `Average sleep duration remained similar (${afterSleepAvg}h after vs ${beforeSleepAvg}h before).`;
    }

    // 4. Overall Feeling Calculation
    const beforeFeelingList = beforeCheckins.filter((c) => c.overallFeeling).map((c) => c.overallFeeling!);
    const afterFeelingList = afterCheckins.filter((c) => c.overallFeeling).map((c) => c.overallFeeling!);

    const beforeFeelingAvg =
      beforeFeelingList.length > 0
        ? Number((beforeFeelingList.reduce((a, b) => a + b, 0) / beforeFeelingList.length).toFixed(1))
        : 0;

    const afterFeelingAvg =
      afterFeelingList.length > 0
        ? Number((afterFeelingList.reduce((a, b) => a + b, 0) / afterFeelingList.length).toFixed(1))
        : 0;

    const feelingDiff = Number((afterFeelingAvg - beforeFeelingAvg).toFixed(1));
    let feelingTrend: 'higher' | 'lower' | 'similar' | 'insufficient_data' = 'similar';
    let feelingStatement = 'Feeling ratings were not recorded across both periods.';

    if (beforeFeelingList.length === 0 || afterFeelingList.length === 0) {
      feelingTrend = 'insufficient_data';
    } else if (feelingDiff >= 0.4) {
      feelingTrend = 'higher';
      feelingStatement = `Your average daily feeling score was ${afterFeelingAvg}/5 in the ${windowDays} days after this date, compared to ${beforeFeelingAvg}/5 prior.`;
    } else if (feelingDiff <= -0.4) {
      feelingTrend = 'lower';
      feelingStatement = `Your average daily feeling score was ${afterFeelingAvg}/5 in the ${windowDays} days after this date, compared to ${beforeFeelingAvg}/5 prior.`;
    } else {
      feelingTrend = 'similar';
      feelingStatement = `Average feeling rating was steady (${afterFeelingAvg}/5 after vs ${beforeFeelingAvg}/5 before).`;
    }

    // 5. Symptom Severities Before vs After
    const beforeSymptoms = beforeCheckins.flatMap((c) => c.symptoms);
    const afterSymptoms = afterCheckins.flatMap((c) => c.symptoms);

    const symptomNames = Array.from(
      new Set([...beforeSymptoms.map((s) => s.name), ...afterSymptoms.map((s) => s.name)])
    );

    const topSymptomSeverities = symptomNames
      .map((name) => {
        const bList = beforeSymptoms.filter((s) => s.name === name);
        const aList = afterSymptoms.filter((s) => s.name === name);

        const bAvg =
          bList.length > 0
            ? Number((bList.reduce((acc, s) => acc + s.severity, 0) / bList.length).toFixed(1))
            : 0;
        const aAvg =
          aList.length > 0
            ? Number((aList.reduce((acc, s) => acc + s.severity, 0) / aList.length).toFixed(1))
            : 0;

        const diff = Number((aAvg - bAvg).toFixed(1));
        let stmt = `${name}: recorded at avg severity ${aAvg}/5 after vs ${bAvg}/5 before.`;
        if (bList.length > 0 && aList.length === 0) {
          stmt = `${name}: not logged in the ${windowDays} days after this date (was avg ${bAvg}/5 prior).`;
        } else if (bList.length === 0 && aList.length > 0) {
          stmt = `${name}: newly reported after this date at avg severity ${aAvg}/5.`;
        }

        return {
          symptomName: name,
          beforeAvgSeverity: bAvg,
          afterAvgSeverity: aAvg,
          difference: diff,
          statement: stmt,
        };
      })
      .filter((s) => s.beforeAvgSeverity > 0 || s.afterAvgSeverity > 0)
      .slice(0, 5);

    // 6. Mandatory Non-Causation Safety Guardrail
    const safetyNotice =
      'Observed pattern in your self-reported check-ins. Co-occurrence does not establish a causal relationship between this treatment and the observed differences. Many factors (including sleep, stress, temperature, and natural hormonal fluctuations) affect symptom trajectories over time. Discuss this summary with your healthcare professional before adjusting any regimen.';

    return {
      treatmentName,
      eventDate,
      windowDays,
      beforeRange: {
        start: beforeStart,
        end: beforeEnd,
        daysLogged: beforeCheckins.length,
      },
      afterRange: {
        start: afterStart,
        end: afterEnd,
        daysLogged: afterCheckins.length,
      },
      hotFlashes: {
        beforeDailyAvg: beforeHFAvg,
        afterDailyAvg: afterHFAvg,
        difference: hfDiff,
        percentageChange: hfPctChange,
        reportedTrend: hfTrend,
        statement: hfStatement,
      },
      sleep: {
        beforeAvgHours: beforeSleepAvg,
        afterAvgHours: afterSleepAvg,
        beforeWakingRate: beforeWokeRate,
        afterWakingRate: afterWokeRate,
        differenceHours: sleepDiffHours,
        reportedTrend: sleepTrend,
        statement: sleepStatement,
      },
      feeling: {
        beforeAvg: beforeFeelingAvg,
        afterAvg: afterFeelingAvg,
        reportedTrend: feelingTrend,
        statement: feelingStatement,
      },
      topSymptomSeverities,
      safetyNotice,
    };
  },
};
