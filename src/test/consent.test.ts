import { describe, it, expect, beforeEach } from 'vitest';
import { canStorePreferences, getConsent, resetConsent, setConsent, setPreference, CONSENT_KEY } from '@/lib/storage/consent';
import { hasUsedTool, markToolUsed } from '@/lib/pwa/install-gate';

describe('storage consent', () => {
  beforeEach(() => localStorage.clear());

  it('stores no preferences before a choice is made', () => {
    expect(getConsent()).toBeNull();
    setPreference('menowell_tool_used', '1');
    expect(localStorage.getItem('menowell_tool_used')).toBeNull();
  });

  it('"Allow preferences" lets preferences be stored', () => {
    setConsent('all');
    expect(canStorePreferences()).toBe(true);
    setPreference('menowell_tool_used', '1');
    expect(localStorage.getItem('menowell_tool_used')).toBe('1');
  });

  it('"Essential only" stores no preferences and deletes ones already stored', () => {
    localStorage.setItem('menowell_tool_used', '1');
    localStorage.setItem('menoverdict_cookie_consent', 'accepted_all');
    localStorage.setItem('menowell_pinned_symptoms', '["hot_flashes"]');
    setConsent('essential');
    expect(localStorage.getItem('menowell_tool_used')).toBeNull();
    expect(localStorage.getItem('menoverdict_cookie_consent')).toBeNull();
    // Things she asked the site to keep are never touched.
    expect(localStorage.getItem('menowell_pinned_symptoms')).toBe('["hot_flashes"]');
    setPreference('menowell_tool_used', '1');
    expect(localStorage.getItem('menowell_tool_used')).toBeNull();
  });

  it('the install offer still works for this visit without stored preferences', () => {
    setConsent('essential');
    markToolUsed();
    expect(hasUsedTool()).toBe(true);
    expect(localStorage.getItem('menowell_tool_used')).toBeNull();
  });

  it('the choice can be withdrawn so the banner asks again', () => {
    setConsent('all');
    resetConsent();
    expect(localStorage.getItem(CONSENT_KEY)).toBeNull();
    expect(getConsent()).toBeNull();
  });
});
