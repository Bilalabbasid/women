'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { AppHeader } from '@/components/app/app-header';
import {
  CATEGORIES,
  type CategoryId,
  type CategorySummary,
  type DateRange,
  type RangePreview,
  type StorageEstimate,
  summarizeAll,
  oldestLoggedDays,
  previewRange,
  deleteRange,
  clearCategories,
  clearEverything,
  getStorageEstimate,
  isStorageLow,
  requestPersistence,
  formatBytes,
} from '@/lib/storage/manager';
import { downloadBackup, parseBackup, readFileText, restoreBackup, type ParsedBackup, type RestoreMode } from '@/lib/storage/backup';
import { describeStorageError } from '@/lib/storage/errors';
import { btnDanger, btnDangerSolid, btnPrimary, btnSecondary, field, formatIsoDate } from '@/components/storage/styles';
import { useLocalToday } from '@/components/storage/use-tool-state';

const LABEL = new Map(CATEGORIES.map((c) => [c.id, c.label]));
const DATED = CATEGORIES.filter((c) => c.dated).map((c) => c.id);

type Pending =
  | { kind: 'range'; title: string; categories: CategoryId[]; range: DateRange; preview: RangePreview }
  | { kind: 'category'; id: CategoryId; summary: CategorySummary }
  | { kind: 'all'; total: number }
  | { kind: 'restore'; parsed: ParsedBackup; mode: RestoreMode };

type Msg = { kind: 'ok' | 'error'; text: string } | null;

function errorText(err: unknown): string {
  return err instanceof Error && err.name === 'Error' ? err.message : describeStorageError(err);
}

function span(s: { oldest?: string; newest?: string }): string {
  if (!s.oldest) return '';
  return s.oldest === s.newest ? formatIsoDate(s.oldest) : `${formatIsoDate(s.oldest)} – ${formatIsoDate(s.newest!)}`;
}

function Card({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="space-y-3 rounded-2xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)] p-4 sm:p-5">
      <h2 id={id} className="text-xl sm:text-2xl">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function ManageStoragePage() {
  const today = useLocalToday();
  const [summaries, setSummaries] = useState<CategorySummary[] | null>(null);
  const [estimate, setEstimate] = useState<StorageEstimate | null>(null);
  const [version, setVersion] = useState(0);
  const [msg, setMsg] = useState<Msg>(null);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<Pending | null>(null);
  const [chosen, setChosen] = useState<CategoryId[] | null>(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    let alive = true;
    Promise.all([summarizeAll(), getStorageEstimate()]).then(
      ([s, e]) => {
        if (!alive) return;
        setSummaries(s);
        setEstimate(e);
      },
      (err) => {
        if (!alive) return;
        setSummaries([]);
        setMsg({ kind: 'error', text: describeStorageError(err) });
      },
    );
    return () => {
      alive = false;
    };
  }, [version]);

  useEffect(() => {
    if (pending) confirmRef.current?.focus();
  }, [pending]);

  const withData = useMemo(() => (summaries ?? []).filter((s) => s.hasData), [summaries]);
  const datedWithData = useMemo(
    () => (summaries ?? []).filter((s) => DATED.includes(s.id) && s.records > 0).map((s) => s.id),
    [summaries],
  );
  const selected = chosen ?? datedWithData;
  const total = (summaries ?? []).reduce((n, s) => n + s.records, 0);

  const toggleChosen = (id: CategoryId) =>
    setChosen((prev) => {
      const base = prev ?? datedWithData;
      return base.includes(id) ? base.filter((x) => x !== id) : [...base, id];
    });

  /** Runs a confirmed change, then closes the confirmation and recounts. */
  const act = async (fn: () => Promise<string>) => {
    setBusy(true);
    setMsg(null);
    try {
      const text = await fn();
      setMsg({ kind: 'ok', text });
      setPending(null);
      refresh();
    } catch (err) {
      setMsg({ kind: 'error', text: errorText(err) });
    } finally {
      setBusy(false);
    }
  };

  /** Works out what a change would do and opens the confirmation; changes nothing yet. */
  const propose = async (fn: () => Promise<void>) => {
    setBusy(true);
    setMsg(null);
    setPending(null);
    try {
      await fn();
    } catch (err) {
      setMsg({ kind: 'error', text: errorText(err) });
    } finally {
      setBusy(false);
    }
  };

  const proposeOldest = (n: number) =>
    propose(async () => {
      if (selected.length === 0) throw new Error('Choose at least one kind of data first.');
      const days = await oldestLoggedDays(selected, n);
      if (!days) throw new Error('There are no dated records in the data you chose.');
      const preview = await previewRange(selected, days);
      setPending({
        kind: 'range',
        title: `Delete your oldest ${days.days} logged day${days.days === 1 ? '' : 's'}`,
        categories: selected,
        range: days,
        preview,
      });
    });

  const proposeRange = () =>
    propose(async () => {
      if (selected.length === 0) throw new Error('Choose at least one kind of data first.');
      const range = { from, to };
      const preview = await previewRange(selected, range);
      if (preview.total === 0) throw new Error(`Nothing in the data you chose is dated ${formatIsoDate(from)} to ${formatIsoDate(to)}.`);
      setPending({ kind: 'range', title: 'Delete a custom date range', categories: selected, range, preview });
    });

  const onPickFile = async (file: File | undefined) => {
    if (!file) return;
    await propose(async () => {
      const parsed = parseBackup(await readFileText(file));
      setPending({ kind: 'restore', parsed, mode: 'merge' });
    });
    if (fileRef.current) fileRef.current.value = '';
  };

  const confirm = () => {
    if (!pending) return;
    if (pending.kind === 'range') {
      void act(async () => {
        const done = await deleteRange(pending.categories, pending.range);
        return `Deleted ${done.total} record${done.total === 1 ? '' : 's'} dated ${formatIsoDate(pending.range.from)} to ${formatIsoDate(pending.range.to)}. Everything else is untouched.`;
      });
    } else if (pending.kind === 'category') {
      void act(async () => {
        await clearCategories([pending.id]);
        return `Deleted all of: ${LABEL.get(pending.id)}.`;
      });
    } else if (pending.kind === 'all') {
      void act(async () => {
        await clearEverything();
        return 'All data from this site has been deleted from this browser.';
      });
    } else {
      void act(async () => {
        const { written } = await restoreBackup(pending.parsed, pending.mode);
        return `Restored ${written} record${written === 1 ? '' : 's'} from your backup${pending.mode === 'replace' ? ', replacing what was here' : ''}.`;
      });
    }
  };

  const usagePct = estimate?.usage != null && estimate.quota ? Math.min(100, (estimate.usage / estimate.quota) * 100) : null;

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader title="Manage storage" subtitle="Back up, restore and delete" showBack backHref="/app/settings/" showPrivacyBadge showSettings={false} />

      <div className="mx-auto w-full max-w-2xl flex-1 space-y-5 px-4 py-5">
        <p role="status" aria-live="polite" className={msg?.text ? (msg.kind === 'error' ? 'rounded-xl bg-[var(--color-urgent-soft)] p-3 font-semibold text-[var(--color-urgent)]' : 'rounded-xl bg-[var(--color-accent-soft)] p-3') : 'sr-only'}>
          {msg?.text ?? ''}
        </p>

        {pending && (
          <div
            ref={confirmRef}
            tabIndex={-1}
            role="alertdialog"
            aria-labelledby="confirm-title"
            aria-describedby="confirm-body"
            className="space-y-3 rounded-2xl border-2 border-[var(--color-urgent)] bg-[var(--color-urgent-soft)] p-4 sm:p-5"
          >
            {pending.kind === 'range' && (
              <>
                <h2 id="confirm-title" className="text-xl">
                  {pending.title}?
                </h2>
                <div id="confirm-body" className="space-y-2">
                  <p>
                    Records dated <strong>{formatIsoDate(pending.range.from)}</strong> to{' '}
                    <strong>{formatIsoDate(pending.range.to)}</strong> will be permanently deleted:
                  </p>
                  <ul className="list-disc pl-6">
                    {Object.entries(pending.preview.perCategory)
                      .filter(([, n]) => (n ?? 0) > 0)
                      .map(([id, n]) => (
                        <li key={id}>
                          {LABEL.get(id as CategoryId)}: <strong>{n}</strong>
                          {id === 'checkins' && pending.preview.symptomRatings > 0 && ` (with ${pending.preview.symptomRatings} symptom ratings)`}
                        </li>
                      ))}
                  </ul>
                  <p className="font-semibold">
                    {pending.preview.total} record{pending.preview.total === 1 ? '' : 's'} in total. This can&apos;t be undone.
                  </p>
                </div>
              </>
            )}
            {pending.kind === 'category' && (
              <>
                <h2 id="confirm-title" className="text-xl">
                  Delete all of: {LABEL.get(pending.id)}?
                </h2>
                <p id="confirm-body">
                  <strong>{pending.summary.records}</strong> record{pending.summary.records === 1 ? '' : 's'}
                  {pending.summary.detail ? `, ${pending.summary.detail}` : ''} will be permanently deleted. Other data is untouched. This
                  can&apos;t be undone.
                </p>
              </>
            )}
            {pending.kind === 'all' && (
              <>
                <h2 id="confirm-title" className="text-xl">
                  Delete everything this site has stored in this browser?
                </h2>
                <p id="confirm-body">
                  All <strong>{pending.total}</strong> records, your current answers in every tool, and your preferences will be
                  permanently deleted. Consider downloading a backup first. This can&apos;t be undone.
                </p>
              </>
            )}
            {pending.kind === 'restore' && (
              <>
                <h2 id="confirm-title" className="text-xl">
                  Restore this backup?
                </h2>
                <div id="confirm-body" className="space-y-2">
                  <p>
                    Backup {pending.parsed.exportedAt ? `from ${new Date(pending.parsed.exportedAt).toLocaleString()}` : ''} with{' '}
                    <strong>{pending.parsed.total}</strong> record{pending.parsed.total === 1 ? '' : 's'}
                    {pending.parsed.skipped > 0 && ` (${pending.parsed.skipped} damaged record${pending.parsed.skipped === 1 ? '' : 's'} will be skipped)`}.
                  </p>
                  <fieldset className="space-y-2">
                    <legend className="font-semibold">How should it be restored?</legend>
                    <label className="tap flex cursor-pointer items-start gap-3">
                      <input
                        type="radio"
                        name="restore-mode"
                        className="mt-1 h-5 w-5 accent-[var(--color-accent)]"
                        checked={pending.mode === 'merge'}
                        onChange={() => setPending({ ...pending, mode: 'merge' })}
                      />
                      <span>
                        <strong>Add to what&apos;s here.</strong> Keeps your current data; where the backup has the same entry
                        (or a check-in for the same day), the backup&apos;s copy is used.
                      </span>
                    </label>
                    <label className="tap flex cursor-pointer items-start gap-3">
                      <input
                        type="radio"
                        name="restore-mode"
                        className="mt-1 h-5 w-5 accent-[var(--color-accent)]"
                        checked={pending.mode === 'replace'}
                        onChange={() => setPending({ ...pending, mode: 'replace' })}
                      />
                      <span>
                        <strong>Replace everything here.</strong> Deletes the {total} record{total === 1 ? '' : 's'} currently in
                        this browser first, so it matches the backup exactly.
                      </span>
                    </label>
                  </fieldset>
                </div>
              </>
            )}
            <div className="flex flex-wrap gap-2">
              <button type="button" disabled={busy} onClick={confirm} className={pending.kind === 'restore' && pending.mode === 'merge' ? btnPrimary : btnDangerSolid}>
                {pending.kind === 'restore' ? 'Restore backup' : 'Yes, delete permanently'}
              </button>
              <button type="button" disabled={busy} onClick={() => setPending(null)} className={btnSecondary}>
                Cancel
              </button>
            </div>
          </div>
        )}

        <Card id="where-heading" title="Where your data lives">
          <ul className="list-disc space-y-1.5 pl-6">
            <li>Everything you enter in the tracker and the tools is saved only in this browser on this device. No account is needed and nothing is uploaded.</li>
            <li>It is not synced. Another browser, another device, or a private/incognito window will not see it.</li>
            <li>
              Clearing your browsing data or site data, uninstalling the browser, or private browsing can remove it. Some
              browsers may also clear site data on their own if the device runs very low on space.
            </li>
            <li>Nothing is ever deleted automatically by this site. Data stays until you delete it here or in the tools.</li>
            <li>Download a backup now and then and keep it somewhere private, so you can restore it if the browser loses it.</li>
          </ul>
        </Card>

        <Card id="space-heading" title="Storage on this device">
          {estimate === null ? (
            <p className="text-[var(--color-ink-muted)]">Checking…</p>
          ) : !estimate.supported ? (
            <p>This browser doesn&apos;t report how much space is available. Saving still works.</p>
          ) : (
            <div className="space-y-2">
              <p>
                This site is using <strong>{formatBytes(estimate.usage)}</strong> of about <strong>{formatBytes(estimate.quota)}</strong>{' '}
                the browser allows it.
              </p>
              {usagePct !== null && (
                <div
                  className="h-3 overflow-hidden rounded-full bg-[var(--color-accent-soft)]"
                  role="meter"
                  aria-label="Storage used"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(usagePct)}
                >
                  <div className="h-3 bg-[var(--color-accent)]" style={{ width: `${Math.max(1, usagePct)}%` }} />
                </div>
              )}
              {isStorageLow(estimate) && (
                <p className="rounded-lg bg-[var(--color-urgent-soft)] p-3 font-semibold text-[var(--color-urgent)]">
                  Storage is running low. New entries may fail to save. Download a backup, then delete older data below.
                </p>
              )}
            </div>
          )}
          {estimate && estimate.persisted !== null && (
            <div className="space-y-2 rounded-lg bg-[var(--color-paper)] p-3">
              <p>
                {estimate.persisted
                  ? 'This browser has agreed to keep this site’s data and not clear it to free up space.'
                  : 'This browser may clear this site’s data if the device runs low on space. You can ask it to keep the data. Some browsers decide automatically, and some say no to sites you haven’t used much yet.'}
              </p>
              {!estimate.persisted && (
                <button
                  type="button"
                  className={btnSecondary}
                  disabled={busy}
                  onClick={() =>
                    void act(async () =>
                      (await requestPersistence())
                        ? 'Done. The browser will keep this site’s data.'
                        : 'The browser didn’t agree this time. Your data is still saved; keep a backup to be safe.',
                    )
                  }
                >
                  Ask the browser to keep my data
                </button>
              )}
            </div>
          )}
        </Card>

        <Card id="backup-heading" title="Back up and restore">
          <p>
            A backup is one file containing everything from the tracker and the tools. Anyone who opens it can read it, so
            keep it somewhere private. To move your data to another device or browser, download a backup here and restore it
            there.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={busy}
              className={btnPrimary}
              onClick={() =>
                void act(async () => {
                  const { records } = await downloadBackup();
                  return `Backup downloaded with ${records} record${records === 1 ? '' : 's'}. Check your downloads folder.`;
                })
              }
            >
              Download backup
            </button>
            <label className={`${btnSecondary} cursor-pointer`}>
              Restore from a backup file
              <input ref={fileRef} type="file" accept="application/json,.json" className="sr-only" onChange={(e) => void onPickFile(e.target.files?.[0])} />
            </label>
          </div>
        </Card>

        <Card id="stored-heading" title="What’s stored">
          {summaries === null ? (
            <p className="text-[var(--color-ink-muted)]">Counting your records…</p>
          ) : withData.length === 0 ? (
            <p>Nothing is stored in this browser yet.</p>
          ) : (
            <ul className="divide-y divide-[var(--color-rule)]">
              {withData.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div>
                    <p className="font-semibold">{LABEL.get(s.id)}</p>
                    <p className="text-sm text-[var(--color-ink-muted)]">
                      {s.records} record{s.records === 1 ? '' : 's'}
                      {s.detail ? `, ${s.detail}` : ''}
                      {s.oldest ? ` · ${span(s)}` : ''}
                    </p>
                  </div>
                  <button type="button" className={btnDanger} disabled={busy} onClick={() => setPending({ kind: 'category', id: s.id, summary: s })}>
                    Delete all<span className="sr-only"> of {LABEL.get(s.id)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {datedWithData.length > 0 && (
          <Card id="trim-heading" title="Delete older data">
            <fieldset className="space-y-1">
              <legend className="font-semibold">Which data?</legend>
              {datedWithData.map((id) => (
                <label key={id} className="tap flex cursor-pointer items-center gap-3">
                  <input type="checkbox" className="h-5 w-5 accent-[var(--color-accent)]" checked={selected.includes(id)} onChange={() => toggleChosen(id)} />
                  <span>{LABEL.get(id)}</span>
                </label>
              ))}
            </fieldset>

            <div className="space-y-2">
              <p className="font-semibold">Quick options</p>
              <p className="text-sm text-[var(--color-ink-muted)]">
                Counts the days you actually logged something. If you logged 30 days, deleting the oldest 10 keeps the
                newest 20. You&apos;ll see exactly what will go before anything is deleted.
              </p>
              <div className="flex flex-wrap gap-2">
                <button type="button" disabled={busy} className={btnSecondary} onClick={() => void proposeOldest(10)}>
                  Delete oldest 10 days
                </button>
                <button type="button" disabled={busy} className={btnSecondary} onClick={() => void proposeOldest(30)}>
                  Delete oldest 30 days
                </button>
              </div>
            </div>

            <form
              className="space-y-2"
              onSubmit={(e) => {
                e.preventDefault();
                void proposeRange();
              }}
            >
              <p className="font-semibold">Custom date range</p>
              <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                <div>
                  <label htmlFor="range-from" className="block text-sm font-semibold">
                    From
                  </label>
                  <input id="range-from" type="date" required value={from} max={to || today || undefined} onChange={(e) => setFrom(e.target.value)} className={`mt-1 ${field}`} />
                </div>
                <div>
                  <label htmlFor="range-to" className="block text-sm font-semibold">
                    To
                  </label>
                  <input id="range-to" type="date" required value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} className={`mt-1 ${field}`} />
                </div>
                <button type="submit" disabled={busy || !from || !to} className={btnSecondary}>
                  Review what will be deleted
                </button>
              </div>
            </form>
          </Card>
        )}

        {withData.length > 0 && (
          <Card id="clear-heading" title="Clear all data">
            <p>Deletes every record, every tool&apos;s current answers, and your preferences from this browser.</p>
            <button type="button" disabled={busy} className={btnDangerSolid} onClick={() => setPending({ kind: 'all', total })}>
              Clear all data…
            </button>
          </Card>
        )}

        <p className="text-sm text-[var(--color-ink-muted)]">
          <Link href="/app/privacy/" className="font-semibold text-[var(--color-link)] underline">
            Privacy center
          </Link>{' '}
          ·{' '}
          <Link href="/app/settings/" className="font-semibold text-[var(--color-link)] underline">
            Settings
          </Link>
        </p>
      </div>
    </div>
  );
}
