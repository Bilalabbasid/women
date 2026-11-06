import { db } from '../db/db';
import { newId } from '../utils/id';
import type { LocalToolRecord, ToolKey } from '../db/schema';

/** Today as YYYY-MM-DD in her local time zone (not UTC: an evening entry belongs to today). */
export function localToday(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const isIsoDate = (s: unknown): s is string => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);

const draftId = (tool: ToolKey) => `draft:${tool}`;

export const ToolRecords = {
  async getDraft(tool: ToolKey): Promise<LocalToolRecord | undefined> {
    return db.toolRecords.get(draftId(tool));
  },

  async saveDraft(tool: ToolKey, data: unknown): Promise<void> {
    const now = Date.now();
    const existing = await db.toolRecords.get(draftId(tool));
    await db.toolRecords.put({
      id: draftId(tool),
      tool,
      kind: 'draft',
      date: localToday(),
      data,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    });
  },

  async clearDraft(tool: ToolKey): Promise<void> {
    await db.toolRecords.delete(draftId(tool));
  },

  /** Saved entries for a tool, newest date first (ties: most recently edited first). */
  async listEntries(tool: ToolKey): Promise<LocalToolRecord[]> {
    const rows = await db.toolRecords.where('[tool+kind]').equals([tool, 'entry']).toArray();
    return rows.sort((a, b) => (a.date === b.date ? b.updatedAt - a.updatedAt : a.date < b.date ? 1 : -1));
  },

  async addEntry(tool: ToolKey, date: string, data: unknown, label?: string): Promise<LocalToolRecord> {
    if (!isIsoDate(date)) throw new Error('A saved entry needs a valid date');
    const now = Date.now();
    const record: LocalToolRecord = {
      id: newId('tool'),
      tool,
      kind: 'entry',
      date,
      label: label?.trim() || undefined,
      data,
      createdAt: now,
      updatedAt: now,
    };
    await db.toolRecords.put(record);
    return record;
  },

  async updateEntry(id: string, patch: { date?: string; label?: string; data?: unknown }): Promise<void> {
    const existing = await db.toolRecords.get(id);
    if (!existing || existing.kind !== 'entry') throw new Error('That saved entry no longer exists');
    if (patch.date !== undefined && !isIsoDate(patch.date)) throw new Error('A saved entry needs a valid date');
    await db.toolRecords.put({
      ...existing,
      ...(patch.date !== undefined ? { date: patch.date } : {}),
      ...(patch.label !== undefined ? { label: patch.label.trim() || undefined } : {}),
      ...(patch.data !== undefined ? { data: patch.data } : {}),
      updatedAt: Date.now(),
    });
  },

  async deleteEntry(id: string): Promise<void> {
    await db.toolRecords.delete(id);
  },

  /** Removes the tool's draft and every saved entry. */
  async clearTool(tool: ToolKey): Promise<number> {
    return db.toolRecords.where('tool').equals(tool).delete();
  },
};
