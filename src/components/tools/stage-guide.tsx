'use client';

import { useEffect, useMemo, useRef, type RefObject } from 'react';
import Link from 'next/link';
import { UrgentGuidance } from '@/components/safety/urgent-guidance';
import { markToolUsed } from '@/lib/pwa/install-gate';
import { useToolState, savedLabel } from '@/components/storage/use-tool-state';
import { ToolHistory, type HistoryEntry } from '@/components/storage/tool-history';
import { btnDanger, btnPrimary, btnSecondary } from '@/components/storage/styles';
import {
  DEFAULT_STATE,
  LIMITS,
  QUESTIONS,
  TRACKER_LINKS,
  answer,
  answerSummary,
  computeResult,
  hasAnyAnswer,
  isAnswered,
  isComplete,
  nextStep,
  normalize,
  previousStep,
  progress,
  quizPdfInput,
  resultSections,
  selectedValues,
  shortStageLabel,
  summarize,
  urgentFor,
  type QuestionId,
  type StageQuizState,
  type Step,
} from '@/lib/tools/stage-quiz';

const card = 'rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)] p-4';
const option =
  'flex min-h-[56px] cursor-pointer items-center gap-3 rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper)] px-4 py-3 has-[:checked]:border-[var(--color-accent)] has-[:checked]:bg-[var(--color-accent-soft)] has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-[var(--color-accent)]';
const link = 'font-semibold text-[var(--color-link)] underline';

/** How her result has changed between saved answer sets. */
function StageTimeline({ entries }: { entries: HistoryEntry<StageQuizState>[] }) {
  return (
    <figure className="space-y-2">
      <figcaption className="font-semibold">How your result has changed</figcaption>
      <ol className="space-y-1 border-l-2 border-[var(--color-accent)] pl-4 text-sm">
        {entries.map((e) => (
          <li key={e.id}>
            <span className="text-[var(--color-ink-muted)]">{e.date}:</span>{' '}
            {isComplete(e.data) ? shortStageLabel(computeResult(e.data).stage) : 'quiz not finished'}
          </li>
        ))}
      </ol>
    </figure>
  );
}

/**
 * "Where am I?" stage quiz: one question per screen, then the STRAW+10 stage
 * her answers resemble, with NICE NG23 notes, limits and next steps. All rules
 * and copy live in src/lib/tools/stage-quiz.ts. Answers autosave in this
 * browser (IndexedDB); print and PDF are made on the device. Nothing is sent
 * anywhere, and it never asks for an email.
 */
export function StageGuide({ liveUrls, trackerLive = false }: { liveUrls?: string[]; trackerLive?: boolean }) {
  const { state, update, reset, status } = useToolState('stage-guide', DEFAULT_STATE, normalize);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);

  // Move focus to the new heading only after she navigates, never on page load.
  useEffect(() => {
    if (!moved.current) return;
    moved.current = false;
    headingRef.current?.focus();
  }, [state.step]);

  const go = (step: Step) => {
    moved.current = true;
    update((prev) => ({ ...prev, step }));
  };

  const clear = () => {
    moved.current = true;
    void reset();
  };

  const urgentNow = useMemo(() => urgentFor(state), [state]);
  const live = useMemo(() => (liveUrls ? new Set(liveUrls) : null), [liveUrls]);
  const anyAnswer = hasAnyAnswer(state);

  return (
    <div className="space-y-6" data-tool-ui="stage-guide">
      <p className="no-print text-[var(--color-ink-muted)]">
        A few short questions about your age, your periods and hot flashes. Your answers are saved in this browser on
        this device and are never sent anywhere.
      </p>

      {state.step === 'result' ? (
        <Result state={state} headingRef={headingRef} live={live} trackerLive={trackerLive} onBack={() => go(previousStep(state))} />
      ) : (
        <QuestionScreen
          id={state.step}
          state={state}
          headingRef={headingRef}
          onAnswer={(value) => update((prev) => answer(prev, prev.step as QuestionId, value))}
          onNext={() => go(nextStep(state))}
          onBack={() => go(previousStep(state))}
          urgent={urgentNow}
        />
      )}

      <p className={`no-print text-sm ${status.error ? 'font-semibold text-[var(--color-urgent)]' : 'text-[var(--color-ink-muted)]'}`}>
        {savedLabel(status)}
      </p>
      {anyAnswer && (
        <button type="button" onClick={clear} className={`no-print ${btnDanger}`}>
          Clear my answers
        </button>
      )}

      <ToolHistory
        tool="stage-guide"
        noun="answer set"
        current={state}
        canSave={isComplete(state)}
        normalize={normalize}
        summarize={summarize}
        onOpen={(data) => {
          moved.current = true;
          update(data);
        }}
        renderInsights={(entries) => <StageTimeline entries={entries} />}
      />
    </div>
  );
}

function QuestionScreen({
  id,
  state,
  headingRef,
  onAnswer,
  onNext,
  onBack,
  urgent,
}: {
  id: QuestionId;
  state: StageQuizState;
  headingRef: RefObject<HTMLHeadingElement | null>;
  onAnswer: (value: string) => void;
  onNext: () => void;
  onBack: () => void;
  urgent: ReturnType<typeof urgentFor>;
}) {
  const q = QUESTIONS[id];
  const { index, total } = progress(state);
  const chosen = selectedValues(state, id);
  const answered = isAnswered(state, id);
  const last = nextStep(state) === 'result';

  return (
    <form
      className="no-print space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (answered) onNext();
      }}
    >
      <p id="stage-quiz-progress" className="font-semibold text-[var(--color-ink-muted)]">
        Question {index} of {total}
      </p>
      <fieldset className={`space-y-3 ${card}`} aria-describedby={q.help ? 'stage-quiz-progress stage-quiz-help' : 'stage-quiz-progress'}>
        <legend className="px-1">
          <h2 ref={headingRef} tabIndex={-1} className="font-serif text-2xl font-semibold">
            {q.text}
          </h2>
        </legend>
        {q.help && (
          <p id="stage-quiz-help" className="text-[var(--color-ink-muted)]">
            {q.help}
          </p>
        )}
        {q.options.map((o) => (
          <label key={o.value} className={option}>
            <input
              type={q.kind === 'multi' ? 'checkbox' : 'radio'}
              name={`stage-quiz-${q.id}`}
              value={o.value}
              checked={chosen.includes(o.value)}
              onChange={() => onAnswer(o.value)}
              className="h-6 w-6 shrink-0 accent-[var(--color-accent)]"
            />
            <span>{o.label}</span>
          </label>
        ))}
      </fieldset>

      {/* Safety first: guidance appears the moment a red flag is ticked. */}
      {id === 'safety' && <UrgentGuidance triggers={urgent} />}

      <div className="flex flex-wrap items-center gap-3">
        {index > 1 && (
          <button type="button" onClick={onBack} className={`min-h-[56px] ${btnSecondary}`}>
            Back
          </button>
        )}
        <button type="submit" disabled={!answered} aria-describedby={answered ? undefined : 'stage-quiz-hint'} className={`min-h-[56px] ${btnPrimary}`}>
          {last ? 'See my result' : 'Next'}
        </button>
        {!answered && (
          <span id="stage-quiz-hint" className="text-sm text-[var(--color-ink-muted)]">
            Choose an answer to continue.
          </span>
        )}
      </div>
    </form>
  );
}

function Result({
  state,
  headingRef,
  live,
  trackerLive,
  onBack,
}: {
  state: StageQuizState;
  headingRef: RefObject<HTMLHeadingElement | null>;
  live: Set<string> | null;
  trackerLive: boolean;
  onBack: () => void;
}) {
  const result = computeResult(state);
  const sections = resultSections(result);
  const links = result.links.filter((l) => !live || live.has(l.href));

  return (
    <section aria-labelledby="stage-quiz-result" aria-live="polite" className="space-y-4">
      <h2 id="stage-quiz-result" ref={headingRef} tabIndex={-1} className="text-2xl">
        Your result
      </h2>

      {/* Safety first: urgent guidance renders before anything else. */}
      <UrgentGuidance triggers={result.urgent} />

      <div className={`space-y-4 ${card}`}>
        {sections.map((c, i) => (
          <div key={c.title} className="space-y-2">
            {i === 0 ? (
              <p className="font-serif text-xl font-semibold">{c.title}</p>
            ) : (
              <h3 className="font-semibold">{c.title}</h3>
            )}
            {c.paragraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <h3 className="font-semibold">What this can’t tell you</h3>
        <ul className="list-disc space-y-1 pl-6">
          {LIMITS.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </div>

      <div className="space-y-2">
        <h3 className="font-semibold">Your answers</h3>
        <dl className="space-y-1">
          {answerSummary(state).map(([q, a]) => (
            <div key={q} className="flex flex-wrap gap-x-2">
              <dt className="text-[var(--color-ink-muted)]">{q}</dt>
              <dd className="font-semibold">{a}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="no-print space-y-2">
        <h3 className="font-semibold">Next steps</h3>
        <ul className="space-y-1">
          {links.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className={`tap ${link}`}>
                {l.label}
              </Link>
            </li>
          ))}
          {trackerLive &&
            TRACKER_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className={`tap ${link}`}>
                  {l.label}
                </Link>
              </li>
            ))}
        </ul>
      </div>

      <div className="no-print flex flex-wrap gap-3">
        <button type="button" onClick={onBack} className={`min-h-[56px] ${btnSecondary}`}>
          Back
        </button>
        <button
          type="button"
          onClick={() => {
            markToolUsed();
            window.print();
          }}
          className={`min-h-[56px] ${btnPrimary}`}
        >
          Print summary for my appointment
        </button>
        <button
          type="button"
          onClick={async () => {
            markToolUsed();
            const { quizSummaryPdf, downloadSimplePdf } = await import('@/lib/tools/simple-pdf');
            downloadSimplePdf(quizSummaryPdf(quizPdfInput(state)), 'stage-quiz');
          }}
          className={`min-h-[56px] ${btnSecondary}`}
        >
          Download PDF
        </button>
      </div>
    </section>
  );
}
