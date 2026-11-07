'use client';

import { useDeferredValue, useId, useMemo, useState } from 'react';
import Link from 'next/link';
import type { DirectoryGroup, SymptomGroupId } from './hub-symptoms-data';
import { IconBodyJoints, IconCycle, IconIntimate, IconMindMood, IconOther, IconSkinHair, IconSleepTemp } from './hub-icons';

/**
 * Symptoms hub directory: group filter chips plus instant on-page search.
 * Server-rendered with everything showing (works without JavaScript); filtering
 * happens on this device as she types. Light typo tolerance: each word may match
 * the start of a word, or be one letter off for words of 4+ letters.
 */

const GROUP_ICON: Record<SymptomGroupId, (p: React.SVGProps<SVGSVGElement>) => React.ReactElement> = {
  sleep: IconSleepTemp,
  mind: IconMindMood,
  body: IconBodyJoints,
  cycle: IconCycle,
  intimate: IconIntimate,
  skin: IconSkinHair,
  other: IconOther,
};

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/** True when a and b differ by at most one edit (insert, delete or substitute). */
function withinOne(a: string, b: string): boolean {
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i++;
      j++;
      continue;
    }
    if (++edits > 1) return false;
    if (a.length > b.length) i++;
    else if (b.length > a.length) j++;
    else {
      i++;
      j++;
    }
  }
  return edits + (a.length - i) + (b.length - j) <= 1;
}

function matches(queryWords: string[], haystackWords: string[]): boolean {
  return queryWords.every((q) =>
    haystackWords.some((w) => w.startsWith(q) || (q.length >= 4 && (withinOne(q, w) || withinOne(q, w.slice(0, q.length))))),
  );
}

function Highlight({ text, words }: { text: string; words: string[] }) {
  if (!words.length) return <>{text}</>;
  const lower = text.toLowerCase();
  for (const w of words) {
    const at = lower.search(new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
    if (at >= 0) {
      return (
        <>
          {text.slice(0, at)}
          <mark>{text.slice(at, at + w.length)}</mark>
          {text.slice(at + w.length)}
        </>
      );
    }
  }
  return <>{text}</>;
}

export function SymptomsDirectory({ groups, total }: { groups: DirectoryGroup[]; total: number }) {
  const uid = useId();
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState<SymptomGroupId | 'all'>('all');
  const deferred = useDeferredValue(query);

  const qWords = useMemo(() => norm(deferred).split(' ').filter(Boolean), [deferred]);

  const visible = useMemo(
    () =>
      groups
        .filter((g) => group === 'all' || g.id === group)
        .map((g) => ({
          ...g,
          items: qWords.length
            ? g.items.filter((it) => matches(qWords, norm(`${it.title} ${it.desc} ${it.terms}`).split(' ')))
            : g.items,
        }))
        .filter((g) => g.items.length > 0),
    [groups, group, qWords],
  );
  const shown = visible.reduce((n, g) => n + g.items.length, 0);

  return (
    <div className="grid gap-6">
      <div className="symptom-dir-tools no-print">
        <div className="field">
          <label htmlFor={`${uid}-q`} className="label">
            Find a symptom
          </label>
          <div className="search-input">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              id={`${uid}-q`}
              className="input"
              type="search"
              autoComplete="off"
              enterKeyHint="search"
              placeholder="Try “can’t sleep” or “angry all the time”"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-describedby={`${uid}-count`}
            />
          </div>
        </div>
        <div className="chip-row" role="group" aria-label="Show symptoms in">
          <button type="button" className="chip" aria-pressed={group === 'all'} onClick={() => setGroup('all')}>
            All <span className="chip-count">{total}</span>
          </button>
          {groups.map((g) => (
            <button key={g.id} type="button" className="chip" aria-pressed={group === g.id} onClick={() => setGroup(group === g.id ? 'all' : g.id)}>
              {g.label} <span className="chip-count">{g.items.length}</span>
            </button>
          ))}
        </div>
        <p id={`${uid}-count`} className="hint" role="status" aria-live="polite">
          {qWords.length || group !== 'all'
            ? `${shown} ${shown === 1 ? 'guide' : 'guides'} shown`
            : `${total} guides in ${groups.length} groups`}
        </p>
      </div>

      {visible.length === 0 ? (
        <div className="empty-state">
          <strong>No guides match “{query.trim()}”</strong>
          <span>Try a simpler word, like “sleep”, “mood” or “skin”, or browse every symptom.</span>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setQuery('');
              setGroup('all');
            }}
          >
            Show all symptoms
          </button>
        </div>
      ) : (
        <div>
          {visible.map((g) => {
            const I = GROUP_ICON[g.id];
            return (
              <section key={g.id} id={`group-${g.id}`} className="hub-group" aria-labelledby={`${uid}-${g.id}`}>
                <div className="hub-group-head">
                  <span className="hub-group-icon">
                    <I />
                  </span>
                  <div>
                    <h3 id={`${uid}-${g.id}`} className="hub-group-title">
                      {g.label}
                    </h3>
                    <p className="hub-group-count">
                      {g.items.length} {g.items.length === 1 ? 'guide' : 'guides'} · {g.blurb}
                    </p>
                  </div>
                </div>
                <ul className="guide-grid">
                  {g.items.map((it) => (
                    <li key={it.url}>
                      <Link href={it.url} className="guide-card">
                        <span className="guide-card-title">
                          <span>
                            <Highlight text={it.title} words={qWords} />
                          </span>
                          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M5 12h14M13 6l6 6-6 6" />
                          </svg>
                        </span>
                        <span className="guide-card-desc">{it.desc}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
