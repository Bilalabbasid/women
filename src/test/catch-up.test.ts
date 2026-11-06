import { describe, it, expect } from 'vitest';
import { getMissedDays, MAX_CATCH_UP_DAYS } from '../lib/tracker/catch-up';

describe('getMissedDays', () => {
  it('returns nothing when she has never logged', () => {
    expect(getMissedDays(null, '2026-11-07')).toEqual([]);
  });

  it('returns nothing when she logged today', () => {
    expect(getMissedDays('2026-11-07', '2026-11-07')).toEqual([]);
  });

  it('returns nothing when she logged yesterday (no real gap)', () => {
    expect(getMissedDays('2026-11-06', '2026-11-07')).toEqual([]);
  });

  it('returns the one day in between for a 2-day gap', () => {
    expect(getMissedDays('2026-11-05', '2026-11-07')).toEqual(['2026-11-06']);
  });

  it('matches the stated example: silent for 4 days means 4 missed days, most recent first', () => {
    // Last logged 2026-11-02, today is 2026-11-07: 5 calendar days apart,
    // so the 4 days in between (03, 04, 05, 06) were missed.
    expect(getMissedDays('2026-11-02', '2026-11-07')).toEqual([
      '2026-11-06',
      '2026-11-05',
      '2026-11-04',
      '2026-11-03',
    ]);
  });

  it('caps a very long gap at maxDays, still anchored to today', () => {
    const result = getMissedDays('2026-01-01', '2026-11-07', 14);
    expect(result).toHaveLength(14);
    expect(result[0]).toBe('2026-11-06');
    expect(result[13]).toBe('2026-10-24');
  });

  it('defaults the cap to MAX_CATCH_UP_DAYS', () => {
    const result = getMissedDays('2026-01-01', '2026-11-07');
    expect(result).toHaveLength(MAX_CATCH_UP_DAYS);
  });

  it('handles a gap spanning a month boundary', () => {
    expect(getMissedDays('2026-10-30', '2026-11-02')).toEqual(['2026-11-01', '2026-10-31']);
  });
});
