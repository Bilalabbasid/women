import { describe, it, expect } from 'vitest';
import {
  evaluateUrgentTriggers,
  suppressesCommercial,
  URGENT_TRIGGERS,
  CRISIS_RESOURCES,
} from '@/lib/safety/urgent-triggers';

const ids = (input: Parameters<typeof evaluateUrgentTriggers>[0]) =>
  evaluateUrgentTriggers(input).map((t) => t.id);

describe('urgent triggers', () => {
  it('returns nothing for an ordinary check-in', () => {
    expect(ids({ flow: 'none', symptomIds: ['hot_flashes', 'brain_fog'], notes: 'tired today' })).toEqual([]);
  });

  it('shows crisis resources when notes mention self-harm, case-insensitively', () => {
    expect(ids({ symptomIds: [], notes: 'Some days I want to DIE' })).toContain('self_harm_thoughts');
    expect(ids({ symptomIds: [], notes: 'thinking about self-harm' })).toContain('self_harm_thoughts');
  });

  it('shows crisis resources when low mood is logged', () => {
    expect(ids({ symptomIds: ['low_mood'] })).toContain('self_harm_thoughts');
  });

  it('puts crisis guidance first', () => {
    const result = ids({ flow: 'heavy', symptomIds: ['palpitations', 'low_mood'] });
    expect(result[0]).toBe('self_harm_thoughts');
    expect(result[1]).toBe('palpitations_red_flags');
  });

  it('flags any bleeding for the after-menopause check, and heavy flow for heavy bleeding', () => {
    expect(ids({ flow: 'spotting', symptomIds: [] })).toContain('bleeding_after_menopause');
    expect(ids({ flow: 'heavy', symptomIds: [] })).toEqual(
      expect.arrayContaining(['bleeding_after_menopause', 'heavy_or_unusual_bleeding']),
    );
  });

  it('suppresses commercial content whenever any trigger applies', () => {
    expect(suppressesCommercial(evaluateUrgentTriggers({ symptomIds: ['palpitations'] }))).toBe(true);
    expect(suppressesCommercial([])).toBe(false);
  });

  it('includes 988 for the US and Samaritans for the UK', () => {
    expect(CRISIS_RESOURCES['en-US'].resources.map((r) => r.how).join(' ')).toMatch(/988/);
    expect(CRISIS_RESOURCES['en-GB'].resources.map((r) => r.how).join(' ')).toMatch(/116 123/);
  });

  it('never uses diagnostic or prescribing language', () => {
    for (const t of URGENT_TRIGGERS) {
      for (const msg of Object.values(t.message)) {
        expect(msg).not.toMatch(/\byou have\b|\byou should take\b|\bmg\b|\bdose\b/i);
      }
      expect(t.sources.length).toBeGreaterThan(0);
    }
  });
});
