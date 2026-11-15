import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ENGLAND_PRESCRIPTION_PRICES, calculatePpc, cleanCount, formatPounds, type PpcInput } from '@/lib/tools/hrt-ppc';
import { HrtPpcCalculator } from '@/components/tools/hrt-ppc-calculator';

afterEach(cleanup);

const england = (over: Partial<PpcInput> = {}): PpcInput => ({
  nation: 'england',
  exempt: false,
  hrtItems: 0,
  hrtPeriod: 'year',
  otherItemsPerYear: 0,
  ...over,
});

function englandResult(input: PpcInput) {
  const r = calculatePpc(input);
  if (r.kind !== 'england') throw new Error(`expected england result, got ${r.kind}`);
  return r;
}

describe('ENGLAND_PRESCRIPTION_PRICES', () => {
  it('holds the checked 2026/27 England prices with official sources', () => {
    expect(ENGLAND_PRESCRIPTION_PRICES).toMatchObject({
      checked: '2026-11-15',
      perItemPence: 990,
      hrtPpc12MonthPence: 1980,
      ppc3MonthPence: 3205,
      ppc12MonthPence: 11450,
    });
    for (const s of ENGLAND_PRESCRIPTION_PRICES.sources) expect(s.url).toMatch(/^https:\/\/www\.(nhsbsa\.nhs\.uk|gov\.uk)\//);
  });
});

describe('calculatePpc', () => {
  it('says prescriptions are free in Scotland, Wales and Northern Ireland', () => {
    for (const nation of ['scotland', 'wales', 'northern-ireland'] as const) {
      expect(calculatePpc(england({ nation, hrtItems: 12 }))).toEqual({ kind: 'free-nation', nation });
    }
  });

  it('returns exempt, or incomplete, before comparing', () => {
    expect(calculatePpc(england({ exempt: true, hrtItems: 12 }))).toEqual({ kind: 'exempt' });
    expect(calculatePpc(england())).toEqual({ kind: 'incomplete' });
    expect(calculatePpc({ ...england(), nation: '' })).toEqual({ kind: 'incomplete' });
  });

  it('ties at 2 HRT items: £19.80 either way', () => {
    const r = englandResult(england({ hrtItems: 2 }));
    expect(r.payPerItemPence).toBe(1980);
    expect(r.cheapest).toEqual(['pay-per-item', 'hrt-ppc']);
    expect(r.savingPence).toBe(0);
  });

  it('picks the HRT PPC from 3 HRT items (the GOV.UK rule)', () => {
    const r = englandResult(england({ hrtItems: 3 }));
    expect(r.cheapest).toEqual(['hrt-ppc']);
    expect(r.savingPence).toBe(990);
  });

  it('converts a monthly count to a year (2 a month = 24 items, saving £217.80)', () => {
    const r = englandResult(england({ hrtItems: 2, hrtPeriod: 'month' }));
    expect(r.hrtPerYear).toBe(24);
    expect(r.payPerItemPence).toBe(23760);
    expect(r.cheapestPence).toBe(1980);
    expect(formatPounds(r.savingPence)).toBe('£217.80');
  });

  it('matches GOV.UK: with 10+ non-HRT items a 12-month PPC beats HRT PPC plus per-item charges', () => {
    expect(englandResult(england({ hrtItems: 8, otherItemsPerYear: 9 })).cheapest).toEqual(['hrt-ppc']); // 19.80 + 89.10 = 108.90
    const ten = englandResult(england({ hrtItems: 8, otherItemsPerYear: 10 }));
    expect(ten.cheapest).toEqual(['ppc-12']); // 19.80 + 99.00 = 118.80 > 114.50
    expect(ten.cheapestPence).toBe(11450);
  });

  it('with no HRT items it compares per-item against the 12-month PPC (12+ items, per GOV.UK)', () => {
    expect(englandResult(england({ otherItemsPerYear: 11 })).cheapest).toEqual(['pay-per-item']);
    expect(englandResult(england({ otherItemsPerYear: 12 })).cheapest).toEqual(['ppc-12']);
    expect(englandResult(england({ otherItemsPerYear: 12 })).options.some((o) => o.id === 'hrt-ppc')).toBe(false);
  });

  it('never counts back-to-back 3-month PPCs as cheapest', () => {
    const r = englandResult(england({ hrtItems: 100, otherItemsPerYear: 100 }));
    const three = r.options.find((o) => o.id === 'ppc-3-x4');
    expect(three?.yearPence).toBe(12820);
    expect(r.cheapest).not.toContain('ppc-3-x4');
  });

  it('cleans bad counts', () => {
    expect(cleanCount(-3)).toBe(0);
    expect(cleanCount(Number.NaN)).toBe(0);
    expect(cleanCount(4.7)).toBe(4);
    expect(cleanCount(10_000)).toBe(600);
  });
});

describe('HrtPpcCalculator UI', () => {
  it('walks England answers to a cheapest option', () => {
    render(<HrtPpcCalculator />);
    fireEvent.click(screen.getByLabelText('England'));
    fireEvent.click(screen.getByLabelText('No, I pay for prescriptions'));
    fireEvent.change(screen.getByLabelText('HRT items'), { target: { value: '8' } });
    expect(screen.getByText(/is cheapest for 8 HRT and 0 other items a year/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Check your medicine on the list/ })).toHaveAttribute(
      'href',
      expect.stringContaining('medicines-covered-hrt-ppc'),
    );
  });

  it('tells Scotland readers no certificate is needed', () => {
    render(<HrtPpcCalculator />);
    fireEvent.click(screen.getByLabelText('Scotland'));
    expect(screen.getByText(/Prescriptions are free in Scotland/)).toBeInTheDocument();
  });
});
