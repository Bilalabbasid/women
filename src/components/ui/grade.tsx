import Link from 'next/link';
import type { EvidenceGrade } from '@/lib/content/schema';
import { GRADE_LABELS } from '@/lib/grades/labels';
import { AI_GRADE_NOTE } from '@/lib/site/honesty';

/**
 * Grade meter and badge. Server components, no JavaScript: "What does this
 * mean?" opens a native [popover] (rendered once per page by <GradeExplainers/>).
 *
 * The 5-step scale, lowest to highest. Comfort only and "graded per option" sit
 * off the scale and render as a badge instead of a meter.
 */
export const GRADE_SCALE = ['harm_concern', 'not_supported', 'limited', 'moderate', 'strong'] as const;
type ScaleGrade = (typeof GRADE_SCALE)[number];

const SHORT_LABEL: Record<EvidenceGrade, string> = {
  strong: 'Strong',
  moderate: 'Moderate',
  limited: 'Limited',
  not_supported: 'Not supported',
  harm_concern: 'Harm concern',
  comfort_only: 'Comfort only',
  per_option: 'Graded per option',
};

/** Plain-language meaning, from /evidence/how-we-grade/. */
export const GRADE_MEANING: Record<Exclude<EvidenceGrade, 'per_option'>, string> = {
  strong:
    'Several good randomized trials agree that it works, or medical guidelines recommend it.',
  moderate:
    'At least one good randomized trial, or consistent studies, show it helps, but the studies are smaller or shorter than we would like.',
  limited:
    'The results disagree, the studies are small, or the benefit only shows up in how people say they feel.',
  not_supported: 'Good trials found it worked no better than a placebo (a dummy treatment).',
  harm_concern: 'There is credible evidence that the risks may outweigh any benefit.',
  comfort_only:
    'It may make you feel more comfortable, but it does not treat the cause. That can still be worth having.',
};

export const explainerId = (g: EvidenceGrade) => `grade-explain-${g}`;

export function GradeIcon({ grade }: { grade: EvidenceGrade }) {
  const common = {
    viewBox: '0 0 16 16',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2.4,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };
  switch (grade) {
    case 'strong':
      // Double tick: distinct from Moderate's single tick without relying on colour.
      return (
        <svg {...common} strokeWidth={2}>
          <path d="M1.8 8.6l2.6 2.6 5-6" />
          <path d="M7.6 10.6l.6.6 6-7" />
        </svg>
      );
    case 'moderate':
      return (
        <svg {...common}>
          <path d="M4 8.5l2.5 2.5L12 5" />
        </svg>
      );
    case 'limited':
      return (
        <svg {...common}>
          <path d="M4 8h8" />
        </svg>
      );
    case 'not_supported':
      return (
        <svg {...common}>
          <path d="M5 5l6 6M11 5l-6 6" />
        </svg>
      );
    case 'harm_concern':
      return (
        <svg {...common}>
          <path d="M8 3.5v5.5" />
          <path d="M8 12.2v.3" />
        </svg>
      );
    case 'comfort_only':
      return (
        <svg {...common} strokeWidth={2}>
          <path d="M8 12.5S3.5 10 3.5 6.8A2.3 2.3 0 0 1 8 5.6a2.3 2.3 0 0 1 4.5 1.2C12.5 10 8 12.5 8 12.5Z" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <path d="M5 8h6" />
        </svg>
      );
  }
}

const isScale = (g: EvidenceGrade): g is ScaleGrade => (GRADE_SCALE as readonly string[]).includes(g);

/**
 * The grade meter: 5 segments with the current one marked, plus icon and word.
 * `use` names what the grade is for ("for hot flashes"), read by screen readers.
 */
export function GradeMeter({
  grade,
  size = 'sm',
  use,
  explain = true,
  showScale = false,
}: {
  grade: EvidenceGrade;
  size?: 'sm' | 'lg';
  use?: string;
  /** Show the "What does this mean?" button (needs <GradeExplainers/> on the page). */
  explain?: boolean;
  /** Show "Harm … Strong" end labels under a large meter. */
  showScale?: boolean;
}) {
  if (!isScale(grade)) return <GradeBadge grade={grade} explain={explain} />;
  const step = GRADE_SCALE.indexOf(grade);
  const label = GRADE_LABELS[grade];
  return (
    <div className={`meter g-${grade}${size === 'lg' ? ' meter-lg' : ''}`}>
      <div
        className="meter-track"
        role="img"
        aria-label={`Evidence grade${use ? ` ${use}` : ''}: ${label}, ${step + 1} of 5 on our scale from harm concern to strong evidence`}
      >
        {GRADE_SCALE.map((g, i) => (
          <span key={g} className={`meter-seg${i === step ? ' is-on' : i < step ? ' is-below' : ''}`} />
        ))}
      </div>
      {showScale && (
        <div className="meter-scale" aria-hidden="true">
          <span>Harm concern</span>
          <span>Strong</span>
        </div>
      )}
      <span className="meter-label" aria-hidden="true">
        <span className="meter-icon">
          <GradeIcon grade={grade} />
        </span>
        {size === 'lg' ? label : SHORT_LABEL[grade]}
      </span>
      {explain && <ExplainButton grade={grade} />}
    </div>
  );
}

/** Compact badge: icon + word on the grade's soft colour. */
export function GradeBadge({ grade, explain = false }: { grade: EvidenceGrade; explain?: boolean }) {
  return (
    <span className={`inline-flex flex-wrap items-center gap-x-3 g-${grade}`}>
      <span className="grade-badge">
        <span className="meter-icon">
          <GradeIcon grade={grade} />
        </span>
        {GRADE_LABELS[grade]}
      </span>
      {explain && grade !== 'per_option' && <ExplainButton grade={grade} />}
    </span>
  );
}

function ExplainButton({ grade }: { grade: EvidenceGrade }) {
  return (
    <button type="button" className="meter-explain" popoverTarget={explainerId(grade)}>
      <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <circle cx="10" cy="10" r="8" />
        <path d="M7.8 7.6a2.3 2.3 0 1 1 3.2 2.1c-.6.3-1 .8-1 1.5v.4M10 14.2v.2" strokeLinecap="round" />
      </svg>
      What does {SHORT_LABEL[grade].toLowerCase()} mean?
    </button>
  );
}

/** One popover per grade, rendered once per page (in the site layout). */
export function GradeExplainers() {
  return (
    <>
      {(Object.keys(GRADE_MEANING) as Array<keyof typeof GRADE_MEANING>).map((g) => (
        <div key={g} id={explainerId(g)} popover="auto" className="pop" role="dialog" aria-labelledby={`${explainerId(g)}-t`}>
          <button type="button" className="icon-btn pop-close" popoverTarget={explainerId(g)} popoverTargetAction="hide" aria-label="Close">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
          <p id={`${explainerId(g)}-t`} className="pop-title">
            {GRADE_LABELS[g]}
          </p>
          {isScale(g) ? (
            <div className={`meter g-${g}`} aria-hidden="true">
              <div className="meter-track">
                {GRADE_SCALE.map((s, i) => {
                  const step = GRADE_SCALE.indexOf(g);
                  return <span key={s} className={`meter-seg${i === step ? ' is-on' : i < step ? ' is-below' : ''}`} />;
                })}
              </div>
            </div>
          ) : null}
          <p className="mt-3">{GRADE_MEANING[g]}</p>
          <p className="text-[var(--ink-muted)]">
            {AI_GRADE_NOTE}.{' '}
            <Link href="/evidence/how-we-grade/" className="link">
              How we grade
            </Link>
          </p>
        </div>
      ))}
    </>
  );
}
