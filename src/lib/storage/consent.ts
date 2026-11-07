/**
 * Storage consent. The site sets no cookies and runs no tracking, but some
 * countries expect a choice before anything non-essential is stored on a device.
 *
 *  - Essential (always): what the visitor explicitly logs or saves (tracker
 *    entries, saved pages, pinned symptoms, tool answers, reminder settings),
 *    and this consent record itself.
 *  - Preferences (only with "Allow"): convenience flags such as "you've used a
 *    tool", "onboarding done" and "this message was closed".
 *
 * Choosing "Essential only" deletes any stored preference keys.
 */

export type StorageConsent = 'all' | 'essential';

export const CONSENT_KEY = 'menoverdict_storage_consent';
export const CONSENT_EVENT = 'menoverdict:consent-change';

/** localStorage keys that are preferences, not things the visitor asked us to keep. */
export const PREFERENCE_KEYS = [
  'menowell_tool_used',
  'menowell_onboarding_completed',
  'menoverdict_install_dismissed_until',
  // Theme and text size (lib/site/display.ts); without consent they live in sessionStorage.
  'menoverdict_display',
  // Left by earlier versions of the notice.
  'menoverdict_notice_dismissed',
  'menoverdict_cookie_consent',
  'menowell_cookie_consent',
] as const;

export function getConsent(): StorageConsent | null {
  try {
    const v = window.localStorage.getItem(CONSENT_KEY);
    return v === 'all' || v === 'essential' ? v : null;
  } catch {
    return null;
  }
}

/** True only after the visitor chose "Allow preferences". */
export function canStorePreferences(): boolean {
  return getConsent() === 'all';
}

export function setConsent(choice: StorageConsent): void {
  try {
    window.localStorage.setItem(CONSENT_KEY, choice);
    if (choice === 'essential') {
      for (const k of PREFERENCE_KEYS) window.localStorage.removeItem(k);
    }
  } catch {
    // Storage unavailable: nothing is being stored anyway.
  }
  window.dispatchEvent(new Event(CONSENT_EVENT));
}

/** Forget the choice so the banner asks again (the footer's "Storage choices"). */
export function resetConsent(): void {
  try {
    window.localStorage.removeItem(CONSENT_KEY);
  } catch {
    // ignore
  }
  window.dispatchEvent(new Event(CONSENT_EVENT));
}

/** Writes a preference key only when the visitor allowed preferences. */
export function setPreference(key: (typeof PREFERENCE_KEYS)[number], value: string): void {
  if (!canStorePreferences()) return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

export function subscribeConsent(onChange: () => void): () => void {
  window.addEventListener(CONSENT_EVENT, onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(CONSENT_EVENT, onChange);
    window.removeEventListener('storage', onChange);
  };
}
