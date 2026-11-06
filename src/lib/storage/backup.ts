import { z } from 'zod';
import { db } from '../db/db';
import { TOOL_KEYS } from '../db/schema';
import { APP_CONFIG } from '../config/constants';
import { appLocalStorageKeys } from './manager';

/**
 * Backup and restore. A backup is a JSON file she downloads and keeps herself;
 * restoring reads it back into this browser. Nothing is uploaded.
 *
 * formatVersion 1 = the older "Export all my data" file (tables only).
 * formatVersion 2 = adds the tool records table and this site's localStorage keys.
 * Both can be restored.
 */

export const TABLE_NAMES = [
  'checkins',
  'symptoms',
  'journal',
  'customSymptoms',
  'cycles',
  'treatments',
  'treatmentEvents',
  'appointments',
  'settings',
  'toolRecords',
] as const;
export type TableName = (typeof TABLE_NAMES)[number];

export interface BackupFile {
  format: 'menoverdict-backup';
  formatVersion: 2;
  app: string;
  appVersion: string;
  schemaVersion: number;
  exportedAt: string;
  privacyNotice: string;
  data: Record<TableName, unknown[]>;
  localStorage: Record<string, string>;
}

const PRIVACY_NOTICE =
  'This file contains your self-reported health records from MenoVerdict. Anyone who opens it can read them, so keep it somewhere private.';

export async function createBackup(): Promise<BackupFile> {
  const rows = await Promise.all(TABLE_NAMES.map((t) => db.table(t).toArray()));
  const data = Object.fromEntries(TABLE_NAMES.map((t, i) => [t, rows[i]])) as Record<TableName, unknown[]>;
  const local: Record<string, string> = {};
  for (const k of appLocalStorageKeys()) {
    try {
      const v = window.localStorage.getItem(k);
      if (v !== null) local[k] = v;
    } catch {
      // ignore
    }
  }
  return {
    format: 'menoverdict-backup',
    formatVersion: 2,
    app: APP_CONFIG.name,
    appVersion: APP_CONFIG.version,
    schemaVersion: db.verno,
    exportedAt: new Date().toISOString(),
    privacyNotice: PRIVACY_NOTICE,
    data,
    localStorage: local,
  };
}

export function backupFileName(now: Date = new Date()): string {
  return `menoverdict-backup-${now.toISOString().slice(0, 10)}.json`;
}

export async function downloadBackup(): Promise<{ records: number }> {
  const backup = await createBackup();
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = backupFileName();
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Revoke on the next tick: some browsers start the download asynchronously.
  setTimeout(() => URL.revokeObjectURL(url), 0);
  return { records: Object.values(backup.data).reduce((n, list) => n + list.length, 0) };
}

// ------------------------------------------------------------------ validation

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const id = z.string().min(1);
const scale = z.number().int().min(1).max(5);

/** Minimal shape per table: the keys and indexed fields the app relies on. Extra fields are kept. */
const RECORD_SCHEMAS: Record<TableName, z.ZodType> = {
  checkins: z.looseObject({ id, date: isoDate, overallFeeling: scale, timestamp: z.number(), createdAt: z.number() }),
  symptoms: z.looseObject({ id, checkinId: id, date: isoDate, symptomId: z.string(), name: z.string(), severity: scale }),
  journal: z.looseObject({ id, date: isoDate, content: z.string() }),
  customSymptoms: z.looseObject({ id, name: z.string().min(1) }),
  cycles: z.looseObject({ id, startDate: isoDate }),
  treatments: z.looseObject({ id, name: z.string().min(1), active: z.boolean() }),
  treatmentEvents: z.looseObject({ id, treatmentId: z.string(), date: isoDate, action: z.string() }),
  appointments: z.looseObject({ id, date: isoDate }),
  settings: z.looseObject({ key: z.string().min(1) }),
  toolRecords: z.looseObject({
    id,
    tool: z.enum(TOOL_KEYS),
    kind: z.enum(['draft', 'entry']),
    date: isoDate,
    createdAt: z.number(),
    updatedAt: z.number(),
  }),
};

const fileSchema = z.looseObject({
  formatVersion: z.union([z.literal(1), z.literal(2)]),
  exportedAt: z.string().optional(),
  data: z.record(z.string(), z.array(z.unknown())),
  localStorage: z.record(z.string(), z.string()).optional(),
});

export interface ParsedBackup {
  formatVersion: 1 | 2;
  exportedAt: string | null;
  tables: Partial<Record<TableName, unknown[]>>;
  localStorage: Record<string, string>;
  counts: Partial<Record<TableName, number>>;
  skipped: number;
  total: number;
}

/** Reads and checks a backup file. Throws a readable Error if it can't be used at all. */
export function parseBackup(text: string): ParsedBackup {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error('This file is not a MenoVerdict backup (it is not valid JSON).');
  }
  const top = fileSchema.safeParse(json);
  if (!top.success) throw new Error('This file is not a MenoVerdict backup, or it is from an unsupported version.');

  const tables: ParsedBackup['tables'] = {};
  const counts: ParsedBackup['counts'] = {};
  let skipped = 0;
  for (const name of TABLE_NAMES) {
    const list = top.data.data[name];
    if (!Array.isArray(list)) continue;
    const ok: unknown[] = [];
    for (const row of list) {
      if (RECORD_SCHEMAS[name].safeParse(row).success) ok.push(row);
      else skipped++;
    }
    tables[name] = ok;
    counts[name] = ok.length;
  }
  const local = Object.fromEntries(
    Object.entries(top.data.localStorage ?? {}).filter(([k]) => /^(menowell|menoverdict)/i.test(k)),
  );
  const total = Object.values(counts).reduce((a, b) => a + (b ?? 0), 0);
  if (total === 0 && Object.keys(local).length === 0) throw new Error('This backup file has no records in it.');
  return {
    formatVersion: top.data.formatVersion,
    exportedAt: top.data.exportedAt ?? null,
    tables,
    localStorage: local,
    counts,
    skipped,
    total,
  };
}

export type RestoreMode = 'merge' | 'replace';

/**
 * Writes a parsed backup into this browser in one all-or-nothing transaction.
 *  - merge: keeps what's already here; a record with the same id (or a check-in
 *    for the same day) is replaced by the backup's copy.
 *  - replace: clears every table first, so the device matches the backup exactly.
 */
export async function restoreBackup(parsed: ParsedBackup, mode: RestoreMode): Promise<{ written: number }> {
  let written = 0;
  const tables = TABLE_NAMES.map((t) => db.table(t));
  await db.transaction('rw', tables, async () => {
    if (mode === 'replace') await Promise.all(tables.map((t) => t.clear()));

    // One check-in per day: drop a local check-in (and its ratings) that the backup replaces for the same date.
    if (mode === 'merge' && parsed.tables.checkins?.length) {
      for (const c of parsed.tables.checkins as Array<{ id: string; date: string }>) {
        const local = await db.checkins.where('date').equals(c.date).first();
        if (local && local.id !== c.id) {
          await db.symptoms.where('checkinId').equals(local.id).delete();
          await db.checkins.delete(local.id);
        }
      }
    }

    for (const name of TABLE_NAMES) {
      const rows = parsed.tables[name];
      if (!rows?.length) continue;
      await db.table(name).bulkPut(rows);
      written += rows.length;
    }
  });

  if (typeof window !== 'undefined') {
    for (const [k, v] of Object.entries(parsed.localStorage)) {
      try {
        window.localStorage.setItem(k, v);
      } catch {
        // ignore: preferences only
      }
    }
  }
  return { written };
}

export async function readFileText(file: File): Promise<string> {
  if (typeof file.text === 'function') return file.text();
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result ?? ''));
    r.onerror = () => reject(r.error ?? new Error('Could not read the file'));
    r.readAsText(file);
  });
}
