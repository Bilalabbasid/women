export interface SymptomDefinition {
  id: string;
  name: string;
  category: 'vasomotor' | 'sleep' | 'mood' | 'cognitive' | 'physical' | 'cycle' | 'genitourinary' | 'custom';
  categoryLabel: string;
  description?: string;
  defaultSeverity?: number;
}

export const SYMPTOM_CATEGORIES = [
  { id: 'vasomotor', label: 'Vasomotor & Temperature', icon: 'Flame' },
  { id: 'sleep', label: 'Sleep & Night Recovery', icon: 'Moon' },
  { id: 'cognitive', label: 'Brain Fog & Focus', icon: 'Brain' },
  { id: 'mood', label: 'Mood & Emotional State', icon: 'Smile' },
  { id: 'physical', label: 'Joints, Body & Head', icon: 'Activity' },
  { id: 'cycle', label: 'Cycle & Bleeding Patterns', icon: 'Calendar' },
  { id: 'genitourinary', label: 'Genitourinary & Pelvic', icon: 'Heart' },
] as const;

export const STANDARD_SYMPTOMS: SymptomDefinition[] = [
  // Vasomotor
  { id: 'hot_flashes', name: 'Hot Flashes', category: 'vasomotor', categoryLabel: 'Vasomotor & Temperature' },
  { id: 'night_sweats', name: 'Night Sweats', category: 'vasomotor', categoryLabel: 'Vasomotor & Temperature' },
  { id: 'chills_flushes', name: 'Cold Chills / Flushing', category: 'vasomotor', categoryLabel: 'Vasomotor & Temperature' },

  // Sleep
  { id: 'waking_early', name: 'Night Waking (2–4 AM)', category: 'sleep', categoryLabel: 'Sleep & Night Recovery' },
  { id: 'trouble_sleeping', name: 'Difficulty Falling Asleep', category: 'sleep', categoryLabel: 'Sleep & Night Recovery' },
  { id: 'unrefreshing_sleep', name: 'Unrefreshing Sleep', category: 'sleep', categoryLabel: 'Sleep & Night Recovery' },

  // Cognitive
  { id: 'brain_fog', name: 'Brain Fog', category: 'cognitive', categoryLabel: 'Brain Fog & Focus' },
  { id: 'word_recall', name: 'Word-Finding Difficulty', category: 'cognitive', categoryLabel: 'Brain Fog & Focus' },
  { id: 'concentration', name: 'Attention & Focus Fatigue', category: 'cognitive', categoryLabel: 'Brain Fog & Focus' },

  // Mood
  { id: 'anxiety_rush', name: 'Sudden Anxiety / Unease', category: 'mood', categoryLabel: 'Mood & Emotional State' },
  { id: 'irritability', name: 'Heightened Irritability', category: 'mood', categoryLabel: 'Mood & Emotional State' },
  { id: 'low_mood', name: 'Low Mood / Flatness', category: 'mood', categoryLabel: 'Mood & Emotional State' },

  // Physical
  { id: 'headache', name: 'Headache or Migraine', category: 'physical', categoryLabel: 'Joints, Body & Head' },
  { id: 'joint_stiffness', name: 'Joint Aches / Stiffness', category: 'physical', categoryLabel: 'Joints, Body & Head' },
  { id: 'fatigue', name: 'Heavy Daytime Fatigue', category: 'physical', categoryLabel: 'Joints, Body & Head' },
  { id: 'palpitations', name: 'Heart Palpitations (Resting)', category: 'physical', categoryLabel: 'Joints, Body & Head' },

  // Cycle
  { id: 'cycle_irregular', name: 'Irregular Cycle Length', category: 'cycle', categoryLabel: 'Cycle & Bleeding Patterns' },
  { id: 'heavy_flow', name: 'Heavier Than Usual Flow', category: 'cycle', categoryLabel: 'Cycle & Bleeding Patterns' },
  { id: 'spotting', name: 'Mid-Cycle Spotting', category: 'cycle', categoryLabel: 'Cycle & Bleeding Patterns' },

  // Genitourinary
  { id: 'vaginal_dryness', name: 'Vaginal Dryness / Irritation', category: 'genitourinary', categoryLabel: 'Genitourinary & Pelvic' },
  { id: 'urinary_urgency', name: 'Urinary Urgency / Frequency', category: 'genitourinary', categoryLabel: 'Genitourinary & Pelvic' },
];
