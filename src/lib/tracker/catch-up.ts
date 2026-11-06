// Catching up on missed days.
//
// There's no push-notification server behind this app (see DECISIONS.md), so
// nothing reminds her while the site or PWA is closed. The one honest thing
// we can still do is notice the gap the next time she opens it, and let her
// add her own entries for the days she missed. Never invented for her: a day
// she skips here just stays unlogged.

import { daysBetween } from '../storage/periods';
import { addIsoDays } from '../utils/local-date';

/** Widest gap we'll ever ask her to fill in at once. Beyond this, catching up
 * day-by-day stops helping and becomes a chore, so we just show the gap. */
export const MAX_CATCH_UP_DAYS = 14;

/**
 * The calendar dates she missed: strictly between `lastLoggedDate` and
 * `todayStr`, most recent first, capped to `maxDays`. Empty when she logged
 * today or yesterday (no real gap) or has never logged anything yet.
 */
export function getMissedDays(
  lastLoggedDate: string | null,
  todayStr: string,
  maxDays = MAX_CATCH_UP_DAYS,
): string[] {
  if (!lastLoggedDate || !todayStr || lastLoggedDate >= todayStr) return [];

  const gapDays = daysBetween(lastLoggedDate, todayStr);
  const missedCount = Math.min(gapDays - 1, maxDays);
  if (missedCount < 1) return [];

  const missed: string[] = [];
  for (let i = 1; i <= missedCount; i++) {
    missed.push(addIsoDays(todayStr, -i));
  }
  return missed;
}
