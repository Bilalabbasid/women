/**
 * Section-header illustrations (hubs, home "Start here", tools index).
 * Same language as the core set in illustrations.tsx: a soft disc, line art in
 * currentColor (the accent), brass for one warm detail. No faces, no bodies,
 * nothing anatomical: abstract shapes only. Decorative unless given a title.
 */

type IlloProps = { className?: string; title?: string };

function Svg({ className, title, children }: IlloProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 120 120"
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
      <circle cx="60" cy="60" r="50" className="i-fill" stroke="none" />
      {children}
    </svg>
  );
}

/** Perimenopause: a wave that rises and falls unevenly, settling as it goes. */
export function IlloPerimenopause(p: IlloProps) {
  return (
    <Svg {...p}>
      <path d="M18 76H102" opacity=".35" />
      <path d="M18 64c5-26 11-26 16 0s9 22 14 0 8-18 12 0 7 14 11 0 6-10 10 0 5 6 9 0 4-4 8 0" />
      <circle cx="31" cy="45" r="4.5" className="i-brass" />
      <path d="M26 92h12M50 92h20M82 92h12" opacity=".45" />
    </Svg>
  );
}

/** Menopause: one marked point on a horizon line (a moment, not a stage). */
export function IlloMenopause(p: IlloProps) {
  return (
    <Svg {...p}>
      <path d="M18 78H102" />
      <path d="M36 74v8M84 74v8" opacity=".45" />
      <path d="M60 78V50" />
      <circle cx="60" cy="42" r="9" className="i-brass" />
      <circle cx="60" cy="42" r="2.5" fill="currentColor" stroke="none" />
      <path d="M44 92h32" opacity=".45" />
    </Svg>
  );
}

/** Postmenopause: a calm, open horizon with a low sun and still water. */
export function IlloPostmenopause(p: IlloProps) {
  return (
    <Svg {...p}>
      <path d="M40 72a20 20 0 0 1 40 0" className="i-brass" />
      <path d="M60 40v-6M38 50l-4-4M82 50l4-4" opacity=".55" />
      <path d="M16 72H104" />
      <path d="M30 84H90" opacity=".5" />
      <path d="M42 94H78" opacity=".35" />
    </Svg>
  );
}

/** Treatments: a balance, weighing options. */
export function IlloTreatments(p: IlloProps) {
  return (
    <Svg {...p}>
      <path d="M60 34V90M46 90h28" />
      <circle cx="60" cy="30" r="4" />
      <path d="M28 42H92" />
      <path d="M28 42l-8 20M28 42l8 20M92 42l-8 20M92 42l8 20" opacity=".7" />
      <path d="M18 62h20a10 9 0 0 1-20 0Z" className="i-brass" />
      <path d="M82 62h20a10 9 0 0 1-20 0Z" />
    </Svg>
  );
}

/** Does it work?: a magnifier over a ruled evidence card. */
export function IlloDoesItWork(p: IlloProps) {
  return (
    <Svg {...p}>
      <rect x="28" y="26" width="46" height="62" rx="5" />
      <path d="M37 40h28M37 50h22M37 60h26M37 70h14" opacity=".5" />
      <circle cx="76" cy="70" r="15" className="i-brass" />
      <path d="M69 70l4.5 4.5L83 65" />
      <path d="M87 81l11 11" strokeWidth="4" />
    </Svg>
  );
}

/** Getting care: two speech bubbles meeting in the middle. */
export function IlloGettingCare(p: IlloProps) {
  return (
    <Svg {...p}>
      <path d="M24 38a8 8 0 0 1 8-8h32a8 8 0 0 1 8 8v16a8 8 0 0 1-8 8H40l-12 9 3-9a8 8 0 0 1-7-8Z" />
      <path d="M48 64a8 8 0 0 1 8-8h32a8 8 0 0 1 8 8v16a8 8 0 0 1-7 8l3 9-12-9H56a8 8 0 0 1-8-8Z" className="i-brass" />
      <path d="M34 42h24M34 50h14" opacity=".55" />
      <path d="M58 68h26M58 76h16" opacity=".7" />
    </Svg>
  );
}

/** Tools: a simple notebook and a pen. */
export function IlloTools(p: IlloProps) {
  return (
    <Svg {...p}>
      <rect x="28" y="26" width="46" height="66" rx="5" />
      <path d="M38 26v66" />
      <path d="M47 42h18M47 52h18M47 62h12" opacity=".5" />
      <path d="M86 30l8 8-24 38-11 5 3-11Z" className="i-brass" />
      <path d="M80 39l8 8" />
    </Svg>
  );
}

/** Skin & hair: three soft flowing strands and a light texture. */
export function IlloSkinHair(p: IlloProps) {
  return (
    <Svg {...p}>
      <path d="M36 26c-7 16 9 24 2 40s7 26 7 26" />
      <path d="M54 24c-7 17 9 26 2 42s7 26 7 26" />
      <path d="M72 26c-7 16 9 24 2 40s7 26 7 26" className="i-brass" style={{ fill: 'none' }} />
      <circle cx="92" cy="44" r="2" fill="currentColor" stroke="none" opacity=".45" />
      <circle cx="96" cy="58" r="2" fill="currentColor" stroke="none" opacity=".45" />
      <circle cx="90" cy="70" r="2" fill="currentColor" stroke="none" opacity=".45" />
    </Svg>
  );
}

/** Intimate & bladder: a droplet held inside a ring (abstract only). */
export function IlloIntimate(p: IlloProps) {
  return (
    <Svg {...p}>
      <circle cx="60" cy="62" r="30" />
      <circle cx="60" cy="62" r="38" opacity=".3" />
      <path d="M60 44s12 13 12 21a12 12 0 0 1-24 0c0-8 12-21 12-21Z" className="i-brass" />
    </Svg>
  );
}

/** Mood: a low sun with a gentle line beneath (days that rise and settle). */
export function IlloMood(p: IlloProps) {
  return (
    <Svg {...p}>
      <path d="M38 70a22 22 0 0 1 44 0" className="i-brass" />
      <path d="M60 36v-8M36 46l-6-5M84 46l6-5M28 64h-8M92 64h8" opacity=".6" />
      <path d="M22 82c13-7 25-7 38 0s25 7 38 0" />
      <path d="M34 94c9-4 17-4 26 0s17 4 26 0" opacity=".45" />
    </Svg>
  );
}
