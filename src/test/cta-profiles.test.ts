/** @vitest-environment node */
import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { loadCtaProfiles, profileProblems, REQUIRED_PROFILES, type CtaProfile } from '@/lib/cta/profiles';

const { profiles, errors } = loadCtaProfiles(path.join(process.cwd(), 'content', '_cta'));

describe('CTA profiles', () => {
  it('load without schema errors', () => {
    expect(errors).toEqual([]);
  });

  it('pass every profile rule', () => {
    expect(profileProblems(profiles)).toEqual([]);
  });

  it('fail when a rule is broken', () => {
    const broken: Record<string, CtaProfile> = structuredClone(profiles);
    broken.vasomotor.sticky_mobile_cta = true;
    delete broken.bleeding;
    const problems = profileProblems(broken);
    expect(problems).toContain('vasomotor: sticky mobile CTAs are for comparison pages only');
    expect(problems).toContain('missing profile "bleeding"');
  });

  it('offer only free next steps', () => {
    for (const [name, p] of Object.entries(profiles)) {
      expect(Object.keys(p).some((k) => /commerc|affiliat|placement/.test(k)), name).toBe(false);
    }
  });

  it('covers every required profile', () => {
    for (const name of REQUIRED_PROFILES) expect(profiles[name], name).toBeDefined();
  });
});
