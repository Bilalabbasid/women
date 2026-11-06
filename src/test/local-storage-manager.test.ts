import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/lib/db/db';
import { LocalDataService } from '@/lib/db/service';
import { ToolRecords } from '@/lib/storage/tool-records';
import { Periods, daysBetween } from '@/lib/storage/periods';
import {
  loggedDays,
  oldestLoggedDays,
  previewRange,
  deleteRange,
  clearCategories,
  clearEverything,
  summarizeCategory,
  isStorageLow,
} from '@/lib/storage/manager';
import { createBackup, parseBackup, restoreBackup } from '@/lib/storage/backup';
import { migrateLegacyToolStorage } from '@/lib/storage/legacy-migration';
import { classifyStorageError, describeStorageError } from '@/lib/storage/errors';

/** 2026-01-01 + n days as YYYY-MM-DD. */
const day = (n: number) => new Date(Date.UTC(2026, 0, 1 + n)).toISOString().slice(0, 10);

async function logDays(n: number, start = 0) {
  for (let i = start; i < start + n; i++) {
    await LocalDataService.saveCheckin({
      date: day(i),
      overallFeeling: 3,
      symptoms: [{ symptomId: 'hot_flashes', name: 'Hot flashes', category: 'vasomotor', severity: 2 }],
    });
  }
}

beforeEach(async () => {
  await LocalDataService.purgeAllData();
  window.localStorage.clear();
});

describe('database schema', () => {
  it('is on version 2 with the toolRecords table and every v1 table', () => {
    expect(db.verno).toBe(2);
    const names = db.tables.map((t) => t.name).sort();
    expect(names).toEqual(
      ['appointments', 'checkins', 'customSymptoms', 'cycles', 'journal', 'settings', 'symptoms', 'toolRecords', 'treatmentEvents', 'treatments'].sort(),
    );
  });
});

describe('tool records (per-tool drafts and history)', () => {
  it('autosaves one draft per tool and keeps it across reads', async () => {
    await ToolRecords.saveDraft('stage-guide', { ageGroup: '45_plus' });
    await ToolRecords.saveDraft('stage-guide', { ageGroup: '40_to_44' });
    const draft = await ToolRecords.getDraft('stage-guide');
    expect(draft?.data).toEqual({ ageGroup: '40_to_44' });
    expect(await db.toolRecords.count()).toBe(1);
  });

  it('adds, lists newest first, edits and deletes dated entries', async () => {
    const a = await ToolRecords.addEntry('symptoms-checklist', '2026-03-01', { ticked: ['a'] });
    const b = await ToolRecords.addEntry('symptoms-checklist', '2026-05-01', { ticked: ['a', 'b'] }, 'Before GP visit');
    await ToolRecords.addEntry('stage-guide', '2026-06-01', {});

    let list = await ToolRecords.listEntries('symptoms-checklist');
    expect(list.map((e) => e.id)).toEqual([b.id, a.id]);
    expect(list[0].label).toBe('Before GP visit');

    await ToolRecords.updateEntry(a.id, { date: '2026-07-01', label: 'Moved', data: { ticked: ['c'] } });
    list = await ToolRecords.listEntries('symptoms-checklist');
    expect(list[0]).toMatchObject({ id: a.id, date: '2026-07-01', label: 'Moved', data: { ticked: ['c'] } });

    await ToolRecords.deleteEntry(b.id);
    expect((await ToolRecords.listEntries('symptoms-checklist')).length).toBe(1);
    expect((await ToolRecords.listEntries('stage-guide')).length).toBe(1);
  });

  it('rejects an invalid entry date', async () => {
    await expect(ToolRecords.addEntry('stage-guide', '06/01/2026', {})).rejects.toThrow();
  });
});

describe('period dates', () => {
  it('adds unique start dates, lists newest first, edits and removes', async () => {
    const p1 = await Periods.add('2026-01-10');
    await Periods.add('2026-03-02');
    expect(await Periods.add('2026-01-10')).toBeNull();
    expect((await Periods.list()).map((p) => p.startDate)).toEqual(['2026-03-02', '2026-01-10']);
    await Periods.update(p1!.id, { startDate: '2026-01-12' });
    await Periods.remove((await Periods.list())[0].id);
    expect((await Periods.list()).map((p) => p.startDate)).toEqual(['2026-01-12']);
    expect(daysBetween('2026-01-12', '2026-03-02')).toBe(49);
  });
});

describe('manage storage: delete oldest days and date ranges', () => {
  it('deletes the oldest 10 of 30 logged days and keeps the other 20', async () => {
    await logDays(30);
    const span = await oldestLoggedDays(['checkins'], 10);
    expect(span).toEqual({ from: day(0), to: day(9), days: 10 });

    const preview = await previewRange(['checkins'], span!);
    expect(preview.perCategory.checkins).toBe(10);
    expect(preview.symptomRatings).toBe(10);

    await deleteRange(['checkins'], span!);
    expect(await db.checkins.count()).toBe(20);
    expect(await db.symptoms.count()).toBe(20);
    expect((await loggedDays(['checkins']))[0]).toBe(day(10));
  });

  it('counts logged days, not calendar days, when she skipped days', async () => {
    await logDays(3, 0); // days 0-2
    await logDays(3, 20); // days 20-22
    const span = await oldestLoggedDays(['checkins'], 4);
    expect(span).toEqual({ from: day(0), to: day(20), days: 4 });
  });

  it('only touches the chosen categories and keeps treatment plans', async () => {
    await logDays(5);
    await LocalDataService.saveTreatment({
      id: 'trt1', name: 'Patch', type: 'patch', frequency: 'Twice weekly', startDate: day(0), active: true, createdAt: 1, updatedAt: 1,
    });
    await LocalDataService.logTreatmentEvent({ treatmentId: 'trt1', treatmentName: 'Patch', date: day(1), action: 'applied' });
    await ToolRecords.addEntry('symptoms-checklist', day(1), {});
    await ToolRecords.saveDraft('symptoms-checklist', { ticked: ['x'] });

    await deleteRange(['treatments', 'symptoms-checklist'], { from: day(0), to: day(4) });
    expect(await db.checkins.count()).toBe(5); // not chosen
    expect(await db.treatments.count()).toBe(1); // plans stay
    expect(await db.treatmentEvents.count()).toBe(0);
    expect(await ToolRecords.listEntries('symptoms-checklist')).toEqual([]);
    expect(await ToolRecords.getDraft('symptoms-checklist')).toBeDefined(); // current answers stay
  });

  it('rejects a reversed range', async () => {
    await expect(previewRange(['checkins'], { from: day(5), to: day(1) })).rejects.toThrow();
  });

  it('clears whole categories and everything', async () => {
    await logDays(2);
    await ToolRecords.saveDraft('stage-guide', {});
    await Periods.add('2026-01-01');
    window.localStorage.setItem('menowell_pinned_symptoms', '["a"]');
    window.localStorage.setItem('unrelated_key', 'keep');

    await clearCategories(['stage-guide']);
    expect(await db.toolRecords.count()).toBe(0);
    expect(await db.checkins.count()).toBe(2);

    expect((await summarizeCategory('periods')).records).toBe(1);
    await clearEverything();
    for (const t of db.tables) expect(await t.count()).toBe(0);
    expect(window.localStorage.getItem('menowell_pinned_symptoms')).toBeNull();
    expect(window.localStorage.getItem('unrelated_key')).toBe('keep');
  });

  it('flags low storage', () => {
    expect(isStorageLow({ supported: true, usage: 95, quota: 100, persisted: false })).toBe(true);
    expect(isStorageLow({ supported: true, usage: 10 * 1024 * 1024, quota: 2 * 1024 * 1024 * 1024, persisted: true })).toBe(false);
    expect(isStorageLow({ supported: false, usage: null, quota: null, persisted: null })).toBe(false);
  });
});

describe('backup and restore', () => {
  it('round-trips every table and app localStorage keys (replace)', async () => {
    await logDays(3);
    await ToolRecords.addEntry('treatment-questions', '2026-02-01', { selectedTopics: ['systemic_hrt'] });
    await Periods.add('2026-01-20');
    window.localStorage.setItem('menowell_pinned_symptoms', '["hot_flashes"]');

    const json = JSON.stringify(await createBackup());
    await clearEverything();

    const parsed = parseBackup(json);
    expect(parsed.counts).toMatchObject({ checkins: 3, symptoms: 3, toolRecords: 1, cycles: 1 });
    expect(parsed.skipped).toBe(0);

    await restoreBackup(parsed, 'replace');
    expect(await db.checkins.count()).toBe(3);
    expect((await ToolRecords.listEntries('treatment-questions'))[0].data).toEqual({ selectedTopics: ['systemic_hrt'] });
    expect(window.localStorage.getItem('menowell_pinned_symptoms')).toBe('["hot_flashes"]');
  });

  it('merges without duplicating a day, and keeps local-only records', async () => {
    await logDays(2); // day0, day1
    const backup = JSON.stringify(await createBackup());
    await clearEverything();
    await LocalDataService.saveCheckin({ date: day(1), overallFeeling: 5, symptoms: [] }); // different id, same day
    await LocalDataService.saveCheckin({ date: day(9), overallFeeling: 2, symptoms: [] }); // local only

    await restoreBackup(parseBackup(backup), 'merge');
    const all = await LocalDataService.getAllCheckins();
    expect(all.map((c) => c.date).sort()).toEqual([day(0), day(1), day(9)]);
    expect(all.find((c) => c.date === day(1))!.overallFeeling).toBe(3); // backup copy wins for that day
  });

  it('accepts the older formatVersion 1 export file', async () => {
    const v1 = {
      formatVersion: 1,
      app: 'MenoVerdict',
      exportedAt: '2026-10-01T00:00:00Z',
      data: {
        checkins: [{ id: 'chk_1', date: '2026-09-01', timestamp: 1, overallFeeling: 4, createdAt: 1, updatedAt: 1 }],
        symptoms: [], journal: [], customSymptoms: [], cycles: [], treatments: [], treatmentEvents: [], appointments: [], settings: [],
      },
    };
    const parsed = parseBackup(JSON.stringify(v1));
    expect(parsed.formatVersion).toBe(1);
    await restoreBackup(parsed, 'merge');
    expect((await LocalDataService.getCheckinByDate('2026-09-01'))?.overallFeeling).toBe(4);
  });

  it('skips malformed records and rejects files that are not backups', async () => {
    const bad = {
      formatVersion: 2,
      data: { checkins: [{ id: 'ok', date: '2026-09-01', timestamp: 1, overallFeeling: 3, createdAt: 1 }, { id: 'bad', date: 'yesterday' }] },
    };
    const parsed = parseBackup(JSON.stringify(bad));
    expect(parsed.counts.checkins).toBe(1);
    expect(parsed.skipped).toBe(1);

    expect(() => parseBackup('not json')).toThrow(/not a MenoVerdict backup/);
    expect(() => parseBackup(JSON.stringify({ hello: 'world' }))).toThrow(/not a MenoVerdict backup/);
    expect(() => parseBackup(JSON.stringify({ formatVersion: 2, data: {} }))).toThrow(/no records/);
  });
});

describe('legacy localStorage migration', () => {
  it('moves old tool answers into IndexedDB once, and the old period date into period history', async () => {
    window.localStorage.setItem('menoverdict_stage_guide_v1', JSON.stringify({ ageGroup: '45_plus' }));
    window.localStorage.setItem('menoverdict_12_month_counter_v1', JSON.stringify({ lastPeriodDate: '2026-02-03', redFlags: [] }));
    await migrateLegacyToolStorage();
    expect((await ToolRecords.getDraft('stage-guide'))?.data).toEqual({ ageGroup: '45_plus' });
    expect((await Periods.list()).map((p) => p.startDate)).toEqual(['2026-02-03']);
    expect(window.localStorage.getItem('menoverdict_stage_guide_v1')).toBeNull();
    expect(window.localStorage.getItem('menoverdict_12_month_counter_v1')).toBeNull();
  });
});

describe('storage errors', () => {
  it('explains a full disk and blocked storage in plain words', () => {
    const quota = Object.assign(new Error('x'), { name: 'AbortError', inner: { name: 'QuotaExceededError' } });
    expect(classifyStorageError(quota)).toBe('quota');
    expect(describeStorageError(quota)).toMatch(/out of storage space/);
    expect(classifyStorageError({ name: 'InvalidStateError' })).toBe('blocked');
    expect(classifyStorageError(new Error('nope'))).toBe('unknown');
  });
});
