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

type Stage = 'reproductive' | 'perimenopause' | 'menopause' | 'postmenopause';

const TIMELINE_DESC =
  'Four stages in order: reproductive years; perimenopause, which often starts in your 40s and lasts around 4 to 8 years, with changing periods and symptoms; menopause, one point in time 12 months after your last period, on average around age 51; then postmenopause, the rest of life after that.';

const MARKER_LABEL: Record<Stage, string> = {
  reproductive: 'before the transition',
  perimenopause: 'in perimenopause',
  menopause: 'around menopause',
  postmenopause: 'in postmenopause',
};

/**
 * The transition timeline, as an accessible diagram. `marker` places a "you
 * are around here" pin (quiz result) on one stage. Wide screens get a
 * left-to-right line; phones (< 640px) a top-to-bottom one, so its text stays
 * at reading size instead of shrinking to fit.
 */
export function TransitionTimeline({ marker, className }: { marker?: Stage; className?: string }) {
  const uid = useId();
  const markerLabel = marker ? MARKER_LABEL[marker] : null;
  const desc = `${TIMELINE_DESC}${markerLabel ? ` You are marked as ${markerLabel}.` : ''}`;
  return (
    <figure className={className}>
      <TimelineVertical uid={`${uid}v`} marker={marker} desc={desc} />
      <TimelineHorizontal uid={`${uid}h`} marker={marker} desc={desc} />
    </figure>
  );
}

function TimelineVertical({ uid, marker, desc }: { uid: string; marker?: Stage; desc: string }) {
  // Stage y positions on the vertical line, and where the marker label sits.
  const ys: Record<Stage, number> = { reproductive: 40, perimenopause: 160, menopause: 272, postmenopause: 350 };
  const markerTextY: Record<Stage, number> = { reproductive: 74, perimenopause: 216, menopause: 322, postmenopause: 386 };
  return (
    <svg
      viewBox="0 0 340 404"
      className="illo w-full max-w-[24rem] sm:hidden"
      role="img"
      aria-labelledby={`${uid}-t ${uid}-d`}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
    >
      <title id={`${uid}-t`}>The menopause transition</title>
      <desc id={`${uid}-d`}>{desc}</desc>
      {/* perimenopause band */}
      <rect x="24" y="92" width="32" height="140" rx="16" className="i-fill" stroke="none" />
      <path d="M40 18V388" strokeWidth="3" />
      <path d="M32 380l8 10 8-10" strokeWidth="3" strokeLinejoin="round" />
      <circle cx="40" cy="40" r="6" fill="currentColor" stroke="none" />
      <circle cx="40" cy="350" r="6" fill="currentColor" stroke="none" />
      {/* menopause point */}
      <circle cx="40" cy="272" r="11" strokeWidth="3" style={{ fill: 'var(--paper-raised)' }} />
      <circle cx="40" cy="272" r="4.5" stroke="none" style={{ fill: 'currentColor' }} />
      <g fontFamily="var(--font-sans)" stroke="none" style={{ fill: 'var(--ink)' }}>
        <text x="66" y="47" fontSize="19" fontWeight="700">Reproductive years</text>
        <text x="66" y="140" fontSize="19" fontWeight="700">Perimenopause</text>
        <text x="66" y="165" fontSize="17" style={{ fill: 'var(--ink-muted)' }}>often starts in your 40s</text>
        <text x="66" y="188" fontSize="17" style={{ fill: 'var(--ink-muted)' }}>lasts about 4–8 years</text>
        <text x="66" y="268" fontSize="19" fontWeight="700">Menopause</text>
        <text x="66" y="293" fontSize="17" style={{ fill: 'var(--ink-muted)' }}>12 months after last period</text>
        <text x="66" y="357" fontSize="19" fontWeight="700">Postmenopause</text>
      </g>
      {marker && (
        <g>
          <circle cx="40" cy={ys[marker]} r="15" strokeWidth="3" style={{ stroke: 'var(--brass-rule)', fill: 'var(--brass-soft)', fillOpacity: 0.6 }} />
          <text x="66" y={markerTextY[marker]} fontFamily="var(--font-serif)" fontStyle="italic" fontSize="19" stroke="none" style={{ fill: 'var(--brass)' }}>
            ← you are around here
          </text>
        </g>
      )}
    </svg>
  );
}

function TimelineHorizontal({ uid, marker, desc }: { uid: string; marker?: Stage; desc: string }) {
  // Stage centres along the line; every title sits above it, notes below, and
  // the marker's label underneath everything so nothing overlaps.
  const xs: Record<Stage, number> = { reproductive: 92, perimenopause: 280, menopause: 445, postmenopause: 565 };
  return (
    <svg
      viewBox="0 0 640 192"
      className="illo hidden w-full sm:block"
      role="img"
      aria-labelledby={`${uid}-t ${uid}-d`}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
    >
      <title id={`${uid}-t`}>The menopause transition</title>
      <desc id={`${uid}-d`}>{desc}</desc>
      {/* perimenopause band */}
      <rect x="150" y="58" width="262" height="40" rx="20" className="i-fill" stroke="none" />
      <path d="M30 78H610" strokeWidth="3" />
      <path d="M600 70l10 8-10 8" strokeWidth="3" strokeLinejoin="round" />
      <circle cx={xs.reproductive} cy="78" r="5.5" fill="currentColor" stroke="none" />
      <circle cx={xs.postmenopause} cy="78" r="5.5" fill="currentColor" stroke="none" />
      {/* menopause point */}
      <circle cx={xs.menopause} cy="78" r="11" strokeWidth="3" style={{ fill: 'var(--paper-raised)' }} />
      <circle cx={xs.menopause} cy="78" r="4.5" stroke="none" style={{ fill: 'currentColor' }} />
      <g fontFamily="var(--font-sans)" stroke="none" style={{ fill: 'var(--ink)' }}>
        <g fontSize="16" fontWeight="700">
          <text x={xs.reproductive} y="40" textAnchor="middle">Reproductive years</text>
          <text x={xs.perimenopause} y="40" textAnchor="middle">Perimenopause</text>
          <text x={xs.menopause} y="40" textAnchor="middle">Menopause</text>
          <text x={xs.postmenopause} y="40" textAnchor="middle">Postmenopause</text>
        </g>
        <g fontSize="15" textAnchor="middle" style={{ fill: 'var(--ink-muted)' }}>
          <text x={xs.perimenopause} y="126">often starts in your 40s</text>
          <text x={xs.perimenopause} y="146">lasts about 4–8 years</text>
          <text x={xs.menopause} y="126">12 months after</text>
          <text x={xs.menopause} y="146">your last period</text>
        </g>
      </g>
      {marker && (
        <g transform={`translate(${xs[marker]} 78)`}>
          <path d="M0-14 0-26" strokeWidth="2.5" style={{ stroke: 'var(--brass-rule)' }} />
          <circle r="10" strokeWidth="3" style={{ stroke: 'var(--brass-rule)', fill: 'var(--brass-soft)' }} />
          <text y="100" textAnchor="middle" fontFamily="var(--font-serif)" fontStyle="italic" fontSize="18" stroke="none" style={{ fill: 'var(--brass)' }}>
            ↑ you are around here
          </text>
        </g>
      )}
    </svg>
  );
}

/* ------------------------------------------------------------- hot flash diagram */

const HOT_FLASH_STEPS = [
  {
    t: 'Estrogen dips',
    d: 'Changing hormone levels unsettle the part of the brain that keeps your temperature steady.',
    tone: 'var(--accent)',
  },
  {
    t: 'The thermostat narrows',
    d: 'Its “comfortable” range shrinks, so a tiny rise in body heat reads as too hot.',
    tone: 'var(--accent)',
  },
  {
    t: 'Heat release',
    d: 'Blood vessels in the skin widen, so you flush and sweat, and your heart beats faster.',
    tone: 'var(--brass-rule)',
  },
  {
    t: 'Chill after',
    d: 'Losing that heat can leave you cold and clammy, which often wakes you at night.',
    tone: 'var(--link)',
  },
];

/**
 * How a hot flash happens: four stages drawn as a clockwise loop (numbered
 * nodes, a thermometer in the middle) with a numbered legend beside it on wide
 * screens and below it on phones. The SVG carries the full sequence as its
 * title and description; the legend is the visible text at reading size.
 */
export function HotFlashDiagram({ className }: { className?: string }) {
  const uid = useId();
  // Node centres on a circle (r=82 around 120,120): top, right, bottom, left.
  const nodes = [
    [120, 38],
    [202, 120],
    [120, 202],
    [38, 120],
  ] as const;
  // Clockwise arcs between nodes, leaving room around each node.
  const arcs = [
    'M142.6 41.2A82 82 0 0 1 198.8 97.4',
    'M198.8 142.6A82 82 0 0 1 142.6 198.8',
    'M97.4 198.8A82 82 0 0 1 41.2 142.6',
    'M41.2 97.4A82 82 0 0 1 97.4 41.2',
  ];
  return (
    <figure className={`grid items-center gap-6 sm:grid-cols-[minmax(0,15rem)_1fr] ${className ?? ''}`}>
      <svg
        viewBox="0 0 240 240"
        className="illo mx-auto w-full max-w-[15rem]"
        role="img"
        aria-labelledby={`${uid}-t ${uid}-d`}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <title id={`${uid}-t`}>How a hot flash happens</title>
        <desc id={`${uid}-d`}>
          A loop of four stages. One: estrogen dips, unsettling the brain’s temperature centre. Two: the brain’s
          thermostat narrows its comfortable range, so a small rise in body heat reads as too hot. Three: heat
          release: blood vessels in the skin widen, you flush and sweat, and your heart beats faster. Four: a chill
          after, as the lost heat leaves you cold. Then the cycle can start again.
        </desc>
        <defs>
          <marker id={`${uid}-arrow`} viewBox="0 0 10 10" refX="7" refY="5" markerWidth="7" markerHeight="7" orient="auto">
            <path d="M1 1.5L8 5L1 8.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </marker>
        </defs>
        <circle cx="120" cy="120" r="82" className="i-fill" stroke="none" opacity=".55" />
        {arcs.map((d) => (
          <path key={d} d={d} strokeWidth="2.5" markerEnd={`url(#${uid}-arrow)`} />
        ))}
        {/* thermometer in the middle */}
        <rect x="111" y="84" width="18" height="50" rx="9" strokeWidth="2.5" style={{ fill: 'var(--paper-raised)' }} />
        <circle cx="120" cy="142" r="13" strokeWidth="2.5" style={{ fill: 'var(--brass-soft)', stroke: 'var(--brass-rule)' }} />
        <path d="M120 130V100" strokeWidth="5" style={{ stroke: 'var(--brass-rule)' }} />
        <path d="M133 96h6M133 106h6M133 116h6" strokeWidth="2" opacity=".55" />
        {nodes.map(([cx, cy], i) => (
          <g key={i}>
            <circle cx={cx} cy={cy} r="17" strokeWidth="3" style={{ fill: 'var(--paper-raised)', stroke: HOT_FLASH_STEPS[i].tone }} />
            <text
              x={cx}
              y={cy + 6}
              textAnchor="middle"
              fontFamily="var(--font-serif)"
              fontStyle="italic"
              fontWeight="600"
              fontSize="18"
              stroke="none"
              style={{ fill: 'var(--ink)' }}
            >
              {i + 1}
            </text>
          </g>
        ))}
      </svg>
      <ol className="grid gap-4" aria-label="The four stages of a hot flash">
        {HOT_FLASH_STEPS.map((s, i) => (
          <li key={s.t} className="flex gap-3">
            <span
              aria-hidden="true"
              className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full border-[3px] bg-[var(--paper-raised)] font-serif text-[1.05rem] font-semibold italic"
              style={{ borderColor: s.tone }}
            >
              {i + 1}
            </span>
            <span>
              <span className="block font-bold leading-snug">{s.t}</span>
              <span className="block text-[1.0625rem] leading-snug text-[var(--ink-muted)]">{s.d}</span>
            </span>
          </li>
        ))}
      </ol>
    </figure>
  );
}

export * from './illustrations-sections';
