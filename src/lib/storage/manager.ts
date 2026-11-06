import { db } from '../db/db';
import { TOOL_KEYS, type ToolKey } from '../db/schema';
import { requestPersistentStorage } from '../pwa/persist-storage';

/**
 * Manage-storage engine. Everything here runs on the device; nothing is sent.
 * Deletions only ever happen when she confirms them in the UI; there is no
 * automatic, age-based or inactivity-based deletion of local data anywhere.
 */

export type CategoryId =
  | 'checkins'
  | 'treatments'
  | 'periods'
  | 'appointments'
  | 'journal'
  | ToolKey
  | 'customSymptoms'
  | 'preferences';

export interface CategoryDef {
  id: CategoryId;
  label: string;
  description: string;
  /** Dated categories can be trimmed by date range; the others can only be cleared. */
  dated: boolean;
}

export const CATEGORIES: readonly CategoryDef[] = [
  { id: 'checkins', label: 'Daily check-ins', description: 'Check-ins and symptom ratings from your tracker.', dated: true },
  { id: 'treatments', label: 'Treatments and dose log', description: 'Treatment plans you added and the doses you logged. Date ranges only remove log entries; your plans stay.', dated: true },
  { id: 'periods', label: 'Period start dates', description: 'Dates from the 12-month counter.', dated: true },
  { id: 'appointments', label: 'Appointments', description: 'Appointments saved in your tracker.', dated: true },
  { id: 'journal', label: 'Journal notes', description: 'Free-text journal entries.', dated: true },
  { id: 'symptoms-checklist', label: 'Symptoms checklist', description: 'Saved symptom lists and your current ticks.', dated: true },
  { id: 'stage-guide', label: 'Stage guide', description: 'Saved answer sets and your current answers.', dated: true },
  { id: 'does-it-work-checker', label: 'Evidence checker', description: 'Saved shortlists and your current shortlist and filters.', dated: true },
  { id: 'treatment-questions', label: 'Doctor question sheets', description: 'Saved question sheets and your current sheet.', dated: true },
  { id: '12-month-counter', label: '12-month counter', description: 'Your current answers (period dates are listed separately above).', dated: false },
  { id: 'customSymptoms', label: 'Custom symptom names', description: 'Symptoms you added to the tracker yourself.', dated: false },
  { id: 'preferences', label: 'Preferences and saved doctor-report questions', description: 'Settings stored by the tracker, including questions you added to the doctor report.', dated: false },
];

const isTool = (id: CategoryId): id is ToolKey => (TOOL_KEYS as readonly string[]).includes(id);

export interface CategorySummary {
  id: CategoryId;
  /** Main record count shown to her (check-ins, log entries, saved entries...). */
  records: number;
  /** Extra detail, e.g. "12 symptom ratings" or "2 treatment plans". */
  detail?: string;
  oldest?: string;
  newest?: string;
}

async function datedRange(dates: string[]): Promise<{ oldest?: string; newest?: string }> {
  if (dates.length === 0) return {};
  const sorted = [...dates].sort();
  return { oldest: sorted[0], newest: sorted[sorted.length - 1] };
}

async function toolEntryDates(tool: ToolKey): Promise<string[]> {
  const rows = await db.toolRecords.where('[tool+kind]').equals([tool, 'entry']).toArray();
  return rows.map((r) => r.date);
}

export async function summarizeCategory(id: CategoryId): Promise<CategorySummary> {
  switch (id) {
    case 'checkins': {
      const [records, ratings, first, last] = await Promise.all([
        db.checkins.count(),
        db.symptoms.count(),
        db.checkins.orderBy('date').first(),
        db.checkins.orderBy('date').last(),
      ]);
      return { id, records, detail: `${ratings} symptom rating${ratings === 1 ? '' : 's'}`, oldest: first?.date, newest: last?.date };
    }
    case 'treatments': {
      const [plans, records, first, last] = await Promise.all([
        db.treatments.count(),
        db.treatmentEvents.count(),
        db.treatmentEvents.orderBy('date').first(),
        db.treatmentEvents.orderBy('date').last(),
      ]);
      return { id, records, detail: `${plans} treatment plan${plans === 1 ? '' : 's'}`, oldest: first?.date, newest: last?.date };
    }
    case 'periods': {
      const [records, first, last] = await Promise.all([
        db.cycles.count(),
        db.cycles.orderBy('startDate').first(),
        db.cycles.orderBy('startDate').last(),
      ]);
      return { id, records, oldest: first?.startDate, newest: last?.startDate };
    }
    case 'appointments':
    case 'journal': {
      const table = id === 'appointments' ? db.appointments : db.journal;
      const [records, first, last] = await Promise.all([table.count(), table.orderBy('date').first(), table.orderBy('date').last()]);
      return { id, records, oldest: first?.date, newest: last?.date };
    }
    case 'customSymptoms':
      return { id, records: await db.customSymptoms.count() };
    case 'preferences':
      return { id, records: await db.settings.count() };
    default: {
      const rows = await db.toolRecords.where('tool').equals(id).toArray();
      const entries = rows.filter((r) => r.kind === 'entry');
      const hasDraft = rows.some((r) => r.kind === 'draft');
      return {
        id,
        records: entries.length,
        detail: hasDraft ? 'plus your current unsaved answers' : undefined,
        ...(await datedRange(entries.map((e) => e.date))),
      };
    }
  }
}

export async function summarizeAll(): Promise<CategorySummary[]> {
  return Promise.all(CATEGORIES.map((c) => summarizeCategory(c.id)));
}

/** Every distinct calendar day (YYYY-MM-DD) with at least one dated record in the chosen categories, oldest first. */
export async function loggedDays(categories: readonly CategoryId[]): Promise<string[]> {
  const days = new Set<string>();
  const add = (list: Array<unknown>) => list.forEach((d) => typeof d === 'string' && days.add(d));
  for (const id of categories) {
    if (id === 'checkins') add(await db.checkins.orderBy('date').uniqueKeys());
    else if (id === 'treatments') add(await db.treatmentEvents.orderBy('date').uniqueKeys());
    else if (id === 'periods') add(await db.cycles.orderBy('startDate').uniqueKeys());
    else if (id === 'appointments') add(await db.appointments.orderBy('date').uniqueKeys());
    else if (id === 'journal') add(await db.journal.orderBy('date').uniqueKeys());
    else if (isTool(id)) add(await toolEntryDates(id));
  }
  return [...days].sort();
}

export interface DateRange {
  from: string;
  to: string;
}

/**
 * The span covering her N oldest *logged* days. "Delete the oldest 10 days" of
 * 30 logged days removes those 10 and keeps the other 20, even if she skipped
 * calendar days in between.
 */
export async function oldestLoggedDays(categories: readonly CategoryId[], n: number): Promise<(DateRange & { days: number }) | null> {
  const days = await loggedDays(categories);
  if (days.length === 0 || n < 1) return null;
  const slice = days.slice(0, n);
  return { from: slice[0], to: slice[slice.length - 1], days: slice.length };
}

export interface RangePreview {
  perCategory: Partial<Record<CategoryId, number>>;
  /** Child rows removed along with their parent (symptom ratings inside check-ins). */
  symptomRatings: number;
  total: number;
}

function assertRange({ from, to }: DateRange) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) throw new Error('Choose both dates');
  if (from > to) throw new Error('The start date must be on or before the end date');
}

export async function previewRange(categories: readonly CategoryId[], range: DateRange): Promise<RangePreview> {
  assertRange(range);
  const { from, to } = range;
  const perCategory: RangePreview['perCategory'] = {};
  let symptomRatings = 0;
  for (const id of categories) {
    if (id === 'checkins') {
      perCategory[id] = await db.checkins.where('date').between(from, to, true, true).count();
      symptomRatings = await db.symptoms.where('date').between(from, to, true, true).count();
    } else if (id === 'treatments') perCategory[id] = await db.treatmentEvents.where('date').between(from, to, true, true).count();
    else if (id === 'periods') perCategory[id] = await db.cycles.where('startDate').between(from, to, true, true).count();
    else if (id === 'appointments') perCategory[id] = await db.appointments.where('date').between(from, to, true, true).count();
    else if (id === 'journal') perCategory[id] = await db.journal.where('date').between(from, to, true, true).count();
    else if (isTool(id)) perCategory[id] = (await toolEntryDates(id)).filter((d) => d >= from && d <= to).length;
  }
  const total = Object.values(perCategory).reduce((a, b) => a + (b ?? 0), 0);
  return { perCategory, symptomRatings, total };
}

const ALL_TABLES = () => [
  db.checkins,
  db.symptoms,
  db.journal,
  db.customSymptoms,
  db.cycles,
  db.treatments,
  db.treatmentEvents,
  db.appointments,
  db.settings,
  db.toolRecords,
];

/** Deletes dated records in [from, to] (inclusive) from the chosen categories, in one all-or-nothing transaction. */
export async function deleteRange(categories: readonly CategoryId[], range: DateRange): Promise<RangePreview> {
  const preview = await previewRange(categories, range);
  const { from, to } = range;
  await db.transaction('rw', ALL_TABLES(), async () => {
    for (const id of categories) {
      if (id === 'checkins') {
        const ids = await db.checkins.where('date').between(from, to, true, true).primaryKeys();
        await db.symptoms.where('checkinId').anyOf(ids).delete();
        // Ratings are dated by their check-in, so this also catches any orphans in range.
        await db.symptoms.where('date').between(from, to, true, true).delete();
        await db.checkins.bulkDelete(ids);
      } else if (id === 'treatments') await db.treatmentEvents.where('date').between(from, to, true, true).delete();
      else if (id === 'periods') await db.cycles.where('startDate').between(from, to, true, true).delete();
      else if (id === 'appointments') await db.appointments.where('date').between(from, to, true, true).delete();
      else if (id === 'journal') await db.journal.where('date').between(from, to, true, true).delete();
      else if (isTool(id)) {
        await db.toolRecords
          .where('[tool+kind]')
          .equals([id, 'entry'])
          .filter((r) => r.date >= from && r.date <= to)
          .delete();
      }
    }
  });
  return preview;
}

/** Removes everything in the chosen categories (all dates, plus undated items such as treatment plans and drafts). */
export async function clearCategories(categories: readonly CategoryId[]): Promise<void> {
  await db.transaction('rw', ALL_TABLES(), async () => {
    for (const id of categories) {
      if (id === 'checkins') await Promise.all([db.checkins.clear(), db.symptoms.clear()]);
      else if (id === 'treatments') await Promise.all([db.treatments.clear(), db.treatmentEvents.clear()]);
      else if (id === 'periods') await db.cycles.clear();
      else if (id === 'appointments') await db.appointments.clear();
      else if (id === 'journal') await db.journal.clear();
      else if (id === 'customSymptoms') await db.customSymptoms.clear();
      else if (id === 'preferences') await db.settings.clear();
      else if (isTool(id)) await db.toolRecords.where('tool').equals(id).delete();
    }
  });
}

/** This site's own localStorage keys (tracker preferences, pinned symptoms, bookmarks, install flag). */
export function appLocalStorageKeys(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && /^(menowell|menoverdict)/i.test(k)) keys.push(k);
    }
    return keys;
  } catch {
    return [];
  }
}

/** Removes every record in every table and this site's localStorage keys. */
export async function clearEverything(): Promise<void> {
  await db.transaction('rw', ALL_TABLES(), async () => {
    await Promise.all(ALL_TABLES().map((t) => t.clear()));
  });
  for (const k of appLocalStorageKeys()) {
    try {
      window.localStorage.removeItem(k);
    } catch {
      // ignore
    }
  }
}

export interface StorageEstimate {
  supported: boolean;
  usage: number | null;
  quota: number | null;
  persisted: boolean | null;
}

export async function getStorageEstimate(): Promise<StorageEstimate> {
  const nav = typeof navigator === 'undefined' ? undefined : navigator;
  if (!nav?.storage?.estimate) return { supported: false, usage: null, quota: null, persisted: null };
  try {
    const [est, persisted] = await Promise.all([
      nav.storage.estimate(),
      nav.storage.persisted ? nav.storage.persisted() : Promise.resolve(null),
    ]);
    return { supported: true, usage: est.usage ?? null, quota: est.quota ?? null, persisted };
  } catch {
    return { supported: false, usage: null, quota: null, persisted: null };
  }
}

/** Under 10% (or under 20 MB) of the browser's quota left. */
export function isStorageLow(e: StorageEstimate): boolean {
  if (e.usage == null || !e.quota) return false;
  const free = e.quota - e.usage;
  return free / e.quota < 0.1 || free < 20 * 1024 * 1024;
}

export async function requestPersistence(): Promise<boolean> {
  return requestPersistentStorage();
}

export function formatBytes(n: number | null): string {
  if (n == null) return 'unknown';
  if (n < 1024) return `${n} bytes`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
}
