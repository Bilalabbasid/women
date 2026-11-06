import { db } from './db';
import { newId } from '../utils/id';
import {
  LocalCheckin,
  LocalSymptomEntry,
  LocalCustomSymptom,
  LocalTreatment,
  LocalTreatmentEvent,
  LocalCycleEntry,
  SeverityLevel,
} from './schema';

export interface CheckinInput {
  date: string; // YYYY-MM-DD
  overallFeeling: 1 | 2 | 3 | 4 | 5;
  /** 1 = one day (default); 7 = the past 7 days. */
  coversDays?: 1 | 7;
  notes?: string;
  sleepHours?: number;
  sleepQuality?: 1 | 2 | 3 | 4 | 5;
  wokeAtNight?: boolean;
  hotFlashCount?: number;
  flow?: 'none' | 'spotting' | 'light' | 'medium' | 'heavy';
  lifestyle?: {
    caffeine?: boolean;
    alcohol?: boolean;
    exercise?: boolean;
  };
  symptoms: Array<{
    symptomId: string;
    name: string;
    category: string;
    severity: SeverityLevel;
    notes?: string;
  }>;
}

export const LocalDataService = {
  // Checkins & Symptoms
  async saveCheckin(input: CheckinInput): Promise<string> {
    const existing = await db.checkins.where('date').equals(input.date).first();
    const checkinId = existing ? existing.id : newId('chk');
    const now = Date.now();

    await db.transaction('rw', db.checkins, db.symptoms, async () => {
      // 1. Delete previous symptoms for this checkin if editing
      if (existing) {
        await db.symptoms.where('checkinId').equals(checkinId).delete();
      }

      // 2. Put checkin record
      const checkinRecord: LocalCheckin = {
        id: checkinId,
        date: input.date,
        timestamp: now,
        overallFeeling: input.overallFeeling,
        coversDays: input.coversDays ?? 1,
        notes: input.notes,
        sleepHours: input.sleepHours,
        sleepQuality: input.sleepQuality,
        wokeAtNight: input.wokeAtNight,
        hotFlashCount: input.hotFlashCount,
        flow: input.flow,
        lifestyle: input.lifestyle,
        createdAt: existing ? existing.createdAt : now,
        updatedAt: now,
      };

      await db.checkins.put(checkinRecord);

      // 3. Put symptom records
      const symptomRecords: LocalSymptomEntry[] = input.symptoms.map((s, idx) => ({
        id: `sym_${checkinId}_${idx}_${s.symptomId}`,
        checkinId,
        date: input.date,
        symptomId: s.symptomId,
        name: s.name,
        category: s.category,
        severity: s.severity,
        notes: s.notes,
        timestamp: now,
      }));

      if (symptomRecords.length > 0) {
        await db.symptoms.bulkPut(symptomRecords);
      }
    });

    return checkinId;
  },

  async getCheckinByDate(date: string) {
    const checkin = await db.checkins.where('date').equals(date).first();
    if (!checkin) return null;
    const symptoms = await db.symptoms.where('checkinId').equals(checkin.id).toArray();
    return { ...checkin, symptoms };
  },

  async getAllCheckins() {
    const checkins = await db.checkins.orderBy('date').reverse().toArray();
    const symptoms = await db.symptoms.toArray();
    return checkins.map((c) => ({
      ...c,
      symptoms: symptoms.filter((s) => s.checkinId === c.id),
    }));
  },

  async getCheckinsForRange(startDate: string, endDate: string) {
    const checkins = await db.checkins
      .where('date')
      .between(startDate, endDate, true, true)
      .reverse()
      .toArray();

    const symptoms = await db.symptoms
      .where('date')
      .between(startDate, endDate, true, true)
      .toArray();

    return checkins.map((c) => ({
      ...c,
      symptoms: symptoms.filter((s) => s.checkinId === c.id),
    }));
  },

  async deleteCheckin(id: string): Promise<void> {
    await db.transaction('rw', db.checkins, db.symptoms, async () => {
      await db.symptoms.where('checkinId').equals(id).delete();
      await db.checkins.delete(id);
    });
  },

  // Custom Symptoms
  async getCustomSymptoms(): Promise<LocalCustomSymptom[]> {
    return await db.customSymptoms.toArray();
  },

  async addCustomSymptom(name: string, category = 'custom', categoryLabel = 'Custom Symptom'): Promise<LocalCustomSymptom> {
    const record: LocalCustomSymptom = {
      id: newId('custom'),
      name: name.trim(),
      category,
      categoryLabel,
      createdAt: Date.now(),
    };
    await db.customSymptoms.put(record);
    return record;
  },

  async deleteCustomSymptom(id: string): Promise<void> {
    await db.customSymptoms.delete(id);
  },

  // Treatments & Events
  async getTreatments(activeOnly = false): Promise<LocalTreatment[]> {
    if (activeOnly) {
      return await db.treatments.filter((t) => t.active).toArray();
    }
    return await db.treatments.toArray();
  },

  async getTreatmentById(id: string): Promise<LocalTreatment | undefined> {
    return await db.treatments.get(id);
  },

  async saveTreatment(treatment: LocalTreatment): Promise<void> {
    await db.treatments.put(treatment);
  },

  async deleteTreatment(id: string): Promise<void> {
    await db.transaction('rw', db.treatments, db.treatmentEvents, async () => {
      await db.treatmentEvents.where('treatmentId').equals(id).delete();
      await db.treatments.delete(id);
    });
  },

  async logTreatmentEvent(event: Omit<LocalTreatmentEvent, 'id' | 'timestamp'>): Promise<string> {
    const id = newId('te');
    await db.treatmentEvents.put({
      ...event,
      id,
      timestamp: Date.now(),
    });
    return id;
  },

  async deleteTreatmentEvent(id: string): Promise<void> {
    await db.treatmentEvents.delete(id);
  },

  async getTreatmentEvents(startDate?: string, endDate?: string): Promise<LocalTreatmentEvent[]> {
    if (startDate && endDate) {
      return await db.treatmentEvents
        .where('date')
        .between(startDate, endDate, true, true)
        .reverse()
        .toArray();
    }
    return await db.treatmentEvents.orderBy('date').reverse().toArray();
  },

  async getTreatmentEventsByTreatment(treatmentId: string): Promise<LocalTreatmentEvent[]> {
    return await db.treatmentEvents.where('treatmentId').equals(treatmentId).reverse().toArray();
  },

  // Cycles
  async getCycles(): Promise<LocalCycleEntry[]> {
    return await db.cycles.orderBy('startDate').reverse().toArray();
  },

  async saveCycle(cycle: LocalCycleEntry): Promise<void> {
    await db.cycles.put(cycle);
  },

  // Settings
  async getSetting<T>(key: string, defaultValue: T): Promise<T> {
    const item = await db.settings.get(key);
    if (!item) return defaultValue;
    return item.value as T;
  },

  async setSetting(key: string, value: unknown): Promise<void> {
    await db.settings.put({
      key,
      value,
      updatedAt: Date.now(),
    });
  },

  // Full Database Purge
  async purgeAllData(): Promise<void> {
    await db.transaction(
      'rw',
      [
        db.checkins,
        db.symptoms,
        db.journal,
        db.customSymptoms,
        db.cycles,
        db.treatments,
        db.treatmentEvents,
        db.appointments,
        db.settings,
      ],
      async () => {
        await Promise.all([
          db.checkins.clear(),
          db.symptoms.clear(),
          db.journal.clear(),
          db.customSymptoms.clear(),
          db.cycles.clear(),
          db.treatments.clear(),
          db.treatmentEvents.clear(),
          db.appointments.clear(),
          db.settings.clear(),
        ]);
      }
    );
  },

  // Sample data for automated tests ONLY. Never call from UI: it writes a sample
  // HRT regimen (with doses) into the real journal, which would then appear in
  // the user's doctor report. See DECISIONS.md D-006.
  async seedDemoDataIfEmpty(): Promise<boolean> {
    const count = await db.checkins.count();
    if (count > 0) return false;

    // Seed treatments
    const initialTreatments: LocalTreatment[] = [
      {
        id: 'trt_estradiol_patch',
        name: 'Estradiol Transdermal Patch',
        type: 'hrt_patch',
        dosage: '0.05 mg/day',
        frequency: 'Twice Weekly (Mon & Thu)',
        startDate: '2026-08-15',
        instructions: 'Apply to lower abdomen. Rotate site.',
        reminderTime: '08:00',
        active: true,
        createdAt: Date.now() - 50 * 86400000,
        updatedAt: Date.now() - 50 * 86400000,
      },
      {
        id: 'trt_progesterone',
        name: 'Micronized Progesterone',
        type: 'oral_tablet',
        dosage: '100 mg',
        frequency: 'Nightly at bedtime',
        startDate: '2026-08-15',
        instructions: 'Take 30 mins before sleep.',
        reminderTime: '21:30',
        active: true,
        createdAt: Date.now() - 50 * 86400000,
        updatedAt: Date.now() - 50 * 86400000,
      },
    ];
    await db.treatments.bulkPut(initialTreatments);

    // Seed recent days checkins
    const sampleDates = [
      {
        offset: 1,
        feeling: 3,
        hotFlashes: 3,
        sleep: 6.2,
        woke: true,
        notes: 'Woke at 3:15 AM sweating. Took about 45 mins to fall back asleep. Patch day went smoothly.',
        symptoms: [
          { symptomId: 'hot_flashes', name: 'Hot Flashes', category: 'vasomotor', severity: 3 as SeverityLevel },
          { symptomId: 'waking_early', name: 'Night Waking (2–4 AM)', category: 'sleep', severity: 4 as SeverityLevel },
          { symptomId: 'brain_fog', name: 'Brain Fog', category: 'cognitive', severity: 2 as SeverityLevel },
        ],
      },
      {
        offset: 2,
        feeling: 4,
        hotFlashes: 1,
        sleep: 7.5,
        woke: false,
        notes: 'Good restorative sleep. Energy was steady through the afternoon.',
        symptoms: [
          { symptomId: 'joint_stiffness', name: 'Joint Aches / Stiffness', category: 'physical', severity: 2 as SeverityLevel },
        ],
      },
      {
        offset: 3,
        feeling: 2,
        hotFlashes: 4,
        sleep: 5.5,
        woke: true,
        notes: 'Busy work day. Headache started around 2 PM.',
        symptoms: [
          { symptomId: 'hot_flashes', name: 'Hot Flashes', category: 'vasomotor', severity: 4 as SeverityLevel },
          { symptomId: 'headache', name: 'Headache or Migraine', category: 'physical', severity: 3 as SeverityLevel },
          { symptomId: 'anxiety_rush', name: 'Sudden Anxiety / Unease', category: 'mood', severity: 3 as SeverityLevel },
        ],
      },
    ];

    for (const s of sampleDates) {
      const dateStr = new Date(Date.now() - s.offset * 86400000).toISOString().split('T')[0];
      await this.saveCheckin({
        date: dateStr,
        overallFeeling: s.feeling as 1 | 2 | 3 | 4 | 5,
        notes: s.notes,
        sleepHours: s.sleep,
        wokeAtNight: s.woke,
        hotFlashCount: s.hotFlashes,
        symptoms: s.symptoms,
      });
    }

    return true;
  },
};
