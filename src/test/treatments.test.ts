import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../lib/db/db';
import { LocalDataService } from '../lib/db/service';
import { LocalTreatment } from '../lib/db/schema';

describe('Phase 3: Treatments & HRT Regimen Management', () => {
  beforeEach(async () => {
    await db.treatments.clear();
    await db.treatmentEvents.clear();
  });

  it('records treatments across multiple types with optional dosage and instructions', async () => {
    const patch: LocalTreatment = {
      id: 'trt_estradiol',
      name: 'Estradiol Transdermal Patch',
      type: 'patch',
      dosage: '0.05 mg/day',
      frequency: 'Twice weekly (Mon & Thu)',
      scheduleDays: [1, 4],
      instructions: 'Rotate site on lower abdomen; avoid waistline',
      notes: 'Prescribed by Dr. Miller',
      defaultSite: 'Lower abdomen — Left',
      reminderEnabled: true,
      reminderTime: '08:00',
      startDate: '2026-09-01',
      active: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const oral: LocalTreatment = {
      id: 'trt_progesterone',
      name: 'Micronized Progesterone',
      type: 'oral',
      dosage: '100 mg',
      frequency: 'Nightly',
      instructions: 'Take at bedtime with water',
      startDate: '2026-09-01',
      active: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const supplement: LocalTreatment = {
      id: 'trt_magnesium',
      name: 'Magnesium Glycinate',
      type: 'supplement',
      dosage: '300 mg',
      frequency: 'Nightly',
      startDate: '2026-09-10',
      active: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await LocalDataService.saveTreatment(patch);
    await LocalDataService.saveTreatment(oral);
    await LocalDataService.saveTreatment(supplement);

    const activeList = await LocalDataService.getTreatments(true);
    expect(activeList.length).toBe(3);

    const retrievedPatch = await LocalDataService.getTreatmentById('trt_estradiol');
    expect(retrievedPatch?.name).toBe('Estradiol Transdermal Patch');
    expect(retrievedPatch?.dosage).toBe('0.05 mg/day');
    expect(retrievedPatch?.defaultSite).toBe('Lower abdomen — Left');
    expect(retrievedPatch?.scheduleDays).toEqual([1, 4]);
  });

  it('logs treatment actions including applied, changed, skipped, and snoozed with site rotation', async () => {
    const patchId = 'trt_patch_1';

    // 1. Log patch changed with application site
    await LocalDataService.logTreatmentEvent({
      treatmentId: patchId,
      treatmentName: 'Estradiol Patch',
      date: '2026-09-15',
      action: 'changed',
      site: 'Lower abdomen — Right',
      notes: 'New patch placed after bath',
    });

    // 2. Log skipped
    await LocalDataService.logTreatmentEvent({
      treatmentId: 'trt_progesterone',
      treatmentName: 'Micronized Progesterone',
      date: '2026-09-15',
      action: 'skipped',
      notes: 'Fell asleep early',
    });

    // 3. Log snoozed
    const snoozeTime = Date.now() + 3600000;
    await LocalDataService.logTreatmentEvent({
      treatmentId: patchId,
      treatmentName: 'Estradiol Patch',
      date: '2026-09-18',
      action: 'snoozed',
      snoozeUntil: snoozeTime,
    });

    const allEvents = await LocalDataService.getTreatmentEvents();
    expect(allEvents.length).toBe(3);

    const patchEvents = await LocalDataService.getTreatmentEventsByTreatment(patchId);
    expect(patchEvents.length).toBe(2);
    expect(patchEvents.some((e) => e.site === 'Lower abdomen — Right')).toBe(true);
    expect(patchEvents.some((e) => e.action === 'snoozed')).toBe(true);
  });

  it('deletes a treatment and cascades deletion of its recorded events', async () => {
    const trt: LocalTreatment = {
      id: 'trt_to_delete',
      name: 'Temporary Gel',
      type: 'gel',
      frequency: 'Daily',
      startDate: '2026-09-01',
      active: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await LocalDataService.saveTreatment(trt);
    await LocalDataService.logTreatmentEvent({
      treatmentId: 'trt_to_delete',
      treatmentName: 'Temporary Gel',
      date: '2026-09-02',
      action: 'applied',
    });

    let trtRecord = await LocalDataService.getTreatmentById('trt_to_delete');
    expect(trtRecord).toBeDefined();

    await LocalDataService.deleteTreatment('trt_to_delete');

    trtRecord = await LocalDataService.getTreatmentById('trt_to_delete');
    expect(trtRecord).toBeUndefined();

    const events = await LocalDataService.getTreatmentEventsByTreatment('trt_to_delete');
    expect(events.length).toBe(0);
  });
});
