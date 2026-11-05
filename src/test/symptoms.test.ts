import { describe, it, expect } from 'vitest';
import { STANDARD_SYMPTOMS, SYMPTOM_CATEGORIES } from '@/lib/config/symptoms';

describe('Symptom Dictionary', () => {
  it('contains standard symptoms across defined categories', () => {
    expect(STANDARD_SYMPTOMS.length).toBeGreaterThan(10);
    const categoryIds = SYMPTOM_CATEGORIES.map((c) => c.id);

    STANDARD_SYMPTOMS.forEach((symptom) => {
      expect(categoryIds).toContain(symptom.category);
      expect(symptom.name).toBeTruthy();
    });
  });

  it('includes key vasomotor and sleep symptoms for perimenopause', () => {
    const hotFlashes = STANDARD_SYMPTOMS.find((s) => s.id === 'hot_flashes');
    const sleep = STANDARD_SYMPTOMS.find((s) => s.id === 'waking_early');
    const brainFog = STANDARD_SYMPTOMS.find((s) => s.id === 'brain_fog');

    expect(hotFlashes).toBeDefined();
    expect(sleep).toBeDefined();
    expect(brainFog).toBeDefined();
  });
});
