import { db } from '../db/db';
import { newId } from '../utils/id';
import type { LocalCycleEntry } from '../db/schema';
import { isIsoDate } from './tool-records';

/**
 * Period start dates, shared by the 12-month counter and the tracker
 * (IndexedDB `cycles` table). Newest first.
 */
export const Periods = {
  async list(): Promise<LocalCycleEntry[]> {
    return db.cycles.orderBy('startDate').reverse().toArray();
  },

  async add(startDate: string, notes?: string): Promise<LocalCycleEntry | null> {
    if (!isIsoDate(startDate)) throw new Error('Enter a valid date');
    const existing = await db.cycles.where('startDate').equals(startDate).first();
    if (existing) return null;
    const record: LocalCycleEntry = {
      id: newId('cyc'),
      startDate,
      notes: notes?.trim() || undefined,
      createdAt: Date.now(),
    };
    await db.cycles.put(record);
    return record;
  },

  async update(id: string, patch: { startDate?: string; notes?: string }): Promise<void> {
    const existing = await db.cycles.get(id);
    if (!existing) throw new Error('That period entry no longer exists');
    if (patch.startDate !== undefined && !isIsoDate(patch.startDate)) throw new Error('Enter a valid date');
    await db.cycles.put({
      ...existing,
      ...(patch.startDate !== undefined ? { startDate: patch.startDate } : {}),
      ...(patch.notes !== undefined ? { notes: patch.notes.trim() || undefined } : {}),
    });
  },

  async remove(id: string): Promise<void> {
    await db.cycles.delete(id);
  },
};

/** Whole days from one YYYY-MM-DD to another (calendar days, time-zone safe). */
export function daysBetween(fromIso: string, toIso: string): number {
  const [y1, m1, d1] = fromIso.split('-').map(Number);
  const [y2, m2, d2] = toIso.split('-').map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86_400_000);
}
