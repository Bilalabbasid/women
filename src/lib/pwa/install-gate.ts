/**
 * Install-prompt gate: the offer to install appears only after a tool is used,
 * never on page load and never by counting visits.
 *
 * The flag is a plain "a tool was used" boolean with no health content. It is a
 * preference, so it's remembered on the device only when the visitor allowed
 * preferences; otherwise it lasts for the current visit only (in memory).
 */
import { setPreference } from '../storage/consent';

const KEY = 'menowell_tool_used';
let usedThisVisit = false;

export function markToolUsed(): void {
  usedThisVisit = true;
  setPreference(KEY, '1');
}

export function hasUsedTool(): boolean {
  if (usedThisVisit) return true;
  try {
    return window.localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}
