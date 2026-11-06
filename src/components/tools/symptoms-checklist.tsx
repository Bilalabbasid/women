'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { SYMPTOM_CATALOG, triggerIdsFor, trackerIdsFor } from '@/lib/tools/symptom-catalog';
import { evaluateUrgentTriggers } from '@/lib/safety/urgent-triggers';
import { UrgentGuidance } from '@/components/safety/urgent-guidance';
import { markToolUsed } from '@/lib/pwa/install-gate';

const PINNED_KEY = 'menowell_pinned_symptoms';

/**
 * Interactive, printable symptoms checklist. Ticks live in this page's memory
 * only; nothing is stored or sent unless she chooses "Add to my tracker", which
 * saves the matching symptom ids in this browser. It never scores, counts
 * towards a threshold, or says what stage she is in
 * (content/_tools/symptoms-checklist.yaml).
 */
export function SymptomsChecklist({ liveUrls, trackerLive }: { liveUrls: string[]; trackerLive: boolean }) {
  const [ticked, setTicked] = useState<Set<string>>(new Set());
  const [saved, setSaved] = useState(false);
  const live = useMemo(() => new Set(liveUrls), [liveUrls]);
  const urgent = useMemo(() => evaluateUrgentTriggers({ symptomIds: triggerIdsFor(ticked) }), [ticked]);

  const toggle = (id: string) => {
    setSaved(false);
    setTicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const addToTracker = () => {
    const ids = trackerIdsFor(ticked);
    try {
      const existing: string[] = JSON.parse(window.localStorage.getItem(PINNED_KEY) ?? '[]');
      window.localStorage.setItem(PINNED_KEY, JSON.stringify([...new Set([...existing, ...ids])]));
      setSaved(true);
      markToolUsed();
    } catch {
      setSaved(false);
    }
  };

  const tickedItems = SYMPTOM_CATALOG.flatMap((g) => g.items).filter((i) => ticked.has(i.id));
  const trackable = trackerIdsFor(ticked).length;

  const exportJson = () => {
    try {
      const payload = {
        tool: 'symptoms-checklist',
        app: 'MenoVerdict',
        exportedAt: new Date().toISOString(),
        tickedSymptoms: tickedItems.map((i) => ({ id: i.id, label: i.label, url: i.url })),
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `menoverdict-symptoms-checklist-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
  };

  const deleteAllToolData = () => {
    setTicked(new Set());
    setSaved(false);
    try {
      window.localStorage.removeItem(PINNED_KEY);
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-6" data-tool-ui="symptoms-checklist">
      <form onSubmit={(e) => e.preventDefault()} className="space-y-5" aria-describedby="checklist-help">
        <p id="checklist-help" className="text-[var(--color-ink-muted)]">
          Tick anything you have noticed recently. Your ticks stay on this page and are not sent anywhere.
        </p>
        {SYMPTOM_CATALOG.map((group) => (
          <fieldset key={group.id} className="space-y-1 rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)] p-4">
            <legend className="px-1 font-serif text-xl font-semibold">{group.label}</legend>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const inputId = `chk-${item.id}`;
                return (
                  <li key={item.id} className="flex flex-wrap items-center gap-x-3">
                    <input
                      id={inputId}
                      type="checkbox"
                      checked={ticked.has(item.id)}
                      onChange={() => toggle(item.id)}
                      className="h-6 w-6 shrink-0 accent-[var(--color-accent)]"
                    />
                    <label htmlFor={inputId} className="tap flex-1 cursor-pointer py-1">
                      {item.label}
                    </label>
                    {live.has(item.url) && (
                      <Link href={item.url} className="tap text-[var(--color-link)] underline">
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

      <section aria-labelledby="checklist-summary" aria-live="polite" className="space-y-4">
        <h2 id="checklist-summary" className="text-2xl">
          Your list
        </h2>

        {/* Safety first: urgent guidance comes before anything else, and nothing commercial appears here. */}
        <UrgentGuidance triggers={urgent} />

        {tickedItems.length === 0 ? (
          <p>Nothing ticked yet.</p>
        ) : (
          <>
            <ul className="list-disc space-y-1 pl-6">
              {tickedItems.map((i) => (
                <li key={i.id}>{i.label}</li>
              ))}
            </ul>
            <p className="rounded-xl bg-[var(--color-accent-soft)] p-4">
              This list can&apos;t tell you whether you are in perimenopause or menopause. Many of these symptoms have
              other possible causes, so they are worth talking through with a clinician who can look at the whole
              picture. Take this list with you.
            </p>
          </>
        )}

        <div className="no-print flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              markToolUsed();
              window.print();
            }}
            className="tap rounded-xl bg-[var(--color-accent)] px-5 font-semibold text-white"
          >
            Print my list
          </button>
          {trackerLive && trackable > 0 && (
            <button
              type="button"
              onClick={addToTracker}
              className="tap rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)] px-5 font-semibold"
            >
              Add these to my tracker
            </button>
          )}
          {ticked.size > 0 && (
            <button
              type="button"
              onClick={exportJson}
              className="tap rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)] px-5 font-semibold"
            >
              Export my list (JSON)
            </button>
          )}
          <button
            type="button"
            onClick={deleteAllToolData}
            className="tap rounded-xl px-3 font-semibold text-[var(--color-urgent)] underline"
          >
            Delete all my data
          </button>
        </div>
        {saved && (
          <p role="status">
            Added to your tracker on this device.{' '}
            <Link href="/app/check-in/" className="font-semibold text-[var(--color-link)] underline">
              Log today
            </Link>
          </p>
        )}
      </section>
    </div>
  );
}
