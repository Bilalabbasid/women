'use client';

import { useMemo } from 'react';
import { evaluateUrgentTriggers } from '@/lib/safety/urgent-triggers';
import { UrgentGuidance } from '@/components/safety/urgent-guidance';
import { markToolUsed } from '@/lib/pwa/install-gate';
import { useToolState, savedLabel } from '@/components/storage/use-tool-state';
import { ToolHistory } from '@/components/storage/tool-history';
import { btnDanger, btnPrimary, btnSecondary } from '@/components/storage/styles';

export interface QuestionTopic {
  id: string;
  label: string;
  questions: string[];
}

export const QUESTION_TOPICS: readonly QuestionTopic[] = [
  {
    id: 'perimenopause_assessment',
    label: 'Checking whether my symptoms could be perimenopause (and what else to rule out)',
    questions: [
      'Could my recent symptoms and cycle changes be part of perimenopause, and what other causes (such as thyroid function, iron stores, or vitamin deficiencies) should we check?',
      'Given my age and cycle pattern, do we need any blood tests, or can we assess this from my symptoms and medical history (as NICE NG23 recommends at 45 and over)?',
    ],
  },
  {
    id: 'systemic_hrt',
    label: 'Considering systemic hormone therapy (estradiol patches, gels, sprays, or tablets)',
    questions: [
      'Based on my age, time since menopause onset, and personal/family health history, how does the benefit-risk profile of systemic hormone therapy look for me?',
      'What are the differences between transdermal estradiol (patches, gels, sprays) and oral tablets for someone with my cardiovascular and clotting profile?',
      'Because I still have a uterus, which progestogen option (such as micronized progesterone or a hormonal IUD) would protect my uterine lining, and what bleeding pattern should I expect?',
    ],
  },
  {
    id: 'fda_boxed_warning',
    label: 'Understanding the 2025–2026 FDA boxed-warning changes on hormone therapy',
    questions: [
      'How do the 2025–2026 FDA labeling updates — removing cardiovascular, breast cancer, and dementia boxed warnings while keeping timing guidance (<60 or within 10 years of menopause) — apply to my personal risk profile?',
      'What specific warning signs or side effects should prompt me to contact the clinic after starting or adjusting therapy?',
    ],
  },
  {
    id: 'non_hormonal_rx',
    label: 'Exploring non-hormonal options for hot flashes and night sweats',
    questions: [
      'Hormone therapy is not my preference (or is contraindicated for me). Which Level I non-hormonal options — such as SSRIs/SNRIs, gabapentin, oxybutynin, fezolinetant, or elinzanetant — fit my health history?',
      'If we consider an NK3 antagonist such as fezolinetant (Veozah), what is the schedule for baseline and follow-up liver blood tests?',
      'Can you refer me to cognitive behavioral therapy (CBT) tailored to menopausal vasomotor and sleep symptoms?',
    ],
  },
  {
    id: 'gsm_vaginal_health',
    label: 'Treating vaginal dryness, irritation, painful sex, or recurrent urinary symptoms',
    questions: [
      'Which non-hormonal vaginal moisturiser schedule (several times a week) and personal lubricant do you recommend as first-line care?',
      'Would low-dose local vaginal estrogen (cream, tablet, or ring) be appropriate for me, and can it be used safely alongside my current medications?',
    ],
  },
  {
    id: 'bladder_pelvic_floor',
    label: 'Addressing stress or urgency bladder leaks',
    questions: [
      'Can you refer me to a pelvic health physiotherapist for a supervised 3-month pelvic floor muscle training programme (NICE NG123 first-line care)?',
      'Would a mechanical bladder support device or pessary help during exercise while I build pelvic floor strength?',
    ],
  },
  {
    id: 'cost_and_follow_up',
    label: 'Insurance coverage, generics, and follow-up plan',
    questions: [
      'Are FDA-approved generic formulations covered by my pharmacy plan for the option we choose?',
      'When should we review how this plan is working (for example, at 3 months), and how can I message you if side effects or unexpected bleeding occur before then?',
    ],
  },
];

interface BuilderState {
  selectedTopics: string[];
  redFlags: string[];
  customNotes: string;
}

// Nothing pre-ticked: only topics she chooses are saved as hers (DECISIONS.md D-006).
const DEFAULT_STATE: BuilderState = {
  selectedTopics: [],
  redFlags: [],
  customNotes: '',
};

const TOPIC_IDS = new Set(QUESTION_TOPICS.map((t) => t.id));
const MAX_NOTES = 5000;

function normalize(raw: unknown): BuilderState {
  const p = (raw ?? {}) as Partial<BuilderState>;
  return {
    selectedTopics: Array.isArray(p.selectedTopics) ? p.selectedTopics.filter((x): x is string => typeof x === 'string' && TOPIC_IDS.has(x)) : [],
    redFlags: Array.isArray(p.redFlags) ? p.redFlags.filter((x): x is string => typeof x === 'string') : [],
    customNotes: typeof p.customNotes === 'string' ? p.customNotes.slice(0, MAX_NOTES) : '',
  };
}

function summarize(s: BuilderState): string {
  const labels = QUESTION_TOPICS.filter((t) => s.selectedTopics.includes(t.id)).map((t) => t.label);
  const topics = labels.length ? `${labels.length} topic${labels.length === 1 ? '' : 's'}: ${labels.slice(0, 2).join('; ')}${labels.length > 2 ? '; …' : ''}` : 'No topics';
  return s.customNotes.trim() ? `${topics} · your own notes` : topics;
}

export function TreatmentQuestionsBuilder() {
  const { state, update, reset, status } = useToolState('treatment-questions', DEFAULT_STATE, normalize);
  const persist = (next: BuilderState) => update(next);

  const toggleTopic = (id: string) => {
    const exists = state.selectedTopics.includes(id);
    const nextTopics = exists ? state.selectedTopics.filter((x) => x !== id) : [...state.selectedTopics, id];
    persist({ ...state, selectedTopics: nextTopics });
  };

  const toggleRedFlag = (flag: string) => {
    const exists = state.redFlags.includes(flag);
    const nextFlags = exists ? state.redFlags.filter((x) => x !== flag) : [...state.redFlags, flag];
    persist({ ...state, redFlags: nextFlags });
  };

  const urgent = useMemo(
    () =>
      evaluateUrgentTriggers({
        symptomIds: state.redFlags,
        notes: state.customNotes,
      }),
    [state.redFlags, state.customNotes],
  );

  const chosenTopics = useMemo(
    () => QUESTION_TOPICS.filter((t) => state.selectedTopics.includes(t.id)),
    [state.selectedTopics],
  );

  const hasContent = chosenTopics.length > 0 || state.customNotes.trim().length > 0;

  return (
    <div className="space-y-6" data-tool-ui="treatment-questions">
      <form onSubmit={(e) => e.preventDefault()} className="space-y-5" aria-describedby="tq-help">
        <p id="tq-help" className="text-[var(--color-ink-muted)]">
          Choose the topics that matter most for your next appointment, and add any notes of your own. Everything is
          saved in this browser on this device as you go, and never sent anywhere.
        </p>

        <fieldset className="space-y-2 rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)] p-4">
          <legend className="px-1 font-serif text-xl font-semibold">
            1. What do you want to discuss at your appointment?
          </legend>
          {QUESTION_TOPICS.map((topic) => (
            <label key={topic.id} className="tap flex cursor-pointer items-start gap-3 py-1.5">
              <input
                type="checkbox"
                checked={state.selectedTopics.includes(topic.id)}
                onChange={() => toggleTopic(topic.id)}
                className="mt-1 h-5 w-5 shrink-0 accent-[var(--color-accent)]"
              />
              <span>{topic.label}</span>
            </label>
          ))}
        </fieldset>

        <fieldset className="space-y-2 rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)] p-4">
          <legend className="px-1 font-serif text-xl font-semibold">
            2. Do you have any symptoms that should be mentioned first?
          </legend>
          {[
            { id: 'postmenopausal_bleeding', label: 'Any bleeding or spotting after 12+ months without a period' },
            { id: 'heavy_flow', label: 'Heavy periods, bleeding between periods, or bleeding after sex' },
            { id: 'palpitations', label: 'Heart palpitations with chest pain, breathlessness, or dizziness' },
            { id: 'low_mood', label: 'Severe low mood or thoughts of harming yourself' },
          ].map((item) => (
            <label key={item.id} className="tap flex cursor-pointer items-center gap-3 py-1">
              <input
                type="checkbox"
                checked={state.redFlags.includes(item.id)}
                onChange={() => toggleRedFlag(item.id)}
                className="h-5 w-5 shrink-0 accent-[var(--color-accent)]"
              />
              <span>{item.label}</span>
            </label>
          ))}
        </fieldset>

        <div className="rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)] p-4">
          <label htmlFor="tq-custom-notes" className="block font-serif text-xl font-semibold">
            3. Your own questions or personal health history to remember
          </label>
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
            For example: current medications, date of last period, or family history you want to ask about. Stored only
            in your browser.
          </p>
          <textarea
            id="tq-custom-notes"
            rows={3}
            maxLength={MAX_NOTES}
            value={state.customNotes}
            onChange={(e) => persist({ ...state, customNotes: e.target.value })}
            placeholder="Write any extra questions or context for your clinician..."
            className="mt-2 w-full rounded-lg border border-[var(--color-rule)] bg-[var(--color-paper)] p-3"
          />
        </div>
      </form>

      <section aria-labelledby="tq-output-heading" aria-live="polite" className="space-y-4">
        <h2 id="tq-output-heading" className="text-2xl">
          Your printable appointment sheet
        </h2>

        {/* Safety first */}
        <UrgentGuidance triggers={urgent} />

        {!hasContent ? (
          <p>Tick at least one topic above or add your own notes to generate your appointment sheet.</p>
        ) : (
          <div className="space-y-4 rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)] p-5">
            {chosenTopics.map((topic) => (
              <div key={topic.id} className="space-y-1.5">
                <h3 className="text-lg font-semibold">{topic.label}</h3>
                <ul className="list-disc space-y-1 pl-6">
                  {topic.questions.map((q) => (
                    <li key={q}>{q}</li>
                  ))}
                </ul>
              </div>
            ))}

            {state.customNotes.trim() && (
              <div className="space-y-1.5 border-t border-[var(--color-rule)] pt-3">
                <h3 className="text-lg font-semibold">My own questions and context</h3>
                <p className="whitespace-pre-wrap">{state.customNotes}</p>
              </div>
            )}

            <p className="text-sm text-[var(--color-ink-muted)]">
              Prepared with MenoVerdict. This sheet is a conversation aid for a medical appointment and does not
              recommend any specific medication or dose.
            </p>
          </div>
        )}

        <p className={`no-print text-sm ${status.error ? 'font-semibold text-[var(--color-urgent)]' : 'text-[var(--color-ink-muted)]'}`}>
          {savedLabel(status)}
        </p>

        <div className="no-print flex flex-wrap gap-3">
          <button
            type="button"
            disabled={!hasContent}
            onClick={() => {
              markToolUsed();
              window.print();
            }}
            className={btnPrimary}
          >
            Print my question sheet
          </button>
          <button
            type="button"
            onClick={async () => {
              markToolUsed();
              const { appointmentKitPdf, downloadSimplePdf } = await import('@/lib/tools/simple-pdf');
              const topics = QUESTION_TOPICS.filter((t) => state.selectedTopics.includes(t.id)).map((t) => ({ label: t.label, questions: [...t.questions] }));
              downloadSimplePdf(appointmentKitPdf(topics, state.customNotes), 'appointment-kit');
            }}
            className={btnSecondary}
          >
            Download my 10-minute appointment kit (PDF)
          </button>
          {(hasContent || state.redFlags.length > 0) && (
            <button type="button" onClick={() => void reset()} className={btnDanger}>
              Clear my current sheet
            </button>
          )}
        </div>
      </section>

      <ToolHistory
        tool="treatment-questions"
        noun="question sheet"
        current={state}
        canSave={hasContent}
        normalize={normalize}
        summarize={summarize}
        onOpen={(data) => update(data)}
      />
    </div>
  );
}

