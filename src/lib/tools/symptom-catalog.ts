/**
 * Symptom catalogue for the symptoms checklist (and later tools). One item per
 * symptom page in content/_plan/keyword-map.csv, plus period and bleeding items.
 *
 * Groups are for easy scanning; they are not clinical categories. Ticking items
 * never produces a score, a threshold or a stage (content/_tools/symptoms-checklist.yaml).
 */

export interface CatalogItem {
  id: string;
  label: string;
  /** Site page for this symptom (shown only when that page is published). */
  url: string;
  /** Matching tracker symptom id (src/lib/config/symptoms.ts), if there is one. */
  trackerId?: string;
  /** Symptom id understood by evaluateUrgentTriggers, if ticking this shows urgent guidance. */
  triggerId?: string;
}

export interface CatalogGroup {
  id: string;
  label: string;
  items: CatalogItem[];
}

const S = (slug: string) => `/symptoms/${slug}/`;

export const SYMPTOM_CATALOG: CatalogGroup[] = [
  {
    id: 'periods',
    label: 'Periods and bleeding',
    items: [
      { id: 'irregular-periods', label: 'Periods coming closer together, further apart, or skipped', url: '/perimenopause/irregular-periods/', trackerId: 'cycle_irregular' },
      { id: 'heavy-periods', label: 'Heavier periods than usual', url: '/perimenopause/heavy-periods/', trackerId: 'heavy_flow', triggerId: 'heavy_flow' },
      { id: 'bleeding-after-menopause', label: 'Any bleeding after 12 months or more without a period', url: '/postmenopause/bleeding/', triggerId: 'postmenopausal_bleeding' },
    ],
  },
  {
    id: 'vasomotor',
    label: 'Hot flashes and sweats',
    items: [
      { id: 'hot-flashes', label: 'Hot flashes', url: S('hot-flashes'), trackerId: 'hot_flashes' },
      { id: 'night-sweats', label: 'Night sweats', url: S('night-sweats'), trackerId: 'night_sweats' },
    ],
  },
  {
    id: 'sleep',
    label: 'Sleep and energy',
    items: [
      { id: 'insomnia', label: 'Trouble falling or staying asleep', url: S('insomnia'), trackerId: 'trouble_sleeping' },
      { id: 'waking-at-3am', label: 'Waking in the early hours', url: S('waking-at-3am'), trackerId: 'waking_early' },
      { id: 'fatigue', label: 'Tiredness or exhaustion', url: S('fatigue'), trackerId: 'fatigue' },
    ],
  },
  {
    id: 'mood',
    label: 'Mood and thinking',
    items: [
      { id: 'anxiety', label: 'Anxiety or feeling on edge', url: S('anxiety'), trackerId: 'anxiety_rush' },
      { id: 'panic-attacks', label: 'Panic attacks', url: S('panic-attacks') },
      { id: 'depression', label: 'Low mood', url: S('depression'), trackerId: 'low_mood', triggerId: 'low_mood' },
      { id: 'irritability', label: 'Irritability or rage', url: S('irritability'), trackerId: 'irritability' },
      { id: 'brain-fog', label: 'Brain fog or trouble concentrating', url: S('brain-fog'), trackerId: 'brain_fog' },
      { id: 'memory-problems', label: 'Forgetfulness or trouble finding words', url: S('memory-problems'), trackerId: 'word_recall' },
    ],
  },
  {
    id: 'heart-head',
    label: 'Heart and head',
    items: [
      { id: 'heart-palpitations', label: 'Heart palpitations (racing, pounding or fluttering)', url: S('heart-palpitations'), trackerId: 'palpitations', triggerId: 'palpitations' },
      { id: 'dizziness', label: 'Dizziness', url: S('dizziness') },
      { id: 'headaches', label: 'Headaches', url: S('headaches'), trackerId: 'headache' },
      { id: 'migraines', label: 'Migraines', url: S('migraines'), trackerId: 'headache' },
    ],
  },
  {
    id: 'body',
    label: 'Joints, muscles and body',
    items: [
      { id: 'joint-pain', label: 'Joint or muscle aches and stiffness', url: S('joint-pain'), trackerId: 'joint_stiffness' },
      { id: 'frozen-shoulder', label: 'Stiff, painful shoulder', url: S('frozen-shoulder') },
      { id: 'weight-gain', label: 'Weight gain, especially around the middle', url: S('weight-gain') },
      { id: 'bloating', label: 'Bloating', url: S('bloating') },
      { id: 'digestive-changes', label: 'Changes in digestion', url: S('digestive-changes') },
      { id: 'breast-tenderness', label: 'Sore or tender breasts', url: S('breast-tenderness') },
    ],
  },
  {
    id: 'genitourinary',
    label: 'Vaginal, bladder and sexual health',
    items: [
      { id: 'vaginal-dryness', label: 'Vaginal dryness, itching or irritation', url: S('vaginal-dryness'), trackerId: 'vaginal_dryness' },
      { id: 'painful-sex', label: 'Pain during sex', url: S('painful-sex') },
      { id: 'low-libido', label: 'Lower interest in sex', url: S('low-libido') },
      { id: 'bladder-urgency', label: 'Needing to pee urgently or more often', url: S('bladder-urgency'), trackerId: 'urinary_urgency' },
      { id: 'recurrent-utis', label: 'Repeated urinary tract infections', url: S('recurrent-utis') },
      { id: 'incontinence', label: 'Leaking urine', url: S('incontinence') },
    ],
  },
  {
    id: 'skin-other',
    label: 'Skin, hair and other changes',
    items: [
      { id: 'hair-thinning', label: 'Thinning hair', url: S('hair-thinning') },
      { id: 'facial-hair', label: 'More facial hair', url: S('facial-hair') },
      { id: 'dry-itchy-skin', label: 'Dry or itchy skin', url: S('dry-itchy-skin') },
      { id: 'acne', label: 'Breakouts or acne', url: S('acne') },
      { id: 'burning-mouth', label: 'Burning or dry mouth', url: S('burning-mouth') },
      { id: 'dry-eyes', label: 'Dry eyes', url: S('dry-eyes') },
      { id: 'tinnitus', label: 'Ringing in the ears', url: S('tinnitus') },
      { id: 'body-odor', label: 'Changes in body odor', url: S('body-odor') },
      { id: 'tingling', label: 'Tingling, or electric-shock feelings', url: S('tingling') },
    ],
  },
];

export const ALL_CATALOG_ITEMS: CatalogItem[] = SYMPTOM_CATALOG.flatMap((g) => g.items);

/** Trigger symptom ids for the ticked items, ready for evaluateUrgentTriggers. */
export function triggerIdsFor(tickedIds: Iterable<string>): string[] {
  const ticked = new Set(tickedIds);
  return ALL_CATALOG_ITEMS.filter((i) => ticked.has(i.id) && i.triggerId).map((i) => i.triggerId!);
}

/** Unique tracker symptom ids for the ticked items. */
export function trackerIdsFor(tickedIds: Iterable<string>): string[] {
  const ticked = new Set(tickedIds);
  return [...new Set(ALL_CATALOG_ITEMS.filter((i) => ticked.has(i.id) && i.trackerId).map((i) => i.trackerId!))];
}
