'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { ToolKey } from '@/lib/db/schema';
import { ToolRecords, localToday } from '@/lib/storage/tool-records';
import { migrateLegacyToolStorage } from '@/lib/storage/legacy-migration';
import { describeStorageError } from '@/lib/storage/errors';
import { markToolUsed } from '@/lib/pwa/install-gate';

const SAVE_DELAY_MS = 400;

const noSubscription = () => () => {};

/** Today's local date (YYYY-MM-DD) on the client, '' during server render, so hydration always matches. */
export function useLocalToday(): string {
  return useSyncExternalStore(noSubscription, localToday, () => '');
}

export interface ToolStateStatus {
  /** Saved answers have been read from the device (or there were none). */
  loaded: boolean;
  saving: boolean;
  savedAt: number | null;
  error: string | null;
}

/**
 * A tool's current answers, autosaved to IndexedDB on this device.
 *
 * Saved answers are read after mount, so the first render always matches the
 * server HTML. Edits made before that read finishes win over the stored copy.
 * Writes are debounced and flushed when the page is hidden or the tool
 * unmounts, so navigating away or closing the tab doesn't drop the last change.
 */
export function useToolState<T>(tool: ToolKey, defaults: T, normalize: (raw: unknown) => T) {
  const [state, setState] = useState<T>(defaults);
  const [status, setStatus] = useState<ToolStateStatus>({ loaded: false, saving: false, savedAt: null, error: null });

  const latest = useRef<T>(defaults);
  const dirty = useRef(false);
  const loaded = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const write = useCallback(async () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    if (!dirty.current || !loaded.current) return;
    dirty.current = false;
    setStatus((s) => ({ ...s, saving: true }));
    try {
      await ToolRecords.saveDraft(tool, latest.current);
      markToolUsed();
      setStatus((s) => ({ ...s, saving: false, savedAt: Date.now(), error: null }));
    } catch (err) {
      dirty.current = true; // keep it pending so the next change retries
      setStatus((s) => ({ ...s, saving: false, error: describeStorageError(err) }));
    }
  }, [tool]);

  const schedule = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void write(), SAVE_DELAY_MS);
  }, [write]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        await migrateLegacyToolStorage();
        const draft = await ToolRecords.getDraft(tool);
        if (alive && draft && !dirty.current) {
          const value = normalize(draft.data);
          latest.current = value;
          setState(value);
          setStatus((s) => ({ ...s, savedAt: draft.updatedAt }));
        }
      } catch (err) {
        if (alive) setStatus((s) => ({ ...s, error: describeStorageError(err) }));
      } finally {
        if (alive) {
          loaded.current = true;
          setStatus((s) => ({ ...s, loaded: true }));
          if (dirty.current) schedule();
        }
      }
    })();
    return () => {
      alive = false;
    };
    // `normalize` and `defaults` must be module-level constants in each tool.
  }, [tool, schedule, normalize]);

  useEffect(() => {
    const flush = () => void write();
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', onVisibility);
      flush();
    };
  }, [write]);

  /** Update the current answers (autosaved). Accepts a value or an updater. */
  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      const value = typeof next === 'function' ? (next as (prev: T) => T)(latest.current) : next;
      latest.current = value;
      setState(value);
      dirty.current = true;
      if (loaded.current) schedule();
    },
    [schedule],
  );

  /** Clear the current answers on screen and on the device (saved history is untouched). */
  const reset = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    dirty.current = false;
    latest.current = defaults;
    setState(defaults);
    try {
      await ToolRecords.clearDraft(tool);
      setStatus((s) => ({ ...s, savedAt: null, error: null }));
    } catch (err) {
      setStatus((s) => ({ ...s, error: describeStorageError(err) }));
    }
  }, [tool, defaults]);

  return { state, update, reset, status };
}

/** "Saved on this device" line shared by every tool. */
export function savedLabel(status: ToolStateStatus): string {
  if (status.error) return status.error;
  if (!status.loaded) return 'Loading your saved answers…';
  if (status.saving) return 'Saving on this device…';
  if (status.savedAt) return 'Your answers are saved in this browser on this device.';
  return 'Your answers will be saved in this browser on this device as you go.';
}
