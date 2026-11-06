// Database Schema for Dexie.js (IndexedDB)
// Local-First Data Layer for MenoWell

export type SeverityLevel = 1 | 2 | 3 | 4 | 5; // 1 = Very Mild, 5 = Severe
export type OverallFeelingLevel = 1 | 2 | 3 | 4 | 5; // 1 = Very Rough, 5 = Thriving
export type FlowLevel = 'none' | 'spotting' | 'light' | 'medium' | 'heavy';

export interface LocalCheckin {
  id: string;
  date: string; // YYYY-MM-DD
  timestamp: number;
  overallFeeling: OverallFeelingLevel;
  /** 1 = this day only (default); 7 = a weekly entry summarising the past 7 days. */
  coversDays?: 1 | 7;
  notes?: string;
  sleepHours?: number;
  sleepQuality?: 1 | 2 | 3 | 4 | 5;
  wokeAtNight?: boolean;
  hotFlashCount?: number;
  flow?: FlowLevel;
  lifestyle?: {
    caffeine?: boolean;
    alcohol?: boolean;
    exercise?: boolean;
  };
  createdAt: number;
  updatedAt: number;
}

export interface LocalSymptomEntry {
  id: string;
  checkinId: string;
  date: string; // YYYY-MM-DD
  symptomId: string;
  name: string;
  category: string;
  severity: SeverityLevel;
  notes?: string;
  timestamp: number;
}

export interface LocalJournalEntry {
  id: string;
  date: string; // YYYY-MM-DD
  content: string;
  mood?: number;
  tags?: string[];
  createdAt: number;
  updatedAt: number;
}

export interface LocalCustomSymptom {
  id: string;
  name: string;
  category: string;
  categoryLabel: string;
  createdAt: number;
}

export interface LocalCycleEntry {
  id: string;
  startDate: string; // YYYY-MM-DD
  endDate?: string;
  flow: FlowLevel;
  notes?: string;
  createdAt: number;
}

export type TreatmentType =
  | 'patch'
  | 'gel'
  | 'cream'
  | 'oral'
  | 'supplement'
  | 'other'
  | 'hrt_patch'
  | 'hrt_gel'
  | 'oral_tablet'
  | 'lifestyle';

export type TreatmentAction = 'applied' | 'taken' | 'changed' | 'skipped' | 'snoozed';

export interface LocalTreatment {
  id: string;
  name: string;
  type: TreatmentType;
  dosage?: string;
  frequency: string;
  scheduleDays?: number[]; // 0 = Sunday, 1 = Monday, etc.
  startDate: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  instructions?: string;
  notes?: string;
  reminderEnabled?: boolean;
  reminderTime?: string; // HH:MM
  defaultSite?: string;
  active: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface LocalTreatmentEvent {
  id: string;
  treatmentId: string;
  treatmentName: string;
  date: string; // YYYY-MM-DD
  timestamp: number;
  action: TreatmentAction;
  site?: string;
  snoozeUntil?: number;
  notes?: string;
}

export interface LocalAppointment {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  provider?: string;
  notes?: string;
  preparedQuestions?: string[];
  createdAt: number;
  updatedAt: number;
}

export interface LocalSettingItem {
  key: string;
  value: unknown;
  updatedAt: number;
}
