import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import {
  MENOPAUSE_AGE_FACTS,
  ageBand,
  calculateMenopauseAgeContext,
  resolveAge,
  twelveMonthMark,
} from '@/lib/tools/menopause-age';
import { MenopauseAgeCalculator } from '@/components/tools/menopause-age-calculator';

const NOW = new Date(Date.UTC(2026, 10, 15)); // 2026-11-15

afterEach(cleanup);

describe('resolveAge', () => {
  it('prefers the typed age and floors it', () => {
    expect(resolveAge({ age: 47.8, birthYear: 1960 }, NOW)).toEqual({ age: 47, fromBirthYear: false });
  });
  it('works out age from a birth year and flags it as approximate', () => {
    expect(resolveAge({ birthYear: 1979 }, NOW)).toEqual({ age: 47, fromBirthYear: true });
  });
  it('rejects ages outside 18 to 100', () => {
    expect(resolveAge({ age: 12 }, NOW).age).toBeNull();
    expect(resolveAge({ age: 140 }, NOW).age).toBeNull();
    expect(resolveAge({}, NOW).age).toBeNull();
  });
});

describe('ageBand', () => {
  it('uses the sourced boundaries: under 40, 40-44, 45-55, over 55', () => {
    expect(ageBand(39)).toBe('under-40');
    expect(ageBand(40)).toBe('early-40-44');
    expect(ageBand(44)).toBe('early-40-44');
    expect(ageBand(45)).toBe('typical-45-55');
    expect(ageBand(55)).toBe('typical-45-55');
    expect(ageBand(56)).toBe('over-55');
  });
  it('keeps the typical range at 45 to 55', () => {
    expect(MENOPAUSE_AGE_FACTS.typicalRange).toMatchObject({ from: 45, to: 55 });
  });
});

describe('twelveMonthMark', () => {
  it('dates the mark one calendar year after the last period', () => {
    const m = twelveMonthMark('2026-02-10', NOW);
    expect(m).toMatchObject({ valid: true, iso: '2027-02-10', reached: false, monthsSince: 9 });
    expect(m.daysRemaining).toBe(87);
    expect(m.formatted).toBe('February 10, 2027');
  });
  it('reports when 12 months have passed', () => {
    expect(twelveMonthMark('2025-11-15', NOW)).toMatchObject({ reached: true, daysRemaining: 0, monthsSince: 12 });
    expect(twelveMonthMark('2025-11-16', NOW)).toMatchObject({ reached: false, daysRemaining: 1, monthsSince: 11 });
  });
  it('rejects future, malformed and impossible dates', () => {
    expect(twelveMonthMark('2026-12-01', NOW).valid).toBe(false);
    expect(twelveMonthMark('10/02/2026', NOW).valid).toBe(false);
    expect(twelveMonthMark('2026-02-30', NOW).valid).toBe(false);
  });
});

describe('calculateMenopauseAgeContext', () => {
  it('is not ready without a usable age', () => {
    expect(calculateMenopauseAgeContext({ periods: 'still' }, NOW).ready).toBe(false);
  });

  it('gives years to the range and never a predicted age', () => {
    const r = calculateMenopauseAgeContext({ age: 38, periods: 'still' }, NOW);
    expect(r).toMatchObject({ ready: true, band: 'under-40', yearsToRangeStart: 7, yearsPastRange: 0 });
    expect(JSON.stringify(r)).not.toMatch(/predicted|you will reach menopause at/i);
  });

  it('flags periods stopping before 40 and at 40-44 as needing a check', () => {
    const under40 = calculateMenopauseAgeContext({ age: 36, periods: 'stopped', lastPeriodIso: '2026-05-01' }, NOW);
    expect(under40.notes.find((n) => n.id === 'under-40-stopped')?.kind).toBe('check');
    const early = calculateMenopauseAgeContext({ age: 42, periods: 'stopped' }, NOW);
    expect(early.notes.find((n) => n.id === 'early-40-44-stopped')?.kind).toBe('check');
    const stillHaving = calculateMenopauseAgeContext({ age: 42, periods: 'still' }, NOW);
    expect(stillHaving.notes.some((n) => n.kind === 'check')).toBe(false);
  });

  it('adds the 12-month date and the bleeding reminder once 12 months have passed', () => {
    const r = calculateMenopauseAgeContext({ age: 52, periods: 'stopped', lastPeriodIso: '2025-06-01' }, NOW);
    expect(r.band).toBe('typical-45-55');
    expect(r.twelveMonth?.reached).toBe(true);
    expect(r.notes.map((n) => n.id)).toContain('twelve-months-reached');
  });

  it('explains why contraception, an IUD or hysterectomy hide the 12-month sign', () => {
    for (const reason of ['contraception', 'hormonal-iud', 'hysterectomy', 'ablation'] as const) {
      const r = calculateMenopauseAgeContext({ age: 48, periods: 'cant-tell', cantTellReason: reason }, NOW);
      expect(r.twelveMonth).toBeNull();
      expect(r.notes.some((n) => n.id.startsWith('cant-tell-'))).toBe(true);
    }
  });

  it('states factors as the sources do, without adjusting any number', () => {
    const base = calculateMenopauseAgeContext({ age: 46, periods: 'still' }, NOW);
    const withFactors = calculateMenopauseAgeContext(
      { age: 46, periods: 'still', mothersAge: 42, smoking: 'current', cancerTreatment: true, ovariesRemoved: true },
      NOW,
    );
    expect(withFactors.yearsToRangeStart).toBe(base.yearsToRangeStart);
    expect(withFactors.notes.map((n) => n.id)).toEqual(['family-early', 'smoking', 'cancer-treatment', 'ovaries-removed']);
    for (const n of withFactors.notes) expect(n.sources.length).toBeGreaterThan(0);
    const laterMother = calculateMenopauseAgeContext({ age: 46, periods: 'still', mothersAge: 51 }, NOW);
    expect(laterMother.notes.map((n) => n.id)).toEqual(['family-typical']);
  });

  it('notes over-55 without implying anything is wrong', () => {
    const r = calculateMenopauseAgeContext({ age: 58, periods: 'still' }, NOW);
    expect(r).toMatchObject({ band: 'over-55', yearsPastRange: 3 });
    expect(r.notes[0]).toMatchObject({ id: 'over-55', kind: 'info' });
  });
});

describe('MenopauseAgeCalculator UI', () => {
  it('shows the range context after an age is entered and clears on demand', () => {
    render(<MenopauseAgeCalculator />);
    expect(screen.getByText(/Enter your age to see/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Age in years'), { target: { value: '41' } });
    expect(screen.getByText(/from the start of the 45 to 55 range/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /stage guide/i })).toHaveAttribute('href', expect.stringMatching(/^\/tools\/stage-guide\/?$/));
    fireEvent.click(screen.getByRole('button', { name: 'Clear my answers' }));
    expect(screen.getByText(/Enter your age to see/)).toBeInTheDocument();
  });

  it('saves nothing to browser storage', () => {
    window.localStorage.clear();
    render(<MenopauseAgeCalculator />);
    fireEvent.change(screen.getByLabelText('Age in years'), { target: { value: '50' } });
    expect(window.localStorage.length).toBe(0);
  });
});
