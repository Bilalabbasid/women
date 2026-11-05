import { describe, it, expect } from 'vitest';
import { PRICING } from '@/lib/config/pricing';

describe('Pricing Configuration', () => {
  it('defines valid monthly and annual pricing structure', () => {
    expect(PRICING.monthly.amount).toBeGreaterThan(0);
    expect(PRICING.annual.amount).toBeGreaterThan(0);
    expect(PRICING.trial.days).toBe(7);
  });

  it('ensures annual plan provides a discount over 12 months', () => {
    const twelveMonthsMonthly = PRICING.monthly.amount * 12;
    expect(PRICING.annual.amount).toBeLessThan(twelveMonthsMonthly);
  });

  it('contains transparent feature lists for free and premium tiers', () => {
    expect(PRICING.features.free.length).toBeGreaterThan(3);
    expect(PRICING.features.premium.length).toBeGreaterThan(3);
  });
});
