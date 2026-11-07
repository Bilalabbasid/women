'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { SYMPTOM_CATALOG, triggerIdsFor, trackerIdsFor } from '@/lib/tools/symptom-catalog';
import { evaluateUrgentTriggers } from '@/lib/safety/urgent-triggers';
import { UrgentGuidance } from '@/components/safety/urgent-guidance';
import { markToolUsed } from '@/lib/pwa/install-gate';
import { useToolState, savedLabel } from '@/components/storage/use-tool-state';
import { ToolHistory, type HistoryEntry } from '@/components/storage/tool-history';
import { btnDanger, btnPrimary, btnSecondary } from '@/components/storage/styles';

const PINNED_KEY = 'menowell_pinned_symptoms';

interface ChecklistState {
  ticked: string[];
}

const DEFAULT_STATE: ChecklistState = { ticked: [] };
const ALL_ITEMS = SYMPTOM_CATALOG.flatMap((g) => g.items);
const KNOWN_IDS = new Set(ALL_ITEMS.map((i) => i.id));
const LABELS = new Map(ALL_ITEMS.map((i) => [i.id, i.label]));

function normalize(raw: unknown): ChecklistState {
  const ticked = (raw as Partial<ChecklistState> | null)?.ticked;
  return { ticked: Array.isArray(ticked) ? ticked.filter((x): x is string => typeof x === 'string' && KNOWN_IDS.has(x)) : [] };
}

function summarize(s: ChecklistState): string {
  if (s.ticked.length === 0) return 'No symptoms ticked';
  const names = s.ticked.map((id) => LABELS.get(id)).filter(Boolean) as string[];
  const shown = names.slice(0, 3).join('; ');
  return `${s.ticked.length} symptom${s.ticked.length === 1 ? '' : 's'}: ${shown}${names.length > 3 ? `; and ${names.length - 3} more` : ''}`;
}

/** How often each symptom appears across her saved lists, and how many she ticked each time. */
function ChecklistTrends({ entries }: { entries: HistoryEntry<ChecklistState>[] }) {
  const counts = new Map<string, number>();
  for (const e of entries) for (const id of e.data.ticked) counts.set(id, (counts.get(id) ?? 0) + 1);
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  const max = Math.max(1, ...entries.map((e) => e.data.ticked.length));
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <figure className="space-y-2">
        <figcaption className="font-semibold">Symptoms ticked in each saved list</figcaption>
        <ul className="space-y-1.5">
          {entries.map((e) => (
            <li key={e.id} className="grid grid-cols-[6.5rem_1fr_2rem] items-center gap-2 text-sm">
              <span className="text-[var(--color-ink-muted)]">{e.date}</span>
              <span className="h-3 rounded bg-[var(--color-accent-soft)]" aria-hidden="true">
                <span className="block h-3 rounded bg-[var(--color-accent)]" style={{ width: `${(e.data.ticked.length / max) * 100}%` }} />
              </span>
              <span className="text-right font-semibold">{e.data.ticked.length}</span>
            </li>
          ))}
        </ul>
      </figure>
      <figure className="space-y-2">
        <figcaption className="font-semibold">Most often on your lists</figcaption>
        <ul className="space-y-1 text-sm">
          {top.map(([id, n]) => (
            <li key={id} className="flex justify-between gap-3 border-b border-[var(--color-rule)] py-1">
              <span>{LABELS.get(id)}</span>
              <span className="shrink-0 font-semibold">
                {n} of {entries.length}
              </span>
            </li>
          ))}
        </ul>
      </figure>
    </div>
  );
}

/**
 * Interactive, printable symptoms checklist. Current ticks autosave in this
 * browser (IndexedDB); she can keep dated copies to compare over time. It never
 * scores, counts towards a threshold, or says what stage she is in
 * (content/_tools/symptoms-checklist.yaml). Nothing is sent anywhere.
 */
export function SymptomsChecklist({ liveUrls, trackerLive }: { liveUrls: string[]; trackerLive: boolean }) {
  const { state, update, reset, status } = useToolState('symptoms-checklist', DEFAULT_STATE, normalize);
  const [pinMessage, setPinMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const ticked = useMemo(() => new Set(state.ticked), [state.ticked]);
  const live = useMemo(() => new Set(liveUrls), [liveUrls]);
  const urgent = useMemo(() => evaluateUrgentTriggers({ symptomIds: triggerIdsFor(ticked) }), [ticked]);

  const toggle = (id: string) => {
    setPinMessage(null);
    update((prev) => ({ ticked: prev.ticked.includes(id) ? prev.ticked.filter((x) => x !== id) : [...prev.ticked, id] }));
  };

  const addToTracker = () => {
    const ids = trackerIdsFor(ticked);
    try {
      const existing: string[] = JSON.parse(window.localStorage.getItem(PINNED_KEY) ?? '[]');
      window.localStorage.setItem(PINNED_KEY, JSON.stringify([...new Set([...existing, ...ids])]));
      setPinMessage({ ok: true, text: 'Added to your tracker on this device.' });
      markToolUsed();
    } catch {
      setPinMessage({ ok: false, text: 'This browser would not save to your tracker. Storage may be blocked or full.' });
    }
  };

  const tickedItems = ALL_ITEMS.filter((i) => ticked.has(i.id));
  const trackable = trackerIdsFor(ticked).length;

  return (
    <div className="space-y-6" data-tool-ui="symptoms-checklist">
      <form onSubmit={(e) => e.preventDefault()} className="space-y-5" aria-describedby="checklist-help">
        <p id="checklist-help" className="text-[var(--color-ink-muted)]">
          Tick anything you have noticed recently. Your ticks are saved in this browser on this device as you go, and are
          never sent anywhere.
        </p>
        {SYMPTOM_CATALOG.map((group) => (
          <fieldset key={group.id} className="panel min-w-0 gap-1">
            <legend className="panel-title mb-1">{group.label}</legend>
            <ul className="divide-y divide-[var(--rule)]">
              {group.items.map((item) => {
                const inputId = `chk-${item.id}`;
                return (
                  <li key={item.id} className="check items-center gap-x-3 py-1">
                    <input id={inputId} type="checkbox" checked={ticked.has(item.id)} onChange={() => toggle(item.id)} />
                    <label htmlFor={inputId} className="flex min-h-11 flex-1 cursor-pointer items-center py-1">
                      {item.label}
                    </label>
                    {live.has(item.url) && (
                      <Link href={item.url} className="tap shrink-0 text-[1rem] font-bold text-[var(--link)] underline underline-offset-2">
                        Read more<span className="sr-only"> about {item.label.toLowerCase()}</span>
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </fieldset>
        ))}
      </form>

      <section aria-labelledby="checklist-summary" aria-live="polite" className="panel panel-feature gap-4">
        <h2 id="checklist-summary" className="panel-title">
          Your list
        </h2>

        {/* Safety first: urgent guidance comes before anything else, and nothing commercial appears here. */}
        <UrgentGuidance triggers={urgent} />

        {tickedItems.length === 0 ? (
          <p className="text-[var(--ink-muted)]">Nothing ticked yet. Tick anything you’ve noticed above and it appears here.</p>
        ) : (
          <>
            <ul className="chip-row" aria-label="Symptoms you ticked">
              {tickedItems.map((i) => (
                <li key={i.id} className="chip cursor-default hover:border-[var(--rule-strong)]">
                  {i.label}
                </li>
              ))}
            </ul>
            <p className="rounded-[var(--radius)] border-l-4 border-[var(--accent)] bg-[var(--accent-soft)] p-4">
              This list can&apos;t tell you whether you are in perimenopause or menopause. Many of these symptoms have
              other possible causes, so they are worth talking through with a clinician who can look at the whole
              picture. Take this list with you.
            </p>
          </>
        )}

        <p className={`no-print text-sm ${status.error ? 'font-semibold text-[var(--color-urgent)]' : 'text-[var(--color-ink-muted)]'}`}>
          {savedLabel(status)}
        </p>

        <div className="no-print flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              markToolUsed();
              window.print();
            }}
            className={btnPrimary}
          >
            Print my list
          </button>
          <button
            type="button"
            disabled={ticked.size === 0}
            onClick={async () => {
              markToolUsed();
              const { checklistPdf, downloadSimplePdf } = await import('@/lib/tools/simple-pdf');
              const groups = SYMPTOM_CATALOG.map((g) => ({ label: g.label, items: g.items.filter((i) => ticked.has(i.id)).map((i) => i.label) }));
              downloadSimplePdf(checklistPdf(groups), 'symptoms-checklist');
            }}
            className={btnSecondary}
          >
            Download PDF
          </button>
          {trackerLive && trackable > 0 && (
            <button type="button" onClick={addToTracker} className={btnSecondary}>
              Add these to my tracker
            </button>
          )}
          {ticked.size > 0 && (
            <button type="button" onClick={() => void reset()} className={btnDanger}>
              Clear my ticks
            </button>
          )}
        </div>
        {pinMessage && (
          <p role="status" className={pinMessage.ok ? '' : 'font-semibold text-[var(--color-urgent)]'}>
            {pinMessage.text}{' '}
            {pinMessage.ok && (
              <Link href="/app/check-in/" className="font-semibold text-[var(--color-link)] underline">
                Log today
              </Link>
            )}
          </p>
        )}
      </section>

      <ToolHistory
        tool="symptoms-checklist"
        noun="symptom list"
        current={state}
        canSave={state.ticked.length > 0}
        normalize={normalize}
        summarize={summarize}
        onOpen={(data) => update(data)}
        renderInsights={(entries) => <ChecklistTrends entries={entries} />}
      />
    </div>
  );
}
