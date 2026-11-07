import { useId } from 'react';

/**
 * Illustration set: abstract, warm, no faces. Line-drawn in currentColor
 * (accent) with soft fills from tokens, so each one works in both themes.
 * Decorative ones are aria-hidden; the diagrams carry a text alternative.
 */

type IlloProps = { className?: string; title?: string };

function Svg({ className, title, children, viewBox = '0 0 120 120' }: IlloProps & { children: React.ReactNode; viewBox?: string }) {
  return (
    <svg
      viewBox={viewBox}
      className={`illo ${className ?? ''}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {children}
    </svg>
  );
}

/** Sleep & temperature: a moon over three soft waves. */
export function IlloSleep(p: IlloProps) {
  return (
    <Svg {...p}>
      <circle cx="60" cy="60" r="50" className="i-fill" stroke="none" />
      <path d="M72 30a24 24 0 1 0 18 38 20 20 0 0 1-18-38Z" />
      <path d="M26 86c6-4 10-4 16 0s10 4 16 0 10-4 16 0 10 4 16 0" />
      <path d="M34 96c5-3 9-3 13 0s9 3 13 0 9-3 13 0" opacity=".55" />
    </Svg>
  );
}

/** Mind & mood: two overlapping speech-bubble rounds. */
export function IlloMind(p: IlloProps) {
  return (
    <Svg {...p}>
      <circle cx="60" cy="60" r="50" className="i-fill" stroke="none" />
      <path d="M30 52c0-13 12-22 26-22s26 9 26 22-12 22-26 22c-4 0-7-.6-10-1.7L33 78l3.5-10C32.6 64 30 58.3 30 52Z" />
      <path d="M86 58c5 3 8 8 8 13 0 4-1.6 7.7-4.4 10.6L92 90l-9.5-3.6A27 27 0 0 1 74 87c-8 0-15-3-19-8" />
      <path d="M48 52h16M48 44h22" opacity=".6" />
    </Svg>
  );
}

/** Body & joints: a jointed line, like a bending knee. */
export function IlloBody(p: IlloProps) {
  return (
    <Svg {...p}>
      <circle cx="60" cy="60" r="50" className="i-fill" stroke="none" />
      <path d="M40 26 56 58l-6 34" />
      <circle cx="56" cy="58" r="7" />
      <path d="M68 40c8 6 13 14 13 24" opacity=".55" />
      <path d="M30 94h48" />
    </Svg>
  );
}

/** Cycle & bleeding: a calendar ring with one marked day. */
export function IlloCycle(p: IlloProps) {
  return (
    <Svg {...p}>
      <circle cx="60" cy="60" r="50" className="i-fill" stroke="none" />
      <circle cx="60" cy="60" r="30" strokeDasharray="4 7" />
      <circle cx="60" cy="30" r="6" className="i-brass" stroke="currentColor" />
      <path d="M60 60V44M60 60l10 8" />
    </Svg>
  );
}

/** Talking to a doctor: a clipboard with a question line and a tick. */
export function IlloDoctor(p: IlloProps) {
  return (
    <Svg {...p}>
      <circle cx="60" cy="60" r="50" className="i-fill" stroke="none" />
      <rect x="36" y="28" width="48" height="64" rx="6" />
      <path d="M50 24h20v10H50z" />
      <path d="M46 50h28M46 62h20" />
      <path d="M48 76l6 6 12-12" />
    </Svg>
  );
}

/** Empty notebook (empty states). */
export function IlloEmpty(p: IlloProps) {
  return (
    <Svg {...p}>
      <circle cx="60" cy="60" r="50" className="i-fill" stroke="none" />
      <rect x="34" y="26" width="52" height="68" rx="5" />
      <path d="M44 26v68" />
      <path d="M54 46h22M54 58h22M54 70h12" opacity=".45" />
      <path d="M88 82l8 8" />
      <circle cx="82" cy="76" r="9" />
    </Svg>
  );
}

/**
 * The transition timeline, as an accessible diagram. `marker` places a "you
 * are around here" pin (quiz result) on one stage.
 */
export function TransitionTimeline({
  marker,
  className,
}: {
  marker?: 'reproductive' | 'perimenopause' | 'menopause' | 'postmenopause';
  className?: string;
}) {
  const uid = useId();
  const xs = { reproductive: 70, perimenopause: 250, menopause: 420, postmenopause: 560 } as const;
  const markerLabel = marker
    ? { reproductive: 'before the transition', perimenopause: 'in perimenopause', menopause: 'around menopause', postmenopause: 'in postmenopause' }[marker]
    : null;
  return (
    <figure className={className}>
      <svg
        viewBox="0 0 640 170"
        className="illo w-full"
        role="img"
        aria-labelledby={`${uid}-t ${uid}-d`}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
      >
        <title id={`${uid}-t`}>The menopause transition</title>
        <desc id={`${uid}-d`}>
          Four stages in order: reproductive years; perimenopause, which often starts in your 40s and lasts around 4 to 8
          years, with changing periods and symptoms; menopause, one point in time 12 months after your last period,
          on average around age 51; then postmenopause, the rest of life after that.
          {markerLabel ? ` You are marked as ${markerLabel}.` : ''}
        </desc>
        {/* perimenopause band */}
        <rect x="150" y="54" width="250" height="40" rx="20" className="i-fill" stroke="none" />
        <path d="M30 74H610" strokeWidth="3" />
        <path d="M600 66l10 8-10 8" strokeWidth="3" strokeLinejoin="round" />
        {/* menopause point */}
        <circle cx="420" cy="74" r="11" strokeWidth="3" style={{ fill: 'var(--paper-raised)' }} />
        <circle cx="420" cy="74" r="4.5" stroke="none" style={{ fill: 'currentColor' }} />
        <g fontFamily="var(--font-sans)" fontSize="15" stroke="none" style={{ fill: 'var(--ink)' }}>
          <text x="70" y="40" textAnchor="middle" fontWeight="700">Reproductive years</text>
          <text x="275" y="40" textAnchor="middle" fontWeight="700">Perimenopause</text>
          <text x="275" y="122" textAnchor="middle" style={{ fill: 'var(--ink-muted)' }}>often 40s · lasts about 4–8 years</text>
          <text x="420" y="122" textAnchor="middle" fontWeight="700">Menopause</text>
          <text x="420" y="142" textAnchor="middle" style={{ fill: 'var(--ink-muted)' }}>12 months after last period</text>
          <text x="560" y="40" textAnchor="middle" fontWeight="700">Postmenopause</text>
        </g>
        {marker && (
          <g transform={`translate(${xs[marker]} 74)`}>
            <path d="M0-12 0-28" strokeWidth="2.5" style={{ stroke: 'var(--brass-rule)' }} />
            <circle r="9" strokeWidth="3" style={{ stroke: 'var(--brass-rule)', fill: 'var(--brass-soft)' }} />
            <text y="58" textAnchor="middle" fontFamily="var(--font-serif)" fontStyle="italic" fontSize="17" stroke="none" style={{ fill: 'var(--brass)' }}>
              you are around here
            </text>
          </g>
        )}
      </svg>
    </figure>
  );
}

/** How a hot flash happens: four steps, drawn as a loop. */
export function HotFlashDiagram({ className }: { className?: string }) {
  const steps = [
    { t: 'Estrogen dips', d: 'Changing hormone levels unsettle the brain’s temperature centre.' },
    { t: 'Thermostat narrows', d: 'Its “comfortable” range shrinks, so a tiny rise in body heat reads as too hot.' },
    { t: 'Heat dump', d: 'Blood vessels in the skin widen and you flush and sweat; the heart may race.' },
    { t: 'Chill after', d: 'Losing that heat can leave you cold and clammy, often waking you at night.' },
  ];
  return (
    <figure className={className}>
      <ol className="step-list" aria-label="How a hot flash happens">
        {steps.map((s) => (
          <li key={s.t}>
            <span className="step-title">{s.t}</span>
            <span className="block text-[var(--ink-muted)]">{s.d}</span>
          </li>
        ))}
      </ol>
    </figure>
  );
}
