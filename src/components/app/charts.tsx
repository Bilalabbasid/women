'use client';

/**
 * Tracker charts: plain SVG, no chart library. Every chart has a role="img"
 * label, a visible plain-English summary, and a visually-hidden data table so
 * screen readers get the numbers too. Colours come from tokens (.chart CSS in
 * ds-components.css), so they work in light and dark.
 */
import { useEffect, useId, useRef, useState } from 'react';

/**
 * Draws at the real pixel width (ResizeObserver), so axis text stays its true
 * size on a phone instead of shrinking with a scaled viewBox.
 */
function useWidth(initial = 600) {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(initial);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const set = () => setW(Math.max(240, Math.round(el.getBoundingClientRect().width)));
    set();
    if (!('ResizeObserver' in window)) return;
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}
import type { LocalCheckin, LocalSymptomEntry } from '@/lib/db/schema';

export type Entry = LocalCheckin & { symptoms: LocalSymptomEntry[] };

/** One point per calendar day; value null = nothing logged that day. */
export interface DayPoint {
  date: string;
  value: number | null;
}

const pad = (n: number) => String(n).padStart(2, '0');
const toKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromKey = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};
export const shortDate = (s: string) => fromKey(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const round1 = (n: number) => Math.round(n * 10) / 10;

/**
 * Daily series from start to end (inclusive). Weekly entries (coversDays 7) are
 * left out of daily charts: their numbers cover a whole week.
 */
export function dailySeries(entries: Entry[], start: string, end: string, pick: (e: Entry) => number | undefined): DayPoint[] {
  const byDate = new Map(entries.filter((e) => e.coversDays !== 7).map((e) => [e.date, e]));
  const out: DayPoint[] = [];
  for (let d = fromKey(start); toKey(d) <= end; d.setDate(d.getDate() + 1)) {
    const key = toKey(d);
    const e = byDate.get(key);
    const v = e ? pick(e) : undefined;
    out.push({ date: key, value: typeof v === 'number' ? v : null });
  }
  return out;
}

/** Average of the logged values, and first-week vs last-week when both have ≥3 entries. */
export function trend(points: DayPoint[]) {
  const logged = points.filter((p) => p.value !== null) as Array<{ date: string; value: number }>;
  const avg = logged.length ? round1(logged.reduce((s, p) => s + p.value, 0) / logged.length) : null;
  let first: number | null = null;
  let last: number | null = null;
  if (points.length >= 14) {
    const a = points.slice(0, 7).filter((p) => p.value !== null) as Array<{ value: number }>;
    const b = points.slice(-7).filter((p) => p.value !== null) as Array<{ value: number }>;
    if (a.length >= 3 && b.length >= 3) {
      first = round1(a.reduce((s, p) => s + p.value, 0) / a.length);
      last = round1(b.reduce((s, p) => s + p.value, 0) / b.length);
    }
  }
  return { avg, first, last, logged: logged.length, max: logged.reduce((m, p) => Math.max(m, p.value), 0) };
}

function changeWords(first: number | null, last: number | null, unit: string) {
  if (first === null || last === null) return '';
  const diff = round1(last - first);
  if (Math.abs(diff) < Math.max(0.3, first * 0.1)) return ` About the same in your last week as your first (${last} ${unit}).`;
  return diff < 0
    ? ` Lower in your last week (${last}) than your first (${first}).`
    : ` Higher in your last week (${last}) than your first (${first}).`;
}

/** Axis labels: 14px minimum, muted ink (inline so it beats the shared 13px rule). */
const AXIS_TEXT = { fontSize: 14, fill: 'var(--ink-muted)' } as const;

/** Thin the date axis so labels (≈60px each) never collide. */
function labelEvery(n: number, width: number) {
  const fit = Math.max(2, Math.floor((width - 40) / 64));
  return Math.max(1, Math.ceil(n / fit));
}

function HiddenTable({ caption, head, rows }: { caption: string; head: [string, string]; rows: Array<[string, string]> }) {
  return (
    <table className="visually-hidden">
      <caption>{caption}</caption>
      <thead>
        <tr>
          <th scope="col">{head[0]}</th>
          <th scope="col">{head[1]}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([a, b]) => (
          <tr key={a}>
            <th scope="row">{a}</th>
            <td>{b}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ------------------------------------------------------------- hot flashes per day (bars) */

export function HotFlashChart({ points }: { points: DayPoint[] }) {
  const id = useId();
  const [box, W] = useWidth();
  const t = trend(points);
  const H = 190;
  const padL = 28;
  const padB = 28;
  const top = Math.max(4, Math.ceil(t.max / 2) * 2);
  const n = points.length;
  const slot = (W - padL) / n;
  const bw = Math.max(2, Math.min(22, slot * 0.68));
  const y = (v: number) => H - padB - (v / top) * (H - padB - 8);
  const every = labelEvery(n, W);

  const summary =
    t.avg === null
      ? 'No hot flashes logged in this period.'
      : `About ${t.avg} a day on the ${t.logged} ${t.logged === 1 ? 'day' : 'days'} you logged, most in one day ${t.max}.${changeWords(t.first, t.last, 'a day')}`;

  return (
    <figure className="grid gap-3" ref={box}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width={W}
        height={H}
        className="chart"
        role="img"
        aria-labelledby={`${id}-s`}
      >
        {[0, top / 2, top].map((v) => (
          <g key={v}>
            <line className="grid-line" x1={padL} x2={W} y1={y(v)} y2={y(v)} />
            <text style={AXIS_TEXT} x={padL - 8} y={y(v) + 4} textAnchor="end">
              {v}
            </text>
          </g>
        ))}
        {points.map((p, i) => {
          const cx = padL + slot * i + slot / 2;
          return (
            <g key={p.date}>
              {p.value === null ? (
                <rect className="bar-soft" x={cx - bw / 2} y={H - padB - 3} width={bw} height={3} rx={1} opacity={0.5} />
              ) : (
                <rect className="bar" x={cx - bw / 2} y={y(p.value)} width={bw} height={Math.max(2, H - padB - y(p.value))} rx={Math.min(3, bw / 3)} />
              )}
              {i % every === 0 && (
                <text style={AXIS_TEXT} x={cx} y={H - 6} textAnchor="middle">
                  {shortDate(p.date)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <figcaption id={`${id}-s`} className="chart-summary">
        <strong>Hot flashes:</strong> {summary}
      </figcaption>
      <HiddenTable
        caption="Hot flashes per day"
        head={['Day', 'Hot flashes']}
        rows={points.filter((p) => p.value !== null).map((p) => [shortDate(p.date), String(p.value)])}
      />
    </figure>
  );
}

/* ------------------------------------------------------------- sleep hours (line + dots) */

export function SleepChart({ points }: { points: DayPoint[] }) {
  const id = useId();
  const [box, W] = useWidth();
  const t = trend(points);
  const H = 190;
  const padL = 32;
  const padB = 28;
  const lo = 0;
  const hi = Math.max(10, Math.ceil(t.max));
  const n = points.length;
  const slot = (W - padL) / n;
  const x = (i: number) => padL + slot * i + slot / 2;
  const y = (v: number) => H - padB - ((v - lo) / (hi - lo)) * (H - padB - 8);
  const every = labelEvery(n, W);

  // Break the line where a day has no entry.
  const segments: string[] = [];
  let cur = '';
  points.forEach((p, i) => {
    if (p.value === null) {
      if (cur) segments.push(cur);
      cur = '';
    } else {
      cur += `${cur ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`;
    }
  });
  if (cur) segments.push(cur);

  const summary =
    t.avg === null
      ? 'No sleep logged in this period.'
      : `About ${t.avg} hours a night on the ${t.logged} ${t.logged === 1 ? 'night' : 'nights'} you logged.${changeWords(t.first, t.last, 'hours')}`;

  return (
    <figure className="grid gap-3" ref={box}>
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="chart" role="img" aria-labelledby={`${id}-s`}>
        {/* 7–9 hours: the range most adults aim for */}
        <rect x={padL} y={y(9)} width={W - padL} height={y(7) - y(9)} className="bar-soft" opacity={0.35} />
        {[0, 4, 8].concat(hi > 10 ? [hi] : []).map((v) => (
          <g key={v}>
            <line className="grid-line" x1={padL} x2={W} y1={y(v)} y2={y(v)} />
            <text style={AXIS_TEXT} x={padL - 8} y={y(v) + 4} textAnchor="end">
              {v}h
            </text>
          </g>
        ))}
        {segments.map((d) => (
          <path key={d} className="line" d={d} />
        ))}
        {points.map((p, i) =>
          p.value === null ? null : <circle key={p.date} className="dot" cx={x(i)} cy={y(p.value)} r={n > 45 ? 2.5 : 4} />,
        )}
        {points.map((p, i) =>
          i % every === 0 ? (
            <text style={AXIS_TEXT} key={`l-${p.date}`} x={x(i)} y={H - 6} textAnchor="middle">
              {shortDate(p.date)}
            </text>
          ) : null,
        )}
      </svg>
      <figcaption id={`${id}-s`} className="chart-summary">
        <strong>Sleep:</strong> {summary} <span className="text-[var(--ink-muted)]">The shaded band is 7 to 9 hours.</span>
      </figcaption>
      <HiddenTable
        caption="Hours of sleep per night"
        head={['Night', 'Hours']}
        rows={points.filter((p) => p.value !== null).map((p) => [shortDate(p.date), String(p.value)])}
      />
    </figure>
  );
}

/* ------------------------------------------------------------- symptom frequency (horizontal bars) */

export interface SymptomBar {
  id: string;
  name: string;
  count: number;
  /** 0–100, share of entries that mention it. */
  percent: number;
  /** 1–5 average strength, optional. */
  strength?: number;
}

export function SymptomBars({ items, total, limit = 8 }: { items: SymptomBar[]; total: number; limit?: number }) {
  const id = useId();
  const shown = items.slice(0, limit);
  if (shown.length === 0) {
    return <p className="text-[var(--ink-muted)]">No symptoms logged in this period.</p>;
  }
  const top = shown[0];
  return (
    <figure className="grid gap-3">
      <ul className="grid gap-3" role="list" aria-labelledby={`${id}-s`}>
        {shown.map((s) => (
          <li key={s.id} className="grid gap-1.5">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <span className="font-bold">{s.name}</span>
              <span className="text-[1rem] text-[var(--ink-muted)]">
                {s.count} of {total} {total === 1 ? 'entry' : 'entries'}
                {typeof s.strength === 'number' ? ` · strength ${s.strength}/5` : ''}
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-[var(--meter-off)]" aria-hidden="true">
              <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${Math.max(2, s.percent)}%` }} />
            </div>
          </li>
        ))}
      </ul>
      <figcaption id={`${id}-s`} className="chart-summary">
        <strong>Most often:</strong> {top.name}, in {top.percent}% of your entries.
        {items.length > limit ? ` ${items.length - limit} more not shown.` : ''}
      </figcaption>
    </figure>
  );
}

/** Symptom counts straight from entries (used by the timeline). */
export function symptomBarsFromEntries(entries: Entry[]): SymptomBar[] {
  const map = new Map<string, { name: string; count: number; sum: number }>();
  for (const e of entries) {
    const seen = new Set<string>();
    for (const s of e.symptoms ?? []) {
      if (seen.has(s.symptomId)) continue;
      seen.add(s.symptomId);
      const m = map.get(s.symptomId) ?? { name: s.name, count: 0, sum: 0 };
      m.count += 1;
      m.sum += s.severity;
      map.set(s.symptomId, m);
    }
  }
  const total = entries.length || 1;
  return [...map.entries()]
    .map(([id, m]) => ({ id, name: m.name, count: m.count, percent: Math.round((m.count / total) * 100), strength: round1(m.sum / m.count) }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

/* ------------------------------------------------------------- how you felt (5 levels) */

export const FEELING_LABELS: Record<number, string> = { 1: 'Rough', 2: 'Low', 3: 'Okay', 4: 'Good', 5: 'Great' };

export function FeelingSpread({ entries }: { entries: Entry[] }) {
  const id = useId();
  const counts = [1, 2, 3, 4, 5].map((v) => entries.filter((e) => e.overallFeeling === v).length);
  const max = Math.max(1, ...counts);
  const good = counts[3] + counts[4];
  const hard = counts[0] + counts[1];
  return (
    <figure className="grid gap-3">
      <div className="grid grid-cols-5 items-end gap-2" style={{ height: '8.5rem' }} role="img" aria-labelledby={`${id}-s`}>
        {counts.map((c, i) => (
          <div key={i} className="flex h-full flex-col items-center justify-end gap-1.5">
            <span className="font-serif text-lg font-semibold tabular-nums">{c}</span>
            <div
              className="w-full max-w-[3.5rem] rounded-t-[6px] bg-[var(--accent)]"
              style={{ height: `${Math.max(4, (c / max) * 70)}%`, opacity: 0.45 + i * 0.13 }}
            />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-5 gap-2 text-center text-[0.95rem] font-bold text-[var(--ink-muted)]" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((v) => (
          <span key={v}>{FEELING_LABELS[v]}</span>
        ))}
      </div>
      <figcaption id={`${id}-s`} className="chart-summary">
        <strong>How you felt:</strong> {good} good or great {good === 1 ? 'day' : 'days'}, {hard} rough or low, out of{' '}
        {entries.length} {entries.length === 1 ? 'entry' : 'entries'}.
      </figcaption>
    </figure>
  );
}
