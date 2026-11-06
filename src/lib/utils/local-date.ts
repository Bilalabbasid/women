/**
 * Calendar dates (YYYY-MM-DD) in her own time zone.
 *
 * `new Date().toISOString().slice(0, 10)` is the UTC date: in the US it rolls
 * over to tomorrow during the evening, so an evening check-in or dose was filed
 * under the next day. Entries she logs belong to her local day.
 */
export function localDateString(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** The local calendar date `n` days before `from` (DST-safe: steps by calendar day, not 24h). */
export function localDaysAgo(n: number, from: Date = new Date()): string {
  return localDateString(new Date(from.getFullYear(), from.getMonth(), from.getDate() - n));
}

/** The ISO calendar date `delta` days after `dateStr` (negative to go back). Pure string arithmetic, pairs with `daysBetween()` in `storage/periods.ts`. */
export function addIsoDays(dateStr: string, delta: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + delta)).toISOString().slice(0, 10);
}
