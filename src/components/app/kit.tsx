'use client';

/**
 * Tracker UI kit: the shared building blocks for every /app/* screen.
 * Styles: "tracker app" section of src/app/ds-components.css.
 * Live examples: /dev/design-system/ (tracker section).
 */
import { useEffect, useId, useRef } from 'react';

/* ------------------------------------------------------------- layout */

export function AppPage({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`app-page ${className}`}>{children}</div>;
}

export function Panel({
  title,
  hint,
  action,
  tone,
  children,
  headingLevel = 2,
  id,
}: {
  title?: React.ReactNode;
  hint?: React.ReactNode;
  action?: React.ReactNode;
  tone?: 'quiet' | 'feature';
  children?: React.ReactNode;
  headingLevel?: 2 | 3;
  id?: string;
}) {
  const auto = useId();
  const hid = id ?? auto;
  const H = `h${headingLevel}` as 'h2';
  return (
    <section className={`panel${tone ? ` panel-${tone}` : ''}`} aria-labelledby={title ? hid : undefined}>
      {(title || action) && (
        <div className="panel-head">
          <div>
            {title && (
              <H id={hid} className="panel-title">
                {title}
              </H>
            )}
            {hint && <p className="panel-hint">{hint}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function SectionHead({ title, action, id }: { title: string; action?: React.ReactNode; id?: string }) {
  return (
    <div className="section-head">
      <h2 className="section-title" id={id}>
        {title}
      </h2>
      {action}
    </div>
  );
}

/* ------------------------------------------------------------- five-level picker */

export interface Level<V extends number = number> {
  value: V;
  label: string;
  desc?: string;
}

/** Single choice from 5 levels, drawn as a rising ladder (no faces). Radio-group semantics. */
export function LevelPicker<V extends number>({
  levels,
  value,
  onChange,
  label,
}: {
  levels: Array<Level<V>>;
  value: V | null;
  onChange: (v: V) => void;
  label: string;
}) {
  const onKey = (e: React.KeyboardEvent, i: number) => {
    const d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const next = levels[(i + d + levels.length) % levels.length];
    onChange(next.value);
    const btns = (e.currentTarget.parentElement?.querySelectorAll('button') ?? []) as NodeListOf<HTMLButtonElement>;
    btns[(i + d + levels.length) % levels.length]?.focus();
  };
  return (
    <div className="level-picker" role="radiogroup" aria-label={label}>
      {levels.map((l, i) => {
        const on = value === l.value;
        return (
          <button
            key={l.value}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={on || (value === null && i === 0) ? 0 : -1}
            onClick={() => onChange(l.value)}
            onKeyDown={(e) => onKey(e, i)}
          >
            <span className="level-glyph" aria-hidden="true">
              {levels.map((_, j) => (
                <span key={j} className={j <= i ? 'is-on' : ''} style={{ height: `${30 + j * 17}%` }} />
              ))}
            </span>
            <span>{l.label}</span>
            {l.desc && <span className="level-desc">{l.desc}</span>}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------- quick picks */

export function QuickPick<V extends string | number>({
  options,
  value,
  onChange,
  label,
  columns,
}: {
  options: Array<{ value: V; label: string }>;
  value: V | null;
  onChange: (v: V) => void;
  label: string;
  columns?: number;
}) {
  return (
    <div
      className="quickpick"
      role="radiogroup"
      aria-label={label}
      style={{ ['--qp-cols' as string]: String(columns ?? options.length) }}
    >
      {options.map((o) => (
        <button key={String(o.value)} type="button" role="radio" aria-checked={value === o.value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------- stepper */

export function Stepper({
  value,
  onChange,
  min = 0,
  max = 999,
  step = 1,
  unit,
  label,
  decreaseLabel,
  increaseLabel,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  /** Read out with the value, e.g. "Hot flashes today". */
  label: string;
  decreaseLabel: string;
  increaseLabel: string;
}) {
  const id = useId();
  // Quick repeated taps (counting hot flashes as they happen) must each count,
  // even before React re-renders with the new value.
  const latest = useRef(value);
  useEffect(() => {
    latest.current = value;
  }, [value]);
  const bump = (delta: number) => {
    const next = Math.min(max, Math.max(min, +(latest.current + delta).toFixed(2)));
    latest.current = next;
    onChange(next);
  };
  return (
    <div className="stepper" role="group" aria-labelledby={id}>
      <span id={id} className="visually-hidden">
        {label}
      </span>
      <button type="button" aria-label={decreaseLabel} disabled={value <= min} onClick={() => bump(-step)}>
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
          <path d="M6 12h12" />
        </svg>
      </button>
      <output aria-live="polite">
        {value}
        {unit && <small>{unit}</small>}
      </output>
      <button type="button" className="is-plus" aria-label={increaseLabel} disabled={value >= max} onClick={() => bump(step)}>
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
          <path d="M12 6v12M6 12h12" />
        </svg>
      </button>
    </div>
  );
}

/* ------------------------------------------------------------- symptom chips */

const STRENGTH = [
  { value: 1, label: '1' },
  { value: 2, label: '2' },
  { value: 3, label: '3' },
  { value: 4, label: '4' },
  { value: 5, label: '5' },
];

/**
 * Symptom chips: tap to add (starts at 3, "moderate"); a 1–5 strength row opens
 * under it. Tap the chip again to remove.
 */
export function SymptomChips({
  items,
  selected,
  onToggle,
  onStrength,
}: {
  items: Array<{ id: string; name: string; note?: string }>;
  selected: Record<string, number>;
  onToggle: (id: string) => void;
  onStrength: (id: string, v: number) => void;
}) {
  return (
    <div className="symptom-grid">
      {items.map((s) => {
        const level = selected[s.id];
        const on = !!level;
        return (
          <div key={s.id} className={`symptom-item${on ? ' is-on' : ''}`}>
            <button type="button" className="chip" aria-pressed={on} onClick={() => onToggle(s.id)}>
              {s.name}
              {s.note && !on && <span className="text-[0.85rem] text-[var(--ink-muted)]">· {s.note}</span>}
            </button>
            {on && (
              <div className="strength">
                <p className="strength-label" aria-hidden="true">
                  <span>1 mild</span>
                  <span>5 severe</span>
                </p>
                <QuickPick
                  label={`How strong: ${s.name}`}
                  options={STRENGTH}
                  value={level}
                  onChange={(v) => onStrength(s.id, v)}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------- icons used across screens */

export const Icon = {
  Today: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
      <circle cx="12" cy="15" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  ),
  Timeline: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
      <path d="M4 19V5M4 19h16" />
      <path d="M8 15l3.5-4 3 2.5L19 8" />
    </svg>
  ),
  Treatments: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
      <rect x="3" y="8.5" width="18" height="7" rx="3.5" transform="rotate(-35 12 12)" />
      <path d="M9.6 8.6l4.6 6.6" />
    </svg>
  ),
  Insights: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
      <path d="M5 20v-6M10 20V9M15 20v-9M20 20V5" />
    </svg>
  ),
  Report: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
      <path d="M6 3h9l4 4v14H6z" />
      <path d="M9.5 12h6M9.5 16h4M14.5 3v4.5H19" />
    </svg>
  ),
  Settings: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z" />
    </svg>
  ),
  Lock: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
      <rect x="5" y="11" width="14" height="9.5" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  ),
  Back: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
      <path d="M15 5l-7 7 7 7" />
    </svg>
  ),
  Chevron: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
      <path d="M9 5l7 7-7 7" />
    </svg>
  ),
  Check: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
      <path d="M5 12.5l4.5 4.5L19 7" />
    </svg>
  ),
  Flame: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
      <path d="M12 21c-3.9 0-6.5-2.6-6.5-6.2 0-3.3 2.4-5.2 3.6-8.3.5 2.2 1.7 3.4 2.9 3.9.2-2.9 1.6-5.2 3.4-6.9.4 3 3.1 5.4 3.1 9.3 0 4.4-2.6 8.2-6.5 8.2Z" />
    </svg>
  ),
  Moon: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" aria-hidden="true" {...p}>
      <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z" />
    </svg>
  ),
  Drop: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" aria-hidden="true" {...p}>
      <path d="M12 3.5s6 6.4 6 11a6 6 0 0 1-12 0c0-4.6 6-11 6-11Z" />
    </svg>
  ),
  Plus: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true" {...p}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  Close: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true" {...p}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  ),
};
