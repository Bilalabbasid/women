/**
 * URGENT TRIGGERS: the single, clinician-reviewable source of truth for when
 * the tracker shows urgent guidance.
 *
 * Rules (AGENTS.md "Tool safety"):
 *  - When a trigger applies, its guidance is shown before anything else.
 *  - No commercial content may appear anywhere a trigger's guidance shows.
 *  - Thoughts of self-harm always show crisis resources for the reader's country.
 *  - Evaluation runs entirely on the device. Inputs are never sent anywhere.
 *
 * REVIEW STATUS: draft. Every message below must be approved by the named
 * clinical reviewer before launch. Wording was checked against the sources
 * listed on each trigger (accessed 2026-11-06). The US emergency wording
 * ("911 / emergency room") is our adaptation of NHS "999 / A&E" guidance and
 * needs explicit clinician sign-off (content/_review/unverified-claims.md).
 */

export type Locale = 'en-US' | 'en-GB';

export interface CrisisResource {
  name: string;
  how: string;
  url: string;
  sourceAccessed: string;
}

/** Crisis resources by locale. Verified against each organisation's own site. */
export const CRISIS_RESOURCES: Record<Locale, { emergency: string; resources: CrisisResource[] }> = {
  'en-US': {
    emergency: 'If you are in immediate danger, call 911.',
    resources: [
      {
        name: '988 Suicide & Crisis Lifeline',
        how: 'Call or text 988, or chat online. Free, confidential, 24/7.',
        url: 'https://988lifeline.org/',
        sourceAccessed: '2026-11-06',
      },
    ],
  },
  'en-GB': {
    emergency: 'If you are in immediate danger, call 999.',
    resources: [
      {
        name: 'Samaritans',
        how: 'Call 116 123, free from any phone, any time, day or night.',
        url: 'https://www.samaritans.org/how-we-can-help/contact-samaritan/',
        sourceAccessed: '2026-11-06',
      },
    ],
  },
};

export type TriggerLevel = 'crisis' | 'emergency' | 'see_doctor';

export interface UrgentTrigger {
  id: string;
  level: TriggerLevel;
  title: string;
  /** Plain-language guidance. Never diagnostic ("should be checked", not "you have"). */
  message: Record<Locale, string>;
  sources: string[];
  reviewStatus: 'draft' | 'clinician_approved';
}

export const URGENT_TRIGGERS: readonly UrgentTrigger[] = [
  {
    id: 'self_harm_thoughts',
    level: 'crisis',
    title: 'If you are thinking about harming yourself',
    message: {
      'en-US': 'You deserve support right now. You can talk to someone today, for free and in confidence.',
      'en-GB': 'You deserve support right now. You can talk to someone today, for free and in confidence.',
    },
    sources: ['https://988lifeline.org/', 'https://www.samaritans.org/how-we-can-help/contact-samaritan/'],
    reviewStatus: 'draft',
  },
  {
    id: 'palpitations_red_flags',
    level: 'emergency',
    title: 'Palpitations with chest pain, breathlessness or fainting',
    message: {
      'en-US':
        'If palpitations are happening now and do not go away, or they come with chest pain, shortness of breath, or feeling faint or fainting, call 911 or go to the emergency room. If those symptoms happened but have stopped, ask for an urgent appointment today.',
      'en-GB':
        'If palpitations are happening now and do not go away, or they come with chest pain, shortness of breath, or feeling faint or fainting, call 999 or go to A&E. If those symptoms happened but have stopped, ask your GP surgery for an urgent appointment or call 111.',
    },
    sources: ['https://www.nhs.uk/conditions/heart-palpitations/'],
    reviewStatus: 'draft',
  },
  {
    id: 'bleeding_after_menopause',
    level: 'see_doctor',
    title: 'Bleeding after menopause',
    message: {
      'en-US':
        'If it has been 12 months or more since your last period, any vaginal bleeding should be checked by a doctor, even a small amount or a single episode. It is not usually serious, but it is important to get it checked.',
      'en-GB':
        'If it has been 12 months or more since your last period, any vaginal bleeding should be checked by a GP, even a small amount or a single episode. It is not usually serious, but it is important to get it checked.',
    },
    sources: ['https://www.nhs.uk/conditions/post-menopausal-bleeding/'],
    reviewStatus: 'draft',
  },
  {
    id: 'heavy_or_unusual_bleeding',
    level: 'see_doctor',
    title: 'Heavy or unusual bleeding',
    message: {
      'en-US':
        'See a doctor if heavy periods are affecting your life or have gone on for some time, if you bleed between periods or after sex, or if your periods are severely painful.',
      'en-GB':
        'See a GP if heavy periods are affecting your life or have gone on for some time, if you bleed between periods or after sex, or if your periods are severely painful.',
    },
    sources: ['https://www.nhs.uk/conditions/heavy-periods/'],
    reviewStatus: 'draft',
  },
];

/**
 * Phrases in free-text notes that show crisis resources. Matching is local and
 * deliberately broad: a false positive shows a helpline, but a false negative
 * could hide one. Clinician to review the list.
 */
export const CRISIS_PHRASES: readonly string[] = [
  'suicide',
  'suicidal',
  'kill myself',
  'end my life',
  'want to die',
  'self harm',
  'self-harm',
  'hurt myself',
  'harm myself',
  'no reason to live',
  'better off without me',
];

export interface TriggerInput {
  flow?: 'none' | 'spotting' | 'light' | 'medium' | 'heavy';
  symptomIds: string[];
  notes?: string;
}

const LEVEL_ORDER: Record<TriggerLevel, number> = { crisis: 0, emergency: 1, see_doctor: 2 };

/** Returns the triggers that apply, most urgent first. Pure and local. */
export function evaluateUrgentTriggers(input: TriggerInput): UrgentTrigger[] {
  const hits = new Set<string>();
  const notes = (input.notes ?? '').toLowerCase();

  if (CRISIS_PHRASES.some((p) => notes.includes(p))) hits.add('self_harm_thoughts');
  if (input.symptomIds.includes('low_mood')) hits.add('self_harm_thoughts');
  if (input.symptomIds.includes('palpitations')) hits.add('palpitations_red_flags');

  const anyBleeding = input.flow !== undefined && input.flow !== 'none';
  if (anyBleeding || input.symptomIds.includes('spotting')) hits.add('bleeding_after_menopause');
  if (input.flow === 'heavy' || input.symptomIds.includes('heavy_flow') || input.symptomIds.includes('spotting')) {
    hits.add('heavy_or_unusual_bleeding');
  }

  return URGENT_TRIGGERS.filter((t) => hits.has(t.id)).sort((a, b) => LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level]);
}

/** Any urgent guidance on screen suppresses all commercial content on that screen. */
export function suppressesCommercial(triggers: UrgentTrigger[]): boolean {
  return triggers.length > 0;
}
