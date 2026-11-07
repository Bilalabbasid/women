'use client';

import { useCallback, useEffect, useId, useState, type ReactNode } from 'react';
import Link from 'next/link';
import type { LocalToolRecord, ToolKey } from '@/lib/db/schema';
import { ToolRecords } from '@/lib/storage/tool-records';
import { describeStorageError } from '@/lib/storage/errors';
import { requestPersistentStorage } from '@/lib/pwa/persist-storage';
import { btnDanger, btnDangerSolid, btnPrimary, btnSecondary, field, formatIsoDate } from './styles';
import { useLocalToday } from './use-tool-state';

export interface HistoryEntry<T> {
  id: string;
  date: string;
  label?: string;
  data: T;
  updatedAt: number;
}

interface ToolHistoryProps<T> {
  tool: ToolKey;
  /** Singular noun for one saved item, e.g. "symptom list". */
  noun: string;
  current: T;
  /** False while the current answers are empty, so there is nothing worth saving. */
  canSave: boolean;
  normalize: (raw: unknown) => T;
  summarize: (data: T) => string;
  onOpen: (data: T) => void;
  /** Trends or charts drawn from the saved entries (oldest first). */
  renderInsights?: (entries: HistoryEntry<T>[]) => ReactNode;
}

type Confirm = { id: string; action: 'delete' | 'overwrite' } | null;

/**
 * Dated history for a tool: save a copy of the current answers, then open,
 * update, rename/re-date or delete any saved copy. Everything stays in this
 * browser on this device.
 */
export function ToolHistory<T>({ tool, noun, current, canSave, normalize, summarize, onOpen, renderInsights }: ToolHistoryProps<T>) {
  const uid = useId();
  const today = useLocalToday();
  const [entries, setEntries] = useState<HistoryEntry<T>[] | null>(null);
  const [pickedDate, setDate] = useState('');
  const date = pickedDate || today;
  const [label, setLabel] = useState('');
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [editing, setEditing] = useState<{ id: string; date: string; label: string } | null>(null);

  const toEntry = useCallback(
    (r: LocalToolRecord): HistoryEntry<T> => ({ id: r.id, date: r.date, label: r.label, data: normalize(r.data), updatedAt: r.updatedAt }),
    [normalize],
  );

  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    let alive = true;
    ToolRecords.listEntries(tool).then(
      (rows) => {
        if (alive) setEntries(rows.map(toEntry));
      },
      (err) => {
        if (!alive) return;
        setEntries([]);
        setMessage({ kind: 'error', text: describeStorageError(err) });
      },
    );
    return () => {
      alive = false;
    };
  }, [tool, toEntry, version]);

  const run = async (fn: () => Promise<void>, ok: string) => {
    setBusy(true);
    setMessage(null);
    try {
      await fn();
      reload();
      setMessage({ kind: 'ok', text: ok });
    } catch (err) {
      setMessage({ kind: 'error', text: err instanceof Error && !('inner' in err) && err.name === 'Error' ? err.message : describeStorageError(err) });
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  };

  const save = () =>
    run(async () => {
      await ToolRecords.addEntry(tool, date, current, label);
      setLabel('');
      void requestPersistentStorage();
    }, `Saved your ${noun} for ${formatIsoDate(date)}.`);

  const list = entries ?? [];
  const chronological = [...list].reverse();

  return (
    <section
      aria-labelledby={`${uid}-heading`}
      className="no-print panel gap-4"
    >
      <div className="space-y-1">
        <h2 id={`${uid}-heading`} className="panel-title">
          Your saved {noun}s{entries ? ` (${list.length})` : ''}
        </h2>
        <p className="text-sm text-[var(--color-ink-muted)]">
          Keep a dated copy to compare over time or bring to an appointment. Saved copies stay in this browser on this
          device until you delete them. They are never sent anywhere.
        </p>
      </div>

      <form
        className="grid gap-3 sm:grid-cols-[minmax(0,10rem)_minmax(0,1fr)_auto] sm:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          if (canSave && date) void save();
        }}
      >
        <div>
          <label htmlFor={`${uid}-date`} className="block text-sm font-semibold">
            Date
          </label>
          <input id={`${uid}-date`} type="date" required value={date} max={today || undefined} onChange={(e) => setDate(e.target.value)} className={`mt-1 ${field}`} />
        </div>
        <div>
          <label htmlFor={`${uid}-label`} className="block text-sm font-semibold">
            Name <span className="font-normal text-[var(--color-ink-muted)]">(optional)</span>
          </label>
          <input
            id={`${uid}-label`}
            type="text"
            maxLength={80}
            value={label}
            placeholder="e.g. Before my GP appointment"
            onChange={(e) => setLabel(e.target.value)}
            className={`mt-1 ${field}`}
          />
        </div>
        <button type="submit" disabled={!canSave || !date || busy} className={btnPrimary}>
          Save this {noun}
        </button>
      </form>
      {!canSave && <p className="text-sm text-[var(--color-ink-muted)]">Fill in the tool above first, then save a copy here.</p>}

      <p role="status" aria-live="polite" className={message?.kind === 'error' ? 'font-semibold text-[var(--color-urgent)]' : 'text-[var(--color-accent)]'}>
        {message?.text ?? ''}
      </p>

      {entries === null ? (
        <p className="text-[var(--color-ink-muted)]">Loading your saved {noun}s…</p>
      ) : list.length === 0 ? (
        <p className="rounded-lg bg-[var(--color-paper)] p-3 text-[var(--color-ink-muted)]">No saved {noun}s yet.</p>
      ) : (
        <ul className="space-y-3">
          {list.map((e) => {
            const isEditing = editing?.id === e.id;
            const confirming = confirm?.id === e.id ? confirm.action : null;
            return (
              <li key={e.id} className="space-y-2 rounded-lg border border-[var(--color-rule)] bg-[var(--color-paper)] p-3">
                {isEditing ? (
                  <form
                    className="grid gap-3 sm:grid-cols-[minmax(0,10rem)_minmax(0,1fr)]"
                    onSubmit={(ev) => {
                      ev.preventDefault();
                      void run(async () => {
                        await ToolRecords.updateEntry(e.id, { date: editing.date, label: editing.label });
                        setEditing(null);
                      }, 'Changes saved.');
                    }}
                  >
                    <div>
                      <label htmlFor={`${uid}-ed-${e.id}`} className="block text-sm font-semibold">
                        Date
                      </label>
                      <input
                        id={`${uid}-ed-${e.id}`}
                        type="date"
                        required
                        max={today || undefined}
                        value={editing.date}
                        onChange={(ev) => setEditing({ ...editing, date: ev.target.value })}
                        className={`mt-1 ${field}`}
                      />
                    </div>
                    <div>
                      <label htmlFor={`${uid}-el-${e.id}`} className="block text-sm font-semibold">
                        Name
                      </label>
                      <input
                        id={`${uid}-el-${e.id}`}
                        type="text"
                        maxLength={80}
                        value={editing.label}
                        onChange={(ev) => setEditing({ ...editing, label: ev.target.value })}
                        className={`mt-1 ${field}`}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2 sm:col-span-2">
                      <button type="submit" disabled={busy} className={btnPrimary}>
                        Save changes
                      </button>
                      <button type="button" onClick={() => setEditing(null)} className={btnSecondary}>
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div>
                    <p className="font-semibold">
                      {formatIsoDate(e.date)}
                      {e.label && <span className="font-normal text-[var(--color-ink-muted)]"> · {e.label}</span>}
                    </p>
                    <p className="text-sm text-[var(--color-ink-muted)]">{summarize(e.data)}</p>
                  </div>
                )}

                {!isEditing &&
                  (confirming ? (
                    <div className="flex flex-wrap items-center gap-2 rounded-lg bg-[var(--color-urgent-soft)] p-2">
                      <span className="text-sm font-semibold">
                        {confirming === 'delete'
                          ? `Delete the ${noun} from ${formatIsoDate(e.date)}? This can't be undone.`
                          : `Replace the ${noun} from ${formatIsoDate(e.date)} with your current answers?`}
                      </span>
                      <button
                        type="button"
                        disabled={busy}
                        className={btnDangerSolid}
                        onClick={() =>
                          confirming === 'delete'
                            ? void run(() => ToolRecords.deleteEntry(e.id), `Deleted the ${noun} from ${formatIsoDate(e.date)}.`)
                            : void run(() => ToolRecords.updateEntry(e.id, { data: current }), `Updated the ${noun} from ${formatIsoDate(e.date)}.`)
                        }
                      >
                        {confirming === 'delete' ? 'Yes, delete' : 'Yes, replace'}
                      </button>
                      <button type="button" className={btnSecondary} onClick={() => setConfirm(null)}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className={btnSecondary}
                        onClick={() => {
                          onOpen(e.data);
                          setMessage({
                            kind: 'ok',
                            text: `Opened the ${noun} from ${formatIsoDate(e.date)} above. Edits change your current answers; use “Update with current answers” to save them back to this copy.`,
                          });
                        }}
                      >
                        Open<span className="sr-only"> the {noun} from {formatIsoDate(e.date)}</span>
                      </button>
                      <button type="button" disabled={!canSave} className={btnSecondary} onClick={() => setConfirm({ id: e.id, action: 'overwrite' })}>
                        Update with current answers
                      </button>
                      <button type="button" className={btnSecondary} onClick={() => setEditing({ id: e.id, date: e.date, label: e.label ?? '' })}>
                        Edit date or name
                      </button>
                      <button type="button" className={btnDanger} onClick={() => setConfirm({ id: e.id, action: 'delete' })}>
                        Delete<span className="sr-only"> the {noun} from {formatIsoDate(e.date)}</span>
                      </button>
                    </div>
                  ))}
              </li>
            );
          })}
        </ul>
      )}

      {renderInsights && chronological.length >= 2 && <div className="space-y-2">{renderInsights(chronological)}</div>}

      <p className="text-sm text-[var(--color-ink-muted)]">
        Saved data lives only in this browser on this device. Clearing browsing data, private browsing, or switching device
        or browser can remove it, so back it up now and then.{' '}
        <Link href="/app/storage/" className="font-semibold text-[var(--color-link)] underline">
          Manage storage, back up or restore
        </Link>
      </p>
    </section>
  );
}
