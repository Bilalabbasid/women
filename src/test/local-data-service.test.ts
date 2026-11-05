import { describe, it, expect, beforeEach } from 'vitest';
import { LocalDataService } from '@/lib/db/service';
import { db } from '@/lib/db/db';

describe('LocalDataService (IndexedDB via Dexie)', () => {
  beforeEach(async () => {
    await LocalDataService.purgeAllData();
  });

  it('saves a check-in with symptoms into IndexedDB', async () => {
    const id = await LocalDataService.saveCheckin({
      date: '2026-10-03',
      overallFeeling: 4,
      notes: 'Calm morning, rested well.',
      sleepHours: 7.5,
      wokeAtNight: false,
      hotFlashCount: 1,
      symptoms: [
        {
          symptomId: 'hot_flashes',
          name: 'Hot Flashes',
          category: 'vasomotor',
          severity: 2,
        },
      ],
    });

    expect(id).toBeDefined();

    const retrieved = await LocalDataService.getCheckinByDate('2026-10-03');
    expect(retrieved).not.toBeNull();
    expect(retrieved!.overallFeeling).toBe(4);
    expect(retrieved!.notes).toBe('Calm morning, rested well.');
    expect(retrieved!.symptoms.length).toBe(1);
    expect(retrieved!.symptoms[0].severity).toBe(2);
  });

  it('updates an existing check-in when saved for the same date', async () => {
    await LocalDataService.saveCheckin({
      date: '2026-10-03',
      overallFeeling: 3,
      symptoms: [],
    });

    // Update with new feeling and notes
    await LocalDataService.saveCheckin({
      date: '2026-10-03',
      overallFeeling: 5,
      notes: 'Updated evening notes.',
      symptoms: [
        {
          symptomId: 'joint_stiffness',
          name: 'Joint Aches',
          category: 'physical',
          severity: 1,
        },
      ],
    });

    const checkins = await LocalDataService.getAllCheckins();
    expect(checkins.length).toBe(1);
    expect(checkins[0].overallFeeling).toBe(5);
    expect(checkins[0].notes).toBe('Updated evening notes.');
    expect(checkins[0].symptoms.length).toBe(1);
  });

  it('manages custom symptoms properly', async () => {
    const custom = await LocalDataService.addCustomSymptom('Tingling Sensation');
    expect(custom.name).toBe('Tingling Sensation');

    const list = await LocalDataService.getCustomSymptoms();
    expect(list.length).toBe(1);
    expect(list[0].name).toBe('Tingling Sensation');

    await LocalDataService.deleteCustomSymptom(custom.id);
    const updatedList = await LocalDataService.getCustomSymptoms();
    expect(updatedList.length).toBe(0);
  });

  it('performs clean and complete local data purge', async () => {
    await LocalDataService.saveCheckin({
      date: '2026-10-01',
      overallFeeling: 3,
      symptoms: [
        {
          symptomId: 'hot_flashes',
          name: 'Hot Flashes',
          category: 'vasomotor',
          severity: 3,
        },
      ],
    });

    await LocalDataService.addCustomSymptom('Night restlessness');

    expect(await db.checkins.count()).toBe(1);
    expect(await db.symptoms.count()).toBe(1);
    expect(await db.customSymptoms.count()).toBe(1);

    // Hard purge
    await LocalDataService.purgeAllData();

    expect(await db.checkins.count()).toBe(0);
    expect(await db.symptoms.count()).toBe(0);
    expect(await db.customSymptoms.count()).toBe(0);
  });
});
