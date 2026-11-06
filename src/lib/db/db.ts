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
  LocalToolRecord,
} from './schema';

export const DB_NAME = 'menowell_local_db';

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
  toolRecords!: EntityTable<LocalToolRecord, 'id'>;

  constructor() {
    super(DB_NAME);

    /*
     * Migration rules (her data must survive every app update):
     *  - Never edit or delete an existing version block; add a new one.
     *  - Never drop a table or rename a primary key. Adding tables/indexes is safe.
     *  - If a new version reshapes records, do it in .upgrade() so it runs
     *    once, inside IndexedDB's upgrade transaction, before any read.
     */
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

    // v2: saved answers and history for the public /tools/ pages (previously
    // a single overwritten localStorage value per tool, with no history).
    this.version(2).stores({
      toolRecords: 'id, tool, kind, date, updatedAt, [tool+kind]',
    });
  }
}

// Global singleton instance for client-side usage
export const db = new MenoWellDatabase();
