/**
 * Symptoms hub grouping. Symptom pages carry no group in their frontmatter, so
 * this table maps each /symptoms/ page (by slug) to one reader-facing group.
 * A page missing from the table still shows, under "Other", so a new guide is
 * never hidden; add it here to place it properly.
 *
 * Cycle & bleeding guides live under /perimenopause/; EXTRA_URLS pulls them in
 * when they exist in this build (never a draft: the caller looks them up in
 * the visible pages only).
 */
export type SymptomGroupId = 'sleep' | 'mind' | 'body' | 'cycle' | 'intimate' | 'skin' | 'other';

export const SYMPTOM_GROUPS: Array<{ id: SymptomGroupId; label: string; blurb: string }> = [
  { id: 'sleep', label: 'Sleep & temperature', blurb: 'Hot flashes, night sweats, broken sleep and tiredness.' },
  { id: 'mind', label: 'Mind & mood', blurb: 'Anxiety, low mood, irritability, brain fog and memory.' },
  { id: 'body', label: 'Body & joints', blurb: 'Aches, headaches, heart flutters, dizziness, digestion and weight.' },
  { id: 'cycle', label: 'Cycle & bleeding', blurb: 'Changing periods, heavy bleeding and breast tenderness.' },
  { id: 'intimate', label: 'Intimate & bladder', blurb: 'Vaginal dryness, painful sex, libido, leaks and UTIs.' },
  { id: 'skin', label: 'Skin & hair', blurb: 'Dry or itchy skin, acne, thinning or new hair, dry eyes.' },
  { id: 'other', label: 'Other', blurb: 'More symptom guides.' },
];

export const SLUG_GROUP: Record<string, SymptomGroupId> = {
  'hot-flashes': 'sleep',
  'night-sweats': 'sleep',
  insomnia: 'sleep',
  'waking-at-3am': 'sleep',
  fatigue: 'sleep',

  anxiety: 'mind',
  depression: 'mind',
  irritability: 'mind',
  'brain-fog': 'mind',
  'memory-problems': 'mind',
  'panic-attacks': 'mind',

  'joint-pain': 'body',
  'frozen-shoulder': 'body',
  headaches: 'body',
  migraines: 'body',
  'heart-palpitations': 'body',
  dizziness: 'body',
  tingling: 'body',
  tinnitus: 'body',
  'weight-gain': 'body',
  bloating: 'body',
  'digestive-changes': 'body',
  'burning-mouth': 'body',

  'breast-tenderness': 'cycle',

  'vaginal-dryness': 'intimate',
  'painful-sex': 'intimate',
  'low-libido': 'intimate',
  'bladder-urgency': 'intimate',
  incontinence: 'intimate',
  'recurrent-utis': 'intimate',

  acne: 'skin',
  'dry-itchy-skin': 'skin',
  'facial-hair': 'skin',
  'hair-thinning': 'skin',
  'body-odor': 'skin',
  'dry-eyes': 'skin',
};

/**
 * Everyday words she might type for a guide (the on-page search also matches
 * titles, descriptions, keywords and tags).
 */
export const SLUG_TERMS: Record<string, string> = {
  'hot-flashes': 'hot flush flushes heat burning up sweating',
  'night-sweats': 'hot at night sweaty soaked drenched sweat bed',
  insomnia: "can't sleep cant sleep sleepless awake",
  'waking-at-3am': 'wake up 3am middle of the night awake early',
  fatigue: 'tired exhausted no energy worn out',
  anxiety: 'anxious worried nervous on edge',
  depression: 'sad low down crying hopeless',
  irritability: 'angry rage snapping short tempered angry all the time',
  'brain-fog': 'foggy fuzzy cant think concentrate',
  'memory-problems': 'forgetful forgetting words memory',
  'panic-attacks': 'panic racing heart dread',
  'heart-palpitations': 'racing heart pounding fluttering skipped beats',
  'joint-pain': 'aches aching joints stiff sore',
  'weight-gain': 'belly weight middle',
  'vaginal-dryness': 'dry down there itchy vagina sore',
  'painful-sex': 'sex hurts pain during sex',
  'low-libido': 'no sex drive desire',
  'bladder-urgency': 'pee often need to wee rush toilet',
  incontinence: 'leaking leaks pee when sneeze',
  'recurrent-utis': 'uti bladder infection burning pee',
  'hair-thinning': 'hair loss falling out thin hair',
  'facial-hair': 'chin hair whiskers',
  'dry-itchy-skin': 'itchy skin crawling dry skin',
};

/** Guides outside /symptoms/ that belong in a group here (shown only if they exist in this build). */
export const EXTRA_URLS: Array<{ url: string; group: SymptomGroupId }> = [
  { url: '/perimenopause/irregular-periods/', group: 'cycle' },
  { url: '/perimenopause/heavy-periods/', group: 'cycle' },
];

export interface DirectoryItem {
  url: string;
  title: string;
  desc: string;
  /** Extra words she might type (keywords, tags), lower-case, space-separated. */
  terms: string;
  /** Present only when the page has a single scale grade. */
  grade?: string;
}

export interface DirectoryGroup {
  id: SymptomGroupId;
  label: string;
  blurb: string;
  items: DirectoryItem[];
}
