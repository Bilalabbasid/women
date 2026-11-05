import Dexie, { type EntityTable } from 'dexie';
import {
  LocalCheckin,
  LocalSymptomEntry,
  LocalJournalEntry,
  LocalCustomSymptom,
  LocalCycleEntry,
  LocalTreatment,
  LocalTreatmentEvent,
  LocalAppointment,
  LocalSettingItem,
} from './schema';

export class MenoWellDatabase extends Dexie {
  checkins!: EntityTable<LocalCheckin, 'id'>;
  symptoms!: EntityTable<LocalSymptomEntry, 'id'>;
  journal!: EntityTable<LocalJournalEntry, 'id'>;
  customSymptoms!: EntityTable<LocalCustomSymptom, 'id'>;
  cycles!: EntityTable<LocalCycleEntry, 'id'>;
  treatments!: EntityTable<LocalTreatment, 'id'>;
  treatmentEvents!: EntityTable<LocalTreatmentEvent, 'id'>;
  appointments!: EntityTable<LocalAppointment, 'id'>;
  settings!: EntityTable<LocalSettingItem, 'key'>;

  constructor() {
    super('menowell_local_db');

    // Schema Version 1
    this.version(1).stores({
      checkins: 'id, date, timestamp, overallFeeling, createdAt',
      symptoms: 'id, checkinId, date, symptomId, category, severity, timestamp',
      journal: 'id, date, createdAt',
      customSymptoms: 'id, name, category, createdAt',
      cycles: 'id, startDate, endDate, flow, createdAt',
      treatments: 'id, name, type, active, startDate, createdAt',
      treatmentEvents: 'id, treatmentId, date, timestamp, action',
      appointments: 'id, date, createdAt',
      settings: 'key, updatedAt',
    });
  }
}

// Global singleton instance for client-side usage
export const db = new MenoWellDatabase();
