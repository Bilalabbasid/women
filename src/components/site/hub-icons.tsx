/**
 * Line icons for the symptoms hub groups, in the illustration style
 * (components/ui/illustrations.tsx): currentColor strokes, no faces.
 * No hooks, so they render from server and client components alike.
 */
import type { SVGProps } from 'react';

const base: SVGProps<SVGSVGElement> = {
  viewBox: '0 0 32 32',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: false,
};

/** Moon over a heat wave. */
export function IconSleepTemp(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...p}>
      <path d="M19 5a8 8 0 1 0 8 11 6.5 6.5 0 0 1-8-11Z" />
      <path d="M4 25c2-1.4 3.4-1.4 5.4 0s3.4 1.4 5.4 0 3.4-1.4 5.4 0" />
    </svg>
  );
}

/** Two overlapping thought rounds. */
export function IconMindMood(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...p}>
      <path d="M5 14c0-4.4 3.8-8 8.5-8S22 9.6 22 14s-3.8 8-8.5 8c-1.3 0-2.5-.2-3.6-.7L6 23l1.3-3.6C5.8 18 5 16.1 5 14Z" />
      <path d="M24.5 13.5c1.6 1 2.5 2.6 2.5 4.4 0 1.3-.5 2.5-1.4 3.4l.6 3.2-3.1-1.2c-.8.3-1.7.4-2.6.4-2.3 0-4.3-1-5.5-2.6" />
    </svg>
  );
}

/** A bending joint. */
export function IconBodyJoints(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...p}>
      <path d="M8 4l7.5 12L13 28" />
      <circle cx="15.5" cy="16" r="3" />
      <path d="M20 8c2.6 2 4 4.8 4 8" />
    </svg>
  );
}

/** A cycle ring with one marked day. */
export function IconCycle(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...p}>
      <circle cx="16" cy="16" r="10" strokeDasharray="2.4 3.2" />
      <path d="M16 3.5s3 3.2 3 5.3a3 3 0 0 1-6 0c0-2.1 3-5.3 3-5.3Z" />
    </svg>
  );
}

/** Two arcs meeting: intimate health and the bladder, abstract. */
export function IconIntimate(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...p}>
      <path d="M9 7c-3 3-3 9 0 12s4 6 4 6" />
      <path d="M23 7c3 3 3 9 0 12s-4 6-4 6" />
      <path d="M13 13h6" />
    </svg>
  );
}

/** Flowing strands over a skin line. */
export function IconSkinHair(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...p}>
      <path d="M8 5c0 5 4 6 4 11M14 5c0 5 4 6 4 11M20 5c0 5 4 6 4 11" />
      <path d="M5 22c3.7-2 7.3-2 11 0s7.3 2 11 0" />
      <path d="M5 27c3.7-2 7.3-2 11 0s7.3 2 11 0" opacity=".5" />
    </svg>
  );
}

/** A dotted circle: everything else. */
export function IconOther(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...p}>
      <circle cx="16" cy="16" r="10" />
      <circle cx="12" cy="16" r="1" fill="currentColor" />
      <circle cx="16" cy="16" r="1" fill="currentColor" />
      <circle cx="20" cy="16" r="1" fill="currentColor" />
    </svg>
  );
}
