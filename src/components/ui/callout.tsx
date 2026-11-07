import { useId } from 'react';
import { CopyButton } from './copy-button';
import { PrintButton } from './print-button';

/**
 * Callouts. Server components; only "Ask your doctor" adds a tiny copy island.
 * Each kind has its own look and a default title, so readers learn them:
 *  answer   Short answer (serif pull-quote)
 *  try      Try tonight (brass, italic numerals)
 *  redflag  See a doctor if… (the red-flag style, used sparingly)
 *  ask      Ask your doctor (with Copy questions)
 *  evidence What the evidence says
 *  comfort  Comfort, not treatment
 *  careful  Who should be careful
 */
export type CalloutKind = 'answer' | 'try' | 'redflag' | 'ask' | 'evidence' | 'comfort' | 'careful';

const DEFAULT_TITLE: Record<CalloutKind, string> = {
  answer: 'Short answer',
  try: 'Try tonight',
  redflag: 'See a doctor if…',
  ask: 'Ask your doctor',
  evidence: 'What the evidence says',
  comfort: 'Comfort, not treatment',
  careful: 'Who should be careful',
};

function CalloutIcon({ kind }: { kind: CalloutKind }) {
  const p = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };
  switch (kind) {
    case 'try':
      return (
        <svg {...p}>
          <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z" />
        </svg>
      );
    case 'redflag':
      return (
        <svg {...p}>
          <path d="M12 3 2.5 20h19L12 3Z" />
          <path d="M12 10v4.5M12 17.5v.01" />
        </svg>
      );
    case 'ask':
      return (
        <svg {...p}>
          <path d="M4 5h16v11H9l-5 4V5Z" />
          <path d="M9.5 9.2a2.5 2.5 0 1 1 3.2 2.4c-.5.2-.7.6-.7 1v.2" />
        </svg>
      );
    case 'evidence':
      return (
        <svg {...p}>
          <path d="M5 4h10l4 4v12H5V4Z" />
          <path d="M9 12h6M9 16h6M9 8h3" />
        </svg>
      );
    case 'comfort':
      return (
        <svg {...p}>
          <path d="M12 20s-7-4-7-9a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5-7 9-7 9Z" />
        </svg>
      );
    case 'careful':
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7.5v5.5M12 16.5v.01" />
        </svg>
      );
    default:
      return null;
  }
}

export function Callout({
  kind,
  title,
  children,
  actions,
  headingLevel = 2,
}: {
  kind: CalloutKind;
  title?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  headingLevel?: 2 | 3 | 4;
}) {
  const id = useId();
  const H = `h${headingLevel}` as 'h2';
  return (
    <section className={`callout callout-${kind}`} aria-labelledby={id}>
      <H id={id} className="callout-title">
        <CalloutIcon kind={kind} />
        {title ?? DEFAULT_TITLE[kind]}
      </H>
      {children}
      {actions && <div className="callout-actions">{actions}</div>}
    </section>
  );
}

/** "Ask your doctor" with the questions as a list, Copy and (optionally) Print. */
export function AskDoctor({
  questions,
  title,
  printable = true,
}: {
  questions: string[];
  title?: string;
  printable?: boolean;
}) {
  const id = useId();
  const listId = `${id}-q`;
  return (
    <Callout
      kind="ask"
      title={title}
      actions={
        <>
          <CopyButton targetId={listId} label="Copy questions" />
          {printable && <PrintButton />}
        </>
      }
    >
      <ol id={listId}>
        {questions.map((q) => (
          <li key={q}>{q}</li>
        ))}
      </ol>
    </Callout>
  );
}
