import type { ToolKey } from '../db/schema';
import { ToolRecords, isIsoDate } from './tool-records';
import { Periods } from './periods';

/**
 * Before IndexedDB, four public tools kept a single answer set each in
 * localStorage. Copy each into the tool's IndexedDB draft once, then remove
 * the old key. An existing IndexedDB draft is never overwritten, and a key is
 * only removed after its data has been written, so a failed copy loses nothing.
 */
const LEGACY_KEYS: ReadonlyArray<{ key: string; tool: ToolKey }> = [
  { key: 'menoverdict_stage_guide_v1', tool: 'stage-guide' },
  { key: 'menoverdict_12_month_counter_v1', tool: '12-month-counter' },
  { key: 'menoverdict_evidence_checker_v1', tool: 'does-it-work-checker' },
  { key: 'menoverdict_treatment_questions_v1', tool: 'treatment-questions' },
];

let running: Promise<void> | null = null;

/** Cheap (a few localStorage reads) and idempotent; concurrent callers share one in-flight run. */
export function migrateLegacyToolStorage(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (!running) {
    running = run()
      // On failure the old keys stay in place and the next call tries again.
      .catch(() => undefined)
      .finally(() => {
        running = null;
      });
  }
  return running;
}

async function run(): Promise<void> {
  for (const { key, tool } of LEGACY_KEYS) {
    let raw: string | null;
    try {
      raw = window.localStorage.getItem(key);
    } catch {
      return;
    }
    if (!raw) continue;

    let parsed: unknown = null;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = null;
    }

    if (parsed && typeof parsed === 'object') {
      if (!(await ToolRecords.getDraft(tool))) await ToolRecords.saveDraft(tool, parsed);
      const last = (parsed as { lastPeriodDate?: unknown }).lastPeriodDate;
      if (tool === '12-month-counter' && isIsoDate(last)) await Periods.add(last);
    }
    window.localStorage.removeItem(key);
  }
}
