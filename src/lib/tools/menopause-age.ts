/**
 * Menopause age calculator: pure logic (no storage, nothing leaves the page).
 *
 * Honest by design: no source lets anyone predict one person's menopause age,
 * so this never outputs a predicted age. It places the reader's age against
 * the sourced typical range and averages, dates the 12-month mark from a last
 * period, and returns sourced context notes. Every figure below is quoted from
 * the source named next to it (content/_tools/menopause-age-calculator.yaml).
 */

/** Sourced reference figures. Change only after re-checking the source. */
export const MENOPAUSE_AGE_FACTS = {
  checked: '2026-11-15',
  /** MedlinePlus: "The most common age for reaching menopause is between 45 and 55." NHS: usually between 45 and 55. */
  typicalRange: { from: 45, to: 55, sources: ['medlineplus-menopause-2026', 'nhs-menopause-overview'] },
  averages: [
    { label: 'National Institute on Aging', age: '52', note: 'average age of menopause in the US', source: 'nia-what-is-menopause' },
    { label: 'ACOG', age: '51', note: 'average age of the last period in the US', source: 'acog-perimenopausal-bleeding-faq' },
    {
      label: 'US national survey, 2015-2018',
      age: '49.9',
      note: 'average age at natural menopause, as women reported it',
      source: 'appiah-menopause-age-trends-2021',
    },
  ],
  /** Office on Women's Health: 40 to 44 is early menopause; before 40 is premature menopause (POI). */
  earlyFrom: 40,
  earlyTo: 44,
  prematureBefore: 40,
} as const;

export type PeriodStatus = 'still' | 'stopped' | 'cant-tell';
export type CantTellReason = 'contraception' | 'hormonal-iud' | 'hysterectomy' | 'ablation';
export type Smoking = 'never' | 'past' | 'current' | '';

export interface MenopauseAgeInput {
  /** Age in whole years (takes priority over birthYear when both are given). */
  age?: number | null;
  birthYear?: number | null;
  periods: PeriodStatus | '';
  /** YYYY-MM-DD, first day of the last period (when periods have stopped). */
  lastPeriodIso?: string;
  cantTellReason?: CantTellReason | '';
  /** Age the reader's mother reached menopause, if known. */
  mothersAge?: number | null;
  smoking?: Smoking;
  /** Chemotherapy or pelvic radiation. */
  cancerTreatment?: boolean;
  /** Surgery to remove both ovaries. */
  ovariesRemoved?: boolean;
}

export type AgeBand = 'under-40' | 'early-40-44' | 'typical-45-55' | 'over-55';

export interface ContextNote {
  id: string;
  /** 'check' notes say to talk to a clinician; 'info' notes give context only. */
  kind: 'check' | 'info';
  title: string;
  text: string;
  /** Registry ids of the sources the note restates (shown on the guide page). */
  sources: string[];
}

export interface TwelveMonthMark {
  valid: boolean;
  iso: string;
  formatted: string;
  reached: boolean;
  daysRemaining: number;
  /** Whole months since the last period (0 when the date is invalid). */
  monthsSince: number;
}

export interface MenopauseAgeResult {
  /** False until a usable age is entered. */
  ready: boolean;
  age: number | null;
  /** True when the age was worked out from a birth year (it may be a year out). */
  ageFromBirthYear: boolean;
  band: AgeBand | null;
  /** Years until the typical range starts (0 once inside or past it). */
  yearsToRangeStart: number;
  /** Years past the end of the typical range (0 unless over 55). */
  yearsPastRange: number;
  twelveMonth: TwelveMonthMark | null;
  notes: ContextNote[];
}

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;

function utcToday(now: Date): number {
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
}

/** Reader's age from the inputs, or null when it isn't usable (outside 18-100). */
export function resolveAge(input: Pick<MenopauseAgeInput, 'age' | 'birthYear'>, now: Date = new Date()): { age: number | null; fromBirthYear: boolean } {
  const ok = (n: number) => Number.isFinite(n) && n >= 18 && n <= 100;
  if (input.age != null && Number.isFinite(input.age)) {
    const a = Math.floor(input.age);
    return { age: ok(a) ? a : null, fromBirthYear: false };
  }
  if (input.birthYear != null && Number.isFinite(input.birthYear)) {
    const a = now.getUTCFullYear() - Math.floor(input.birthYear);
    return { age: ok(a) ? a : null, fromBirthYear: true };
  }
  return { age: null, fromBirthYear: false };
}

export function ageBand(age: number): AgeBand {
  if (age < MENOPAUSE_AGE_FACTS.prematureBefore) return 'under-40';
  if (age < MENOPAUSE_AGE_FACTS.typicalRange.from) return 'early-40-44';
  if (age <= MENOPAUSE_AGE_FACTS.typicalRange.to) return 'typical-45-55';
  return 'over-55';
}

/** The 12-month mark: the same calendar date one year after the first day of the last period. */
export function twelveMonthMark(lastPeriodIso: string, now: Date = new Date()): TwelveMonthMark {
  const invalid: TwelveMonthMark = { valid: false, iso: '', formatted: '', reached: false, daysRemaining: 0, monthsSince: 0 };
  if (!ISO_RE.test(lastPeriodIso)) return invalid;
  const [y, m, d] = lastPeriodIso.split('-').map(Number);
  const start = Date.UTC(y, m - 1, d);
  const check = new Date(start);
  if (check.getUTCFullYear() !== y || check.getUTCMonth() !== m - 1 || check.getUTCDate() !== d) return invalid;
  const today = utcToday(now);
  if (start > today) return invalid;
  const mark = new Date(Date.UTC(y + 1, m - 1, d));
  const markUtc = mark.getTime();
  const t = new Date(today);
  let monthsSince = (t.getUTCFullYear() - y) * 12 + (t.getUTCMonth() - (m - 1));
  if (t.getUTCDate() < d) monthsSince -= 1;
  return {
    valid: true,
    iso: mark.toISOString().slice(0, 10),
    formatted: mark.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }),
    reached: today >= markUtc,
    daysRemaining: Math.max(0, Math.ceil((markUtc - today) / 86_400_000)),
    monthsSince: Math.max(0, monthsSince),
  };
}

const CANT_TELL_NOTES: Record<CantTellReason, ContextNote> = {
  contraception: {
    id: 'cant-tell-contraception',
    kind: 'info',
    title: 'Hormonal contraception can hide the 12-month sign',
    text: 'UK NICE guidance uses 12 months without a period to identify menopause only in people who are not using hormonal contraception. Ask your clinician how they would check your stage, and before stopping any contraception.',
    sources: ['nice-ng23-recommendations'],
  },
  'hormonal-iud': {
    id: 'cant-tell-iud',
    kind: 'info',
    title: 'A hormonal IUD can hide the 12-month sign',
    text: 'A hormonal IUD is hormonal contraception, and NICE uses 12 months without a period to identify menopause only in people not using hormonal contraception. Ask your clinician how they would check your stage.',
    sources: ['nice-ng23-recommendations'],
  },
  hysterectomy: {
    id: 'cant-tell-hysterectomy',
    kind: 'info',
    title: 'After a hysterectomy there are no periods to count',
    text: 'Removing only the uterus stops periods but does not cause menopause unless the ovaries are removed too (MedlinePlus). NICE says menopause is then identified from your symptoms, such as hot flashes.',
    sources: ['medlineplus-menopause-2026', 'nice-ng23-recommendations'],
  },
  ablation: {
    id: 'cant-tell-ablation',
    kind: 'info',
    title: "When a treatment has changed your periods, they can't show your stage",
    text: 'The 12-month rule relies on natural periods. If a treatment has stopped or changed your bleeding, ask your clinician how they would check your stage from your age and symptoms.',
    sources: ['nice-ng23-recommendations'],
  },
};

export function calculateMenopauseAgeContext(input: MenopauseAgeInput, now: Date = new Date()): MenopauseAgeResult {
  const { age, fromBirthYear } = resolveAge(input, now);
  const notes: ContextNote[] = [];
  const { from, to } = MENOPAUSE_AGE_FACTS.typicalRange;

  if (age === null) {
    return { ready: false, age: null, ageFromBirthYear: false, band: null, yearsToRangeStart: 0, yearsPastRange: 0, twelveMonth: null, notes };
  }

  const band = ageBand(age);
  const stopped = input.periods === 'stopped';
  const twelveMonth = stopped && input.lastPeriodIso ? twelveMonthMark(input.lastPeriodIso, now) : null;

  // Age-band notes. Under 45 with periods stopped is a "check" note.
  if (band === 'under-40') {
    notes.push(
      stopped
        ? {
            id: 'under-40-stopped',
            kind: 'check',
            title: 'Periods stopping before 40 needs a check',
            text: 'Menopause before 40 is called premature menopause, or primary ovarian insufficiency (POI). See a doctor: UK NICE guidance says POI is diagnosed from symptoms, such as no or infrequent periods, plus raised FSH on 2 blood tests taken 4 to 6 weeks apart.',
            sources: ['owh-early-premature-menopause-2026', 'nice-ng23-recommendations'],
          }
        : {
            id: 'under-40',
            kind: 'info',
            title: 'Under 40',
            text: 'Menopause before 40 is called premature menopause (primary ovarian insufficiency). If your periods stop or become irregular before 45, the US Office on Women\'s Health says to tell your provider.',
            sources: ['owh-early-premature-menopause-2026'],
          },
    );
  } else if (band === 'early-40-44') {
    notes.push(
      stopped
        ? {
            id: 'early-40-44-stopped',
            kind: 'check',
            title: 'Periods stopping between 40 and 44: tell your doctor',
            text: 'Menopause between 40 and 44 is called early menopause. The US Office on Women\'s Health says to tell your provider if your periods stop or become irregular before 45. UK NICE guidance says an FSH blood test may be considered at 40 to 45 to help confirm menopause.',
            sources: ['owh-early-premature-menopause-2026', 'nice-ng23-recommendations'],
          }
        : {
            id: 'early-40-44',
            kind: 'info',
            title: 'Between 40 and 44',
            text: 'Menopause at 40 to 44 is called early menopause. In a US national survey, 11.8% of women with natural menopause reported it between 40 and 45. If your periods stop or become irregular before 45, tell your provider.',
            sources: ['owh-early-premature-menopause-2026', 'appiah-menopause-age-trends-2021'],
          },
    );
  } else if (band === 'over-55') {
    notes.push({
      id: 'over-55',
      kind: 'info',
      title: 'Past the most common range',
      text: `${from} to ${to} is the most common range, not a limit, so some people reach menopause after ${to}. If you're unsure what your bleeding means, ask a clinician.`,
      sources: ['medlineplus-menopause-2026'],
    });
  }

  // Periods-status notes.
  if (stopped && twelveMonth?.valid && twelveMonth.reached) {
    notes.push({
      id: 'twelve-months-reached',
      kind: 'info',
      title: "You've passed 12 months without a period",
      text: 'If you are 45 or over and not using hormonal contraception, NICE guidance identifies menopause after 12 months without a period. Any vaginal bleeding or spotting from now on should be checked by a doctor, even a small amount.',
      sources: ['nice-ng23-recommendations', 'nhs-postmenopausal-bleeding'],
    });
  }
  if (input.periods === 'cant-tell' && input.cantTellReason) notes.push(CANT_TELL_NOTES[input.cantTellReason]);

  // Factors linked to earlier menopause: stated only as the sources state them.
  if (input.mothersAge != null && Number.isFinite(input.mothersAge) && input.mothersAge >= 20 && input.mothersAge <= 70) {
    const m = Math.floor(input.mothersAge);
    notes.push(
      m < from
        ? {
            id: 'family-early',
            kind: 'info',
            title: `Your mother reached menopause at ${m}`,
            text: 'That counts as early menopause in your family. The NHS and Mayo Clinic say early menopause is more likely if it runs in your family. It raises the chance, but it does not set your own age.',
            sources: ['nhs-early-menopause', 'mayo-perimenopause-symptoms-causes-2026'],
          }
        : {
            id: 'family-typical',
            kind: 'info',
            title: `Your mother reached menopause at ${m}`,
            text: "The sources we use link a family history of early menopause (before 45) with earlier menopause, but none gives a way to turn your mother's age into a prediction for you.",
            sources: ['nhs-early-menopause', 'mayo-perimenopause-symptoms-causes-2026'],
          },
    );
  }
  if (input.smoking === 'current' || input.smoking === 'past') {
    notes.push({
      id: 'smoking',
      kind: 'info',
      title: input.smoking === 'current' ? 'You smoke' : 'You used to smoke',
      text: 'Mayo Clinic says menopause comes 1 to 2 years earlier in people who smoke, and a US national survey linked current and former smoking with earlier natural menopause. These are averages across groups, not a prediction for you.',
      sources: ['mayo-perimenopause-symptoms-causes-2026', 'appiah-menopause-age-trends-2021'],
    });
  }
  if (input.cancerTreatment) {
    notes.push({
      id: 'cancer-treatment',
      kind: 'info',
      title: 'Chemotherapy or pelvic radiation',
      text: 'The NHS and Mayo Clinic list chemotherapy and radiotherapy among the causes of early menopause. Your cancer care team knows your treatment and can tell you more about what it may mean for you.',
      sources: ['nhs-early-menopause', 'mayo-perimenopause-symptoms-causes-2026'],
    });
  }
  if (input.ovariesRemoved) {
    notes.push({
      id: 'ovaries-removed',
      kind: 'info',
      title: 'Surgery to remove both ovaries',
      text: 'Removing both ovaries brings on menopause (MedlinePlus). The National Institute on Aging says that without hormones, periods stop and menopause symptoms may start right away. The age ranges here describe natural menopause.',
      sources: ['medlineplus-menopause-2026', 'nia-what-is-menopause'],
    });
  }

  return {
    ready: true,
    age,
    ageFromBirthYear: fromBirthYear,
    band,
    yearsToRangeStart: Math.max(0, from - age),
    yearsPastRange: Math.max(0, age - to),
    twelveMonth,
    notes,
  };
}
