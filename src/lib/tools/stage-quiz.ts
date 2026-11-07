import { evaluateUrgentTriggers, type UrgentTrigger } from '../safety/urgent-triggers';

/**
 * The "Where am I?" stage quiz: questions, answer rules and every line of copy.
 * Pure and local: nothing here touches storage, the network or the DOM, so the
 * component (src/components/tools/stage-guide.tsx) only renders what this file
 * decides. Clinician review covers this file (content/_tools/stage-guide.yaml).
 *
 * Sources: STRAW+10 (straw-10-2012) for the period-pattern stages and NICE NG23
 * (nice-ng23-recommendations, nice-ng23) for the age rules. No score, no
 * diagnosis, no medicines.
 *
 * Question order runs from the most advanced pattern to the least (12 months
 * without a period, then a 60-day gap, then 7-day cycle shifts), skipping what
 * no longer applies, so answers can never contradict each other.
 */

export type AgeGroup = '' | 'under_40' | '40_to_44' | '45_plus';
export type CycleContext = '' | 'natural_cycles' | 'hormonal_contraception' | 'hysterectomy' | 'other_or_unsure';
export type YesNo = '' | 'yes' | 'no';
export type YesNoUnsure = '' | 'yes' | 'no' | 'not_sure';
export type CycleVariation = '' | 'regular' | 'varied_7_plus_days' | 'not_sure';
export type RedFlagId = 'postmenopausal_bleeding' | 'heavy_flow' | 'palpitations' | 'low_mood';

export type QuestionId = 'age' | 'context' | 'noPeriod12' | 'gap60' | 'variation' | 'vasomotor' | 'safety';
export type Step = QuestionId | 'result';

export interface StageQuizState {
  version: 2;
  ageGroup: AgeGroup;
  cycleContext: CycleContext;
  noPeriod12: YesNo;
  gap60: YesNoUnsure;
  cycleVariation: CycleVariation;
  vasomotor: YesNo;
  redFlags: RedFlagId[];
  /** She ticked "None of these" on the safety question. */
  noRedFlags: boolean;
  /** Where she is in the quiz, so she can pick up where she left off. */
  step: Step;
}

export const DEFAULT_STATE: StageQuizState = {
  version: 2,
  ageGroup: '',
  cycleContext: '',
  noPeriod12: '',
  gap60: '',
  cycleVariation: '',
  vasomotor: '',
  redFlags: [],
  noRedFlags: false,
  step: 'age',
};

// ------------------------------------------------------------------ Questions

export interface Option {
  value: string;
  label: string;
  /** Short form for the answer summary, print and PDF. */
  short: string;
}

export interface Question {
  id: QuestionId;
  /** Shown as the question heading (the fieldset legend). */
  text: string;
  /** Optional help line under the heading. */
  help?: string;
  /** Short form for the answer summary. */
  short: string;
  kind: 'single' | 'multi';
  options: Option[];
}

export const RED_FLAG_OPTIONS: Array<Option & { value: RedFlagId }> = [
  {
    value: 'postmenopausal_bleeding',
    label: 'Any vaginal bleeding or spotting after 12 months or more without a period',
    short: 'Bleeding after 12 months without a period',
  },
  {
    value: 'heavy_flow',
    label: 'Heavy periods affecting daily life, bleeding between periods, or bleeding after sex',
    short: 'Heavy or unusual bleeding',
  },
  {
    value: 'palpitations',
    label: 'Heart palpitations that do not go away, or come with chest pain, breathlessness, or faintness',
    short: 'Palpitations with warning signs',
  },
  {
    value: 'low_mood',
    label: 'Feeling overwhelmed, hopeless, or having thoughts of harming yourself',
    short: 'Feeling hopeless or thoughts of self-harm',
  },
];

export const NONE_OF_THESE = 'none';

export const QUESTIONS: Record<QuestionId, Question> = {
  age: {
    id: 'age',
    text: 'How old are you?',
    short: 'Age:',
    kind: 'single',
    options: [
      { value: 'under_40', label: 'Under 40', short: 'Under 40' },
      { value: '40_to_44', label: '40 to 44', short: '40 to 44' },
      { value: '45_plus', label: '45 or over', short: '45 or over' },
    ],
  },
  context: {
    id: 'context',
    text: 'Does anything below affect your periods?',
    help: 'The period-based stages only work with natural periods.',
    short: 'What affects my periods:',
    kind: 'single',
    options: [
      {
        value: 'natural_cycles',
        label: 'None of these: I have a uterus and do not use hormonal contraception or HRT',
        short: 'Nothing (natural periods)',
      },
      {
        value: 'hormonal_contraception',
        label: 'I use a hormonal IUD (such as Mirena), implant, injection, or birth control pill',
        short: 'Hormonal contraception or hormonal IUD',
      },
      {
        value: 'hysterectomy',
        label: 'I have had a hysterectomy or endometrial ablation',
        short: 'Hysterectomy or endometrial ablation',
      },
      {
        value: 'other_or_unsure',
        label: 'Something else affects my periods (such as HRT), or I am not sure',
        short: 'Something else, or not sure',
      },
    ],
  },
  noPeriod12: {
    id: 'noPeriod12',
    text: 'Has it been 12 months or more since your last period?',
    help: 'Count only if there has been no bleeding or spotting at all for 12 months in a row.',
    short: '12 months or more without a period:',
    kind: 'single',
    options: [
      { value: 'yes', label: 'Yes, no period or spotting for 12 months or more', short: 'Yes' },
      { value: 'no', label: 'No, I have had a period or spotting in the past 12 months', short: 'No' },
    ],
  },
  gap60: {
    id: 'gap60',
    text: 'In the past year, have you gone 60 days or more between periods?',
    help: '60 days is about 2 months.',
    short: 'A gap of 60 days or more:',
    kind: 'single',
    options: [
      { value: 'yes', label: 'Yes, at least once', short: 'Yes' },
      { value: 'no', label: 'No', short: 'No' },
      { value: 'not_sure', label: 'I am not sure', short: 'Not sure' },
    ],
  },
  variation: {
    id: 'variation',
    text: 'How much does the length of your cycle change from one cycle to the next?',
    help: 'A cycle runs from the first day of one period to the day before the next one starts.',
    short: 'Cycle length:',
    kind: 'single',
    options: [
      { value: 'regular', label: 'By fewer than 7 days: my cycles are about the same length', short: 'Changes by fewer than 7 days' },
      {
        value: 'varied_7_plus_days',
        label: 'By 7 days or more, and it has happened more than once in my last 10 cycles',
        short: 'Changes by 7 days or more, again and again',
      },
      { value: 'not_sure', label: 'I am not sure', short: 'Not sure' },
    ],
  },
  vasomotor: {
    id: 'vasomotor',
    text: 'Have hot flashes or night sweats started recently?',
    short: 'Hot flashes or night sweats recently started:',
    kind: 'single',
    options: [
      { value: 'yes', label: 'Yes', short: 'Yes' },
      { value: 'no', label: 'No', short: 'No' },
    ],
  },
  safety: {
    id: 'safety',
    text: 'Safety check: have you noticed any of these?',
    help: 'Tick all that apply.',
    short: 'Safety check:',
    kind: 'multi',
    options: [...RED_FLAG_OPTIONS, { value: NONE_OF_THESE, label: 'None of these', short: 'None of these' }],
  },
};

const ORDER: QuestionId[] = ['age', 'context', 'noPeriod12', 'gap60', 'variation', 'vasomotor', 'safety'];

/** Natural periods (or not sure what affects them): the period questions apply. */
function asksAboutPeriods(s: StageQuizState): boolean {
  return s.cycleContext === 'natural_cycles' || s.cycleContext === 'other_or_unsure';
}

/** The questions she sees, given her answers so far. Later answers never hide earlier questions. */
export function visibleQuestions(s: StageQuizState): QuestionId[] {
  return ORDER.filter((id) => {
    if (id === 'noPeriod12') return asksAboutPeriods(s);
    if (id === 'gap60') return asksAboutPeriods(s) && s.noPeriod12 === 'no';
    if (id === 'variation') return asksAboutPeriods(s) && s.noPeriod12 === 'no' && s.gap60 !== 'yes' && s.gap60 !== '';
    return true;
  });
}

export function isAnswered(s: StageQuizState, id: QuestionId): boolean {
  switch (id) {
    case 'age':
      return s.ageGroup !== '';
    case 'context':
      return s.cycleContext !== '';
    case 'noPeriod12':
      return s.noPeriod12 !== '';
    case 'gap60':
      return s.gap60 !== '';
    case 'variation':
      return s.cycleVariation !== '';
    case 'vasomotor':
      return s.vasomotor !== '';
    case 'safety':
      return s.noRedFlags || s.redFlags.length > 0;
  }
}

/** The values ticked for a question, as option values. */
export function selectedValues(s: StageQuizState, id: QuestionId): string[] {
  switch (id) {
    case 'age':
      return s.ageGroup ? [s.ageGroup] : [];
    case 'context':
      return s.cycleContext ? [s.cycleContext] : [];
    case 'noPeriod12':
      return s.noPeriod12 ? [s.noPeriod12] : [];
    case 'gap60':
      return s.gap60 ? [s.gap60] : [];
    case 'variation':
      return s.cycleVariation ? [s.cycleVariation] : [];
    case 'vasomotor':
      return s.vasomotor ? [s.vasomotor] : [];
    case 'safety':
      return s.noRedFlags ? [NONE_OF_THESE] : [...s.redFlags];
  }
}

/** Apply a tap on an option. For the safety question, "None of these" and the red flags exclude each other. */
export function answer(s: StageQuizState, id: QuestionId, value: string): StageQuizState {
  switch (id) {
    case 'age':
      return { ...s, ageGroup: value as AgeGroup };
    case 'context':
      return { ...s, cycleContext: value as CycleContext };
    case 'noPeriod12':
      return { ...s, noPeriod12: value as YesNo };
    case 'gap60':
      return { ...s, gap60: value as YesNoUnsure };
    case 'variation':
      return { ...s, cycleVariation: value as CycleVariation };
    case 'vasomotor':
      return { ...s, vasomotor: value as YesNo };
    case 'safety': {
      if (value === NONE_OF_THESE) return { ...s, noRedFlags: !s.noRedFlags, redFlags: [] };
      const flag = value as RedFlagId;
      const redFlags = s.redFlags.includes(flag) ? s.redFlags.filter((f) => f !== flag) : [...s.redFlags, flag];
      return { ...s, redFlags, noRedFlags: false };
    }
  }
}

/** First visible question without an answer, or 'result' when all are answered. */
export function firstUnanswered(s: StageQuizState): Step {
  return visibleQuestions(s).find((id) => !isAnswered(s, id)) ?? 'result';
}

export function isComplete(s: StageQuizState): boolean {
  return firstUnanswered(s) === 'result';
}

export function hasAnyAnswer(s: StageQuizState): boolean {
  return ORDER.some((id) => isAnswered(s, id));
}

/**
 * Position for "Question 3 of 7". The total counts every question that could
 * still appear, so it only ever shrinks (when an answer skips questions).
 */
export function progress(s: StageQuizState): { index: number; total: number } {
  const visible = visibleQuestions({
    ...s,
    cycleContext: s.cycleContext || 'natural_cycles',
    noPeriod12: s.noPeriod12 || 'no',
    gap60: s.gap60 || 'no',
  });
  const i = s.step === 'result' ? visible.length : visible.indexOf(s.step);
  return { index: Math.max(0, i) + 1, total: visible.length };
}

export function nextStep(s: StageQuizState): Step {
  const visible = visibleQuestions(s);
  if (s.step === 'result') return 'result';
  const i = visible.indexOf(s.step);
  return i < 0 || i + 1 >= visible.length ? 'result' : visible[i + 1];
}

export function previousStep(s: StageQuizState): Step {
  const visible = visibleQuestions(s);
  if (s.step === 'result') return visible[visible.length - 1];
  const i = visible.indexOf(s.step);
  return i <= 0 ? visible[0] : visible[i - 1];
}

// ------------------------------------------------------------- Saved answers

const AGE_GROUPS: AgeGroup[] = ['under_40', '40_to_44', '45_plus'];
const CONTEXTS: CycleContext[] = ['natural_cycles', 'hormonal_contraception', 'hysterectomy', 'other_or_unsure'];
const YES_NO: YesNo[] = ['yes', 'no'];
const YES_NO_UNSURE: YesNoUnsure[] = ['yes', 'no', 'not_sure'];
const VARIATIONS: CycleVariation[] = ['regular', 'varied_7_plus_days', 'not_sure'];
const RED_FLAGS = RED_FLAG_OPTIONS.map((o) => o.value);
const STEPS: Step[] = [...ORDER, 'result'];

const pick = <T extends string>(allowed: readonly T[], v: unknown): T | '' => (allowed.includes(v as T) ? (v as T) : '');

/**
 * Reads saved answers from any version. The first stage guide (one page, five
 * questions) saved { ageGroup, cycleContext, cyclePattern, hasVasomotor,
 * redFlags }; its single period-pattern answer is split into the quiz's three
 * period questions. Unknown or broken values are dropped, never thrown on.
 */
export function normalize(raw: unknown): StageQuizState {
  const p = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const s: StageQuizState = {
    ...DEFAULT_STATE,
    ageGroup: pick(AGE_GROUPS, p.ageGroup),
    cycleContext: pick(CONTEXTS, p.cycleContext),
    noPeriod12: pick(YES_NO, p.noPeriod12),
    gap60: pick(YES_NO_UNSURE, p.gap60),
    cycleVariation: pick(VARIATIONS, p.cycleVariation),
    vasomotor: pick(YES_NO, p.vasomotor),
    redFlags: Array.isArray(p.redFlags) ? [...new Set(p.redFlags.filter((x): x is RedFlagId => RED_FLAGS.includes(x as RedFlagId)))] : [],
    noRedFlags: p.noRedFlags === true,
  };
  if (s.redFlags.length > 0) s.noRedFlags = false;

  if (p.version !== 2) {
    // Version 1: one period-pattern answer, and a hot-flash checkbox.
    switch (p.cyclePattern) {
      case 'none_12_plus_months':
        s.noPeriod12 = 'yes';
        break;
      case 'skipped_60_plus_days':
        Object.assign(s, { noPeriod12: 'no', gap60: 'yes' });
        break;
      case 'varied_7_plus_days':
        Object.assign(s, { noPeriod12: 'no', gap60: 'no', cycleVariation: 'varied_7_plus_days' });
        break;
      case 'regular':
        Object.assign(s, { noPeriod12: 'no', gap60: 'no', cycleVariation: 'regular' });
        break;
    }
    // An unticked box in version 1 can't be told apart from "not answered", so only "yes" carries over.
    if (p.hasVasomotor === true) s.vasomotor = 'yes';
  }

  // Resume where she was, but never past a question she hasn't answered yet.
  const saved = STEPS.includes(p.step as Step) ? (p.step as Step) : p.version === 2 ? 'age' : 'result';
  const stop = firstUnanswered(s);
  const visible = [...visibleQuestions(s), 'result'] as Step[];
  const at = visible.indexOf(saved);
  s.step = at >= 0 && at <= visible.indexOf(stop) ? saved : stop;
  return s;
}

// ------------------------------------------------------------------- Results

export type StageId =
  | 'late_reproductive'
  | 'early_transition'
  | 'late_transition'
  | 'postmenopause'
  | 'cycle_rules_dont_apply'
  | 'under_40'
  | 'not_enough_info';

export type PatternStage = 'late_reproductive' | 'early_transition' | 'late_transition' | 'postmenopause';

export type NoteId = 'cycle_rules_dont_apply' | 'other_or_unsure' | 'nice_45_plus' | 'pattern_under_40';

export interface Copy {
  title: string;
  paragraphs: string[];
}

export const STAGE_COPY: Record<StageId, Copy> = {
  late_reproductive: {
    title: 'Your answers resemble the late reproductive stage, before the menopausal transition',
    paragraphs: [
      'In the STRAW+10 staging criteria, cycles that change in length by fewer than 7 days are placed before the menopausal transition. Perimenopause, in STRAW+10 terms, begins with the early transition.',
      'New symptoms are still worth talking about with a clinician, who can also check for other causes, such as thyroid changes or iron deficiency.',
    ],
  },
  early_transition: {
    title: 'Your answers resemble the early menopausal transition (STRAW+10 Stage −2)',
    paragraphs: [
      'In the STRAW+10 criteria, a persistent difference of 7 days or more in the length of consecutive cycles, recurring within 10 cycles, marks the early menopausal transition. This is where STRAW+10 says perimenopause begins.',
    ],
  },
  late_transition: {
    title: 'Your answers resemble the late menopausal transition (STRAW+10 Stage −1)',
    paragraphs: [
      'In the STRAW+10 criteria, a gap of 60 days or more without a period places a natural cycle pattern in the late menopausal transition. On average, this stage lasts 1 to 3 years before the final period.',
    ],
  },
  postmenopause: {
    title: 'Your answers resemble postmenopause',
    paragraphs: [
      'STRAW+10 and NICE NG23 both identify natural menopause looking back, after 12 months in a row without a period (when not using hormonal contraception). In STRAW+10, perimenopause ends 12 months after the final period.',
      'Any vaginal bleeding or spotting after 12 months without a period should be checked by a doctor, even a small amount or a single episode.',
    ],
  },
  cycle_rules_dont_apply: {
    title: 'The period-based stages don’t apply to your answers',
    paragraphs: [
      'The STRAW+10 staging criteria rely on natural periods. With hormonal contraception, a hormonal IUD, a hysterectomy, or an endometrial ablation, your bleeding pattern can’t be used on its own to stage perimenopause or to count 12 months to menopause.',
      'Clinicians look instead at your age, symptoms such as hot flashes and night sweats, and your medical history.',
    ],
  },
  under_40: {
    title: 'Under 40: ask a clinician about premature ovarian insufficiency (POI)',
    paragraphs: [
      'The STRAW+10 cycle rules were developed in midlife groups and are not designed to identify menopause under age 40 on their own.',
      'UK guidance (NICE NG23) handles suspected menopause under 40 differently. When menopause-like symptoms or infrequent periods happen before 40, it advises that a clinician looks specifically for premature ovarian insufficiency, including blood tests on two occasions.',
    ],
  },
  not_enough_info: {
    title: 'We can’t match a stage from these answers yet',
    paragraphs: [
      'The STRAW+10 stages depend on how much your cycle length changes and on any gaps of 60 days or more. Without those, the quiz can’t say which stage your pattern resembles.',
      'Writing down the first day of each period for a few months shows both, and is useful to bring to an appointment.',
    ],
  },
};

export const NOTE_COPY: Record<NoteId, Copy> = {
  cycle_rules_dont_apply: STAGE_COPY.cycle_rules_dont_apply,
  other_or_unsure: {
    title: 'Something else may affect your periods',
    paragraphs: [
      'You said something else may affect your periods, or you’re not sure. The STRAW+10 stages rely on natural periods, so the result below may not describe you. A clinician can tell you whether it applies.',
    ],
  },
  nice_45_plus: {
    title: 'What NICE NG23 says at 45 and over',
    paragraphs: [
      'In otherwise healthy people aged 45 or over whose hot flashes or sweats have recently started along with a change in periods, UK guidance advises clinicians to identify perimenopause from symptoms and cycle history, without laboratory tests. At 45 and over, it advises against using hormone tests such as AMH, inhibin, or estradiol to identify perimenopause or menopause.',
    ],
  },
  pattern_under_40: {
    title: 'What your period answers look like in STRAW+10 terms',
    paragraphs: [],
  },
};

/** What the quiz can't tell her. Shown with every result, and in the print and PDF. */
export const LIMITS: string[] = [
  'This quiz is not a diagnosis. It shows how the published STRAW+10 and NICE NG23 criteria describe your answers, and gives no score.',
  'It can’t examine you, and it can’t rule out other causes of cycle changes, such as pregnancy, thyroid conditions, iron deficiency, or gynecological conditions.',
  'Take a summary of your answers to a clinician, who can look at the whole picture.',
];

export interface NextLink {
  href: string;
  label: string;
}

const L = {
  stages: { href: '/perimenopause/stages/', label: 'The stages of perimenopause' },
  earlySigns: { href: '/perimenopause/early-signs/', label: 'Early signs of perimenopause' },
  irregular: { href: '/perimenopause/irregular-periods/', label: 'Irregular periods in perimenopause' },
  howLong: { href: '/perimenopause/how-long/', label: 'How long perimenopause lasts' },
  seeDoctor: { href: '/perimenopause/when-to-see-a-doctor/', label: 'When to see a doctor about perimenopause' },
  questions: { href: '/perimenopause/questions-for-your-doctor/', label: 'What to ask your doctor about perimenopause' },
  contraception: { href: '/perimenopause/contraception/', label: 'Contraception in perimenopause' },
  pregnancy: { href: '/perimenopause/pregnancy/', label: 'Can you get pregnant during perimenopause?' },
  heavy: { href: '/perimenopause/heavy-periods/', label: 'Heavy periods in perimenopause' },
  in30s: { href: '/perimenopause/in-your-30s/', label: 'Can perimenopause start in your 30s?' },
  postmenopause: { href: '/postmenopause/', label: 'Postmenopause explained' },
  bleeding: { href: '/postmenopause/bleeding/', label: 'Bleeding after menopause' },
  diagnosis: { href: '/menopause/diagnosis/', label: 'How is menopause confirmed?' },
  poi: { href: '/groups/premature-ovarian-insufficiency/', label: 'Premature ovarian insufficiency' },
  hotFlashes: { href: '/symptoms/hot-flashes/', label: 'Hot flashes in perimenopause' },
  counter: { href: '/tools/12-month-counter/', label: 'Count toward 12 months with the no-period day counter' },
  checklist: { href: '/tools/symptoms-checklist/', label: 'Tick other symptoms on the printable checklist' },
} satisfies Record<string, NextLink>;

export const TRACKER_LINKS: NextLink[] = [
  { href: '/tools/symptom-tracker/', label: 'Track your periods and symptoms over time' },
  { href: '/app/install/', label: 'Install the app' },
];

const STAGE_LINKS: Record<StageId, NextLink[]> = {
  late_reproductive: [L.stages, L.earlySigns, L.seeDoctor],
  early_transition: [L.stages, L.irregular, L.seeDoctor],
  late_transition: [L.stages, L.irregular, L.howLong, L.counter],
  postmenopause: [L.postmenopause, L.diagnosis, L.bleeding],
  cycle_rules_dont_apply: [L.diagnosis, L.contraception, L.stages],
  under_40: [L.poi, L.in30s, L.seeDoctor],
  not_enough_info: [L.stages, L.irregular, L.counter],
};

export interface QuizResult {
  stage: StageId;
  /** The STRAW+10 stage her period answers resemble, when the period questions apply. */
  patternStage: PatternStage | null;
  notes: NoteId[];
  urgent: UrgentTrigger[];
  /** Page links, before filtering to pages that are live in this build. */
  links: NextLink[];
}

/** The STRAW+10 stage the period answers resemble, using only questions she was shown. */
export function patternStageFor(s: StageQuizState): PatternStage | null {
  if (!asksAboutPeriods(s)) return null;
  if (s.noPeriod12 === 'yes') return 'postmenopause';
  if (s.noPeriod12 !== 'no') return null;
  if (s.gap60 === 'yes') return 'late_transition';
  if (s.gap60 === '') return null;
  if (s.cycleVariation === 'varied_7_plus_days') return 'early_transition';
  // Cycles that change by fewer than 7 days can't contain a 60-day gap, so "not sure" about the gap still fits here.
  if (s.cycleVariation === 'regular') return 'late_reproductive';
  return null;
}

export function computeResult(s: StageQuizState): QuizResult {
  const patternStage = patternStageFor(s);
  const hormonesOrSurgery = s.cycleContext === 'hormonal_contraception' || s.cycleContext === 'hysterectomy';
  const notes: NoteId[] = [];

  let stage: StageId;
  if (s.ageGroup === 'under_40') {
    stage = 'under_40';
    if (hormonesOrSurgery) notes.push('cycle_rules_dont_apply');
    if (patternStage) notes.push('pattern_under_40');
  } else if (hormonesOrSurgery) {
    stage = 'cycle_rules_dont_apply';
  } else {
    stage = patternStage ?? 'not_enough_info';
  }
  if (s.cycleContext === 'other_or_unsure') notes.unshift('other_or_unsure');
  if (
    s.ageGroup === '45_plus' &&
    s.vasomotor === 'yes' &&
    (patternStage === 'early_transition' || patternStage === 'late_transition')
  ) {
    notes.push('nice_45_plus');
  }

  const urgent = evaluateUrgentTriggers({ symptomIds: s.redFlags });

  const links: NextLink[] = [...STAGE_LINKS[stage]];
  if (s.redFlags.includes('postmenopausal_bleeding')) links.unshift(L.bleeding);
  if (s.redFlags.includes('heavy_flow')) links.unshift(L.heavy);
  if (s.vasomotor === 'yes') links.push(L.hotFlashes);
  links.push(L.pregnancy, L.questions, L.checklist);
  const unique = [...new Map(links.map((l) => [l.href, l])).values()];
  return { stage, patternStage, notes, urgent, links: unique };
}

/** Urgent guidance as soon as a red flag is ticked, even before the result. */
export function urgentFor(s: StageQuizState): UrgentTrigger[] {
  return evaluateUrgentTriggers({ symptomIds: s.redFlags });
}

/** Her answers as [question, answer] pairs, for the on-screen list, print and PDF. */
export function answerSummary(s: StageQuizState): Array<[string, string]> {
  return visibleQuestions(s)
    .filter((id) => isAnswered(s, id))
    .map((id) => {
      const q = QUESTIONS[id];
      const chosen = selectedValues(s, id);
      const text = q.options
        .filter((o) => chosen.includes(o.value))
        .map((o) => o.short)
        .join('; ');
      return [q.short, text];
    });
}

/** One line for the saved-answers list. */
export function summarize(s: StageQuizState): string {
  if (!hasAnyAnswer(s)) return 'No answers';
  const age = QUESTIONS.age.options.find((o) => o.value === s.ageGroup)?.short;
  const label = isComplete(s) ? shortStageLabel(computeResult(s).stage) : 'Not finished';
  return [age, label].filter(Boolean).join(' · ');
}

const SHORT_STAGE: Record<StageId, string> = {
  late_reproductive: 'Late reproductive stage',
  early_transition: 'Early menopausal transition',
  late_transition: 'Late menopausal transition',
  postmenopause: 'Postmenopause',
  cycle_rules_dont_apply: 'Period-based stages don’t apply',
  under_40: 'Under 40: ask about POI',
  not_enough_info: 'No stage matched',
};

export function shortStageLabel(stage: StageId): string {
  return SHORT_STAGE[stage];
}

/** The paragraphs of the result, in reading order (headline stage, then notes). */
export function resultSections(r: QuizResult): Copy[] {
  const out: Copy[] = [];
  const notes = r.notes.filter((n) => n !== 'pattern_under_40');
  if (notes.includes('other_or_unsure')) out.push(NOTE_COPY.other_or_unsure);
  out.push(STAGE_COPY[r.stage]);
  if (r.notes.includes('pattern_under_40') && r.patternStage) {
    out.push({
      title: NOTE_COPY.pattern_under_40.title,
      paragraphs: [`${STAGE_COPY[r.patternStage].title}. Because you are under 40, treat this as background only.`, ...STAGE_COPY[r.patternStage].paragraphs],
    });
  }
  for (const n of notes) if (n !== 'other_or_unsure') out.push(NOTE_COPY[n]);
  return out;
}

/** Input for quizSummaryPdf (src/lib/tools/simple-pdf.ts): built and saved in the browser. */
export function quizPdfInput(s: StageQuizState): { stage: string; explanation: string; answers: Array<[string, string]>; caveat: string } {
  const r = computeResult(s);
  const lines: string[] = r.urgent.map((t) => `${t.title}: ${t.message['en-US']}`);
  for (const c of resultSections(r)) {
    if (c !== STAGE_COPY[r.stage]) lines.push(`${c.title}.`);
    lines.push(...c.paragraphs);
  }
  return { stage: STAGE_COPY[r.stage].title, explanation: lines.join(' '), answers: answerSummary(s), caveat: LIMITS.join(' ') };
}
