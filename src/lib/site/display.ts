/**
 * Reading display preferences: theme (system / light / dark) and text size
 * (A / A+ / A++). Applied as data attributes on <html>, read by tokens.css.
 *
 * Storage follows the site's consent rules (lib/storage/consent.ts): kept in
 * localStorage only when the visitor allowed preferences, otherwise in
 * sessionStorage so it still holds across pages for this visit. "Essential
 * only" deletes the localStorage copy (DISPLAY_KEY is a preference key).
 */

export type ThemeChoice = 'system' | 'light' | 'dark';
export type TextSize = 'md' | 'lg' | 'xl';
export interface DisplayPrefs {
  /** theme */
  t: ThemeChoice;
  /** text size */
  z: TextSize;
}

export const DISPLAY_KEY = 'menoverdict_display';
export const DISPLAY_EVENT = 'menoverdict:display-change';
export const DEFAULT_DISPLAY: DisplayPrefs = { t: 'system', z: 'md' };

/** Inline, pre-paint: applies stored prefs before the first frame (no theme flash). */
export const DISPLAY_PAINT_SCRIPT =
  "try{var k='" +
  DISPLAY_KEY +
  "',s=localStorage.getItem(k)||sessionStorage.getItem(k);var p=s?JSON.parse(s):{t:'light'};var d=document.documentElement;" +
  "d.setAttribute('data-theme',p.t==='dark'?'dark':'light');" +
  "if(p.z==='lg'||p.z==='xl')d.setAttribute('data-text-size',p.z)}catch(e){}";

export function applyDisplay(p: DisplayPrefs): void {
  const d = document.documentElement;
  if (p.t === 'system') d.removeAttribute('data-theme');
  else d.setAttribute('data-theme', p.t);
  if (p.z === 'md') d.removeAttribute('data-text-size');
  else d.setAttribute('data-text-size', p.z);
}

export function readDisplay(): DisplayPrefs {
  try {
    const s = window.localStorage.getItem(DISPLAY_KEY) ?? window.sessionStorage.getItem(DISPLAY_KEY);
    if (!s) return DEFAULT_DISPLAY;
    const p = JSON.parse(s) as Partial<DisplayPrefs>;
    return {
      t: p.t === 'light' || p.t === 'dark' ? p.t : 'system',
      z: p.z === 'lg' || p.z === 'xl' ? p.z : 'md',
    };
  } catch {
    return DEFAULT_DISPLAY;
  }
}

export function saveDisplay(p: DisplayPrefs, persist: boolean): void {
  applyDisplay(p);
  const value = JSON.stringify(p);
  const isDefault = p.t === 'system' && p.z === 'md';
  try {
    if (persist && !isDefault) window.localStorage.setItem(DISPLAY_KEY, value);
    else window.localStorage.removeItem(DISPLAY_KEY);
  } catch {
    // ignore
  }
  try {
    if (isDefault) window.sessionStorage.removeItem(DISPLAY_KEY);
    else window.sessionStorage.setItem(DISPLAY_KEY, value);
  } catch {
    // ignore
  }
  window.dispatchEvent(new Event(DISPLAY_EVENT));
}
