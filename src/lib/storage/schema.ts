// Storage Schema Definitions — Contract for Phase 2 IndexedDB (Dexie.js)

export type SeverityLevel = 1 | 2 | 3 | 4 | 5; // 1 = Very Mild, 5 = Severe

export type OverallFeeling = 1 | 2 | 3 | 4 | 5; // 1 = Very Difficult, 5 = Thriving / Good

export interface SymptomEntry {
  id: string;
  checkinId: string;
  symptomId: string;
  name: string;
  category: string;
  severity: SeverityLevel;
  notes?: string;
  timestamp: number;
  date: string; // YYYY-MM-DD
}

export interface DailyCheckin {
  id: string;
  date: string; // YYYY-MM-DD
  timestamp: number;
  overallFeeling: OverallFeeling;
  symptoms: SymptomEntry[];
  notes?: string;
  sleepHours?: number;
  sleepQuality?: 1 | 2 | 3 | 4 | 5;
  hotFlashCount?: number;
  createdAt: number;
  updatedAt: number;
}

export interface Treatment {
  id: string;
  name: string;
  type: 'hrt_patch' | 'hrt_gel' | 'oral_tablet' | 'cream' | 'supplement' | 'lifestyle' | 'other';
  dosage?: string;
  frequency: string; // e.g. 'Daily', 'Twice Weekly', 'Continuous'
  startDate: string; // YYYY-MM-DD
  endDate?: string;
  instructions?: string;
  reminderTime?: string; // HH:mm
  active: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface TreatmentLogEvent {
  id: string;
  treatmentId: string;
  treatmentName: string;
  date: string;
  timestamp: number;
  action: 'applied' | 'taken' | 'changed' | 'skipped';
  notes?: string;
}

export interface UserPreferences {
  storageMode: 'device_only' | 'temporary_cloud' | 'persistent_cloud';
  retentionDays: number;
  retentionStartedAt?: string;
  aiConsentMode: 'always_ask' | 'allow' | 'never';
  notificationsEnabled: boolean;
  theme: 'system' | 'light' | 'dark';
  hasCompletedOnboarding: boolean;
}
