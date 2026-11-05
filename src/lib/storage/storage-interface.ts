import { DailyCheckin, Treatment, TreatmentLogEvent, UserPreferences } from './schema';

/**
 * StorageAdapter interface defining the contract that Phase 2 IndexedDB (Dexie)
 * and Phase 5 Cloud Sync will adhere to.
 */
export interface HealthDataStorage {
  // Checkins
  saveCheckin(checkin: DailyCheckin): Promise<void>;
  getCheckinByDate(date: string): Promise<DailyCheckin | null>;
  getCheckinsRange(startDate: string, endDate: string): Promise<DailyCheckin[]>;
  getAllCheckins(): Promise<DailyCheckin[]>;
  deleteCheckin(id: string): Promise<void>;

  // Treatments
  saveTreatment(treatment: Treatment): Promise<void>;
  getTreatments(onlyActive?: boolean): Promise<Treatment[]>;
  logTreatmentEvent(event: TreatmentLogEvent): Promise<void>;
  getTreatmentEvents(startDate: string, endDate: string): Promise<TreatmentLogEvent[]>;

  // Preferences & Privacy Settings
  getPreferences(): Promise<UserPreferences>;
  savePreferences(prefs: Partial<UserPreferences>): Promise<void>;

  // Export & Deletion
  exportAllData(): Promise<string>; // JSON dump
  clearAllLocalData(): Promise<void>; // Destructive local purge
}
