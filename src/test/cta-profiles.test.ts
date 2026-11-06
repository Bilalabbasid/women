/** @vitest-environment node */
import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { loadCtaProfiles, profileProblems, MATRIX_REQUIRED_NEVER, type CtaProfile } from '@/lib/cta/profiles';

const { profiles, errors } = loadCtaProfiles(path.join(process.cwd(), 'content', '_cta'));

describe('CTA profiles', () => {
  it('load without schema errors', () => {
    expect(errors).toEqual([]);
  });

  it('satisfy every rule of the CTA matrix', () => {
    expect(profileProblems(profiles)).toEqual([]);
  });

  it('fail when a banned combination is introduced', () => {
    const broken: Record<string, CtaProfile> = structuredClone(profiles);
    // A supplement offer on a hot-flash page: banned by the matrix.
    broken.vasomotor.commercial_never = broken.vasomotor.commercial_never.filter((c) => c !== 'supplement_as_treatment');
    // Any commercial content on bleeding pages: banned.
    broken.bleeding.placement = 'after_evidence';
    broken.bleeding.commercial_allowed = ['telehealth'];
    broken.bleeding.max_commercial_blocks = 1;
    const problems = profileProblems(broken);
    expect(problems).toContain('vasomotor: must ban "supplement_as_treatment" (CTA matrix)');
    expect(problems).toContain('bleeding: must never carry commercial content');
  });

  it('only comparison pages may have a sticky mobile CTA or several commercial blocks', () => {
    for (const [name, p] of Object.entries(profiles)) {
      if (name !== 'care_comparison') {
        expect(p.sticky_mobile_cta, name).toBe(false);
        expect(p.max_commercial_blocks, name).toBeLessThanOrEqual(1);
      }
    }
  });

  it('covers every row of the matrix', () => {
    for (const name of Object.keys(MATRIX_REQUIRED_NEVER)) expect(profiles[name], name).toBeDefined();
  });
});
