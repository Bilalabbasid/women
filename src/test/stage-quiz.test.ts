import { describe, it, expect } from 'vitest';
import {
  DEFAULT_STATE,
  QUESTIONS,
  answer,
  answerSummary,
  computeResult,
  firstUnanswered,
  isComplete,
  nextStep,
  normalize,
  previousStep,
  progress,
  quizPdfInput,
  resultSections,
  STAGE_COPY,
  LIMITS,
  visibleQuestions,
  type QuestionId,
  type StageId,
  type StageQuizState,
} from '@/lib/tools/stage-quiz';
import { quizSummaryPdf } from '@/lib/tools/simple-pdf';

/** Answer questions in order, the way the quiz asks them. */
function play(answers: Partial<Record<QuestionId, string | string[]>>): StageQuizState {
  let s: StageQuizState = { ...DEFAULT_STATE };
  while (s.step !== 'result') {
    const id: QuestionId = s.step;
    const a = answers[id];
    if (a === undefined) throw new Error(`no answer given for ${id}`);
    for (const v of Array.isArray(a) ? a : [a]) s = answer(s, id, v);
    s = { ...s, step: nextStep(s) };
  }
  return s;
}

const natural = { age: '45_plus', context: 'natural_cycles', vasomotor: 'no', safety: 'none' } as const;

describe('stage quiz mapping', () => {
  const cases: Array<[StageId, Partial<Record<QuestionId, string | string[]>>]> = [
    ['postmenopause', { ...natural, noPeriod12: 'yes' }],
    ['late_transition', { ...natural, noPeriod12: 'no', gap60: 'yes' }],
    ['early_transition', { ...natural, noPeriod12: 'no', gap60: 'no', variation: 'varied_7_plus_days' }],
    ['late_reproductive', { ...natural, noPeriod12: 'no', gap60: 'no', variation: 'regular' }],
    ['not_enough_info', { ...natural, noPeriod12: 'no', gap60: 'not_sure', variation: 'not_sure' }],
    ['cycle_rules_dont_apply', { ...natural, context: 'hormonal_contraception' }],
    ['cycle_rules_dont_apply', { ...natural, context: 'hysterectomy' }],
    ['under_40', { ...natural, age: 'under_40', noPeriod12: 'no', gap60: 'yes' }],
  ];

  it.each(cases)('reaches %s', (stage, answers) => {
    const s = play(answers);
    expect(isComplete(s)).toBe(true);
    expect(computeResult(s).stage).toBe(stage);
  });

  it('can reach every stage', () => {
    const reached = new Set(cases.map(([, a]) => computeResult(play(a)).stage));
    expect([...reached].sort()).toEqual(Object.keys(STAGE_COPY).sort());
  });

  it('asks 7 questions on the longest path and skips what no longer applies', () => {
    expect(visibleQuestions(play({ ...natural, noPeriod12: 'no', gap60: 'no', variation: 'regular' }))).toHaveLength(7);
    expect(visibleQuestions(play({ ...natural, noPeriod12: 'no', gap60: 'yes' }))).not.toContain('variation');
    expect(visibleQuestions(play({ ...natural, noPeriod12: 'yes' }))).toEqual(['age', 'context', 'noPeriod12', 'vasomotor', 'safety']);
  });

  it('skips the period questions for hormonal contraception and shows why the stages do not apply', () => {
    const s = play({ ...natural, context: 'hormonal_contraception' });
    expect(visibleQuestions(s)).toEqual(['age', 'context', 'vasomotor', 'safety']);
    const r = computeResult(s);
    expect(r.patternStage).toBeNull();
    expect(resultSections(r)[0].paragraphs.join(' ')).toMatch(/rely on natural periods/);
    expect(r.links.map((l) => l.href)).toContain('/perimenopause/contraception/');
  });

  it('ignores answers to questions that were later skipped', () => {
    let s = play({ ...natural, noPeriod12: 'no', gap60: 'yes' });
    s = answer(s, 'noPeriod12', 'yes');
    expect(computeResult(s).stage).toBe('postmenopause');
    expect(answerSummary(s).map(([q]) => q)).not.toContain(QUESTIONS.gap60.short);
  });

  it('under 40 leads with the POI note and keeps the period pattern only as background', () => {
    const r = computeResult(play({ ...natural, age: 'under_40', noPeriod12: 'no', gap60: 'no', variation: 'varied_7_plus_days' }));
    expect(r.stage).toBe('under_40');
    expect(r.patternStage).toBe('early_transition');
    const text = resultSections(r).map((c) => [c.title, ...c.paragraphs].join(' ')).join(' ');
    expect(text).toMatch(/premature ovarian insufficiency/);
    expect(text).toMatch(/background only/);
    expect(r.links.map((l) => l.href)).toContain('/groups/premature-ovarian-insufficiency/');
  });

  it('under 40 with hormonal contraception still explains that the period stages do not apply', () => {
    const r = computeResult(play({ ...natural, age: 'under_40', context: 'hormonal_contraception' }));
    expect(r.stage).toBe('under_40');
    expect(r.notes).toContain('cycle_rules_dont_apply');
  });

  it('adds the NICE 45+ note only at 45+ with new hot flashes and a transition pattern', () => {
    const base = { ...natural, vasomotor: 'yes', noPeriod12: 'no', gap60: 'yes' };
    expect(computeResult(play(base)).notes).toContain('nice_45_plus');
    expect(computeResult(play({ ...base, age: '40_to_44' })).notes).not.toContain('nice_45_plus');
    expect(computeResult(play({ ...base, vasomotor: 'no' })).notes).not.toContain('nice_45_plus');
    expect(computeResult(play({ ...base, noPeriod12: 'yes' })).notes).not.toContain('nice_45_plus');
  });

  it('notes when something else may affect periods', () => {
    const r = computeResult(play({ ...natural, context: 'other_or_unsure', noPeriod12: 'yes' }));
    expect(r.stage).toBe('postmenopause');
    expect(r.notes[0]).toBe('other_or_unsure');
  });
});

describe('stage quiz red flags', () => {
  const triggers = (flags: string[]) => computeResult(play({ ...natural, noPeriod12: 'yes', safety: flags })).urgent.map((t) => t.id);

  it('turns each red flag into the existing urgent guidance', () => {
    expect(triggers(['postmenopausal_bleeding'])).toEqual(['bleeding_after_menopause']);
    expect(triggers(['heavy_flow'])).toEqual(['heavy_or_unusual_bleeding']);
    expect(triggers(['palpitations'])).toEqual(['palpitations_red_flags']);
    expect(triggers(['low_mood'])).toEqual(['self_harm_thoughts']);
    expect(triggers(['none'])).toEqual([]);
  });

  it('"None of these" and the red flags exclude each other', () => {
    let s = answer({ ...DEFAULT_STATE }, 'safety', 'heavy_flow');
    s = answer(s, 'safety', 'none');
    expect(s.redFlags).toEqual([]);
    expect(s.noRedFlags).toBe(true);
    s = answer(s, 'safety', 'low_mood');
    expect(s.noRedFlags).toBe(false);
    expect(s.redFlags).toEqual(['low_mood']);
  });

  it('puts urgent guidance first in the PDF text', () => {
    const s = play({ ...natural, noPeriod12: 'yes', safety: ['postmenopausal_bleeding'] });
    const pdf = quizPdfInput(s);
    expect(pdf.explanation.startsWith('Bleeding after menopause:')).toBe(true);
    expect(pdf.caveat).toBe(LIMITS.join(' '));
    const spec = quizSummaryPdf(pdf);
    expect(spec.title).toBe(STAGE_COPY.postmenopause.title);
  });
});

describe('stage quiz navigation and saved answers', () => {
  it('counts progress and moves back and forth', () => {
    let s = answer({ ...DEFAULT_STATE }, 'age', '45_plus');
    expect(progress(s)).toEqual({ index: 1, total: 7 });
    s = { ...s, step: nextStep(s) };
    s = answer(s, 'context', 'natural_cycles');
    expect(progress(s)).toEqual({ index: 2, total: 7 });
    s = answer(s, 'context', 'hormonal_contraception');
    expect(progress(s)).toEqual({ index: 2, total: 4 });
    s = answer(s, 'context', 'natural_cycles');
    s = { ...s, step: nextStep(s) };
    s = answer(s, 'noPeriod12', 'yes');
    expect(progress(s)).toEqual({ index: 3, total: 5 });
    expect(previousStep(s)).toBe('context');
    expect(previousStep({ ...DEFAULT_STATE })).toBe('age');
  });

  it('reads every answer saved by the old one-page guide', () => {
    const old = { ageGroup: '45_plus', cycleContext: 'natural_cycles', cyclePattern: 'varied_7_plus_days', hasVasomotor: true, redFlags: [] };
    const s = normalize(old);
    expect(s).toMatchObject({ version: 2, noPeriod12: 'no', gap60: 'no', cycleVariation: 'varied_7_plus_days', vasomotor: 'yes' });
    // The old guide had no "None of these", so she resumes at the safety check.
    expect(s.step).toBe('safety');
    expect(normalize({ ...old, cyclePattern: 'none_12_plus_months' }).noPeriod12).toBe('yes');
    expect(normalize({ ...old, cyclePattern: 'skipped_60_plus_days' })).toMatchObject({ noPeriod12: 'no', gap60: 'yes' });
    const finished = normalize({ ...old, redFlags: ['heavy_flow'] });
    expect(finished.step).toBe('result');
    expect(computeResult(finished).stage).toBe('early_transition');
  });

  it('never crashes on broken or partial saved data', () => {
    for (const raw of [null, undefined, 42, 'x', [], { ageGroup: 'nope', redFlags: 'x', step: 'nowhere' }, { version: 2, step: 'result' }]) {
      const s = normalize(raw);
      expect(s.step).toBe(firstUnanswered(s));
      expect(() => computeResult(s)).not.toThrow();
    }
    expect(normalize({ ageGroup: '45_plus' }).step).toBe('context');
    expect(normalize({ redFlags: ['low_mood', 'made_up', 'low_mood'] }).redFlags).toEqual(['low_mood']);
  });

  it('keeps a saved step she has reached, but not one past an unanswered question', () => {
    const s = play({ ...natural, noPeriod12: 'yes' });
    expect(normalize({ ...s, step: 'context' }).step).toBe('context');
    expect(normalize({ ...s, step: 'result' }).step).toBe('result');
    expect(normalize({ ...s, vasomotor: '', step: 'result' }).step).toBe('vasomotor');
  });
});

describe('stage quiz copy', () => {
  it('never diagnoses, scores or prescribes, and uses US spelling', () => {
    const all = JSON.stringify({ STAGE_COPY, LIMITS, QUESTIONS });
    expect(all).not.toMatch(/\byou have\b|\byour score\b|\byou should take\b|\bdose\b/i);
    expect(all).not.toMatch(/gynaecolog|oestr|flushes|colour|centre/i);
  });
});
