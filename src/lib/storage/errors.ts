/**
 * Turns IndexedDB/Dexie failures into a sentence she can act on. Browsers
 * report a full disk as QuotaExceededError (sometimes wrapped by Dexie as
 * `inner`), and blocked storage (some private-browsing modes, "block all site
 * data") as InvalidStateError, SecurityError, UnknownError or a missing API.
 */
export type StorageProblem = 'quota' | 'blocked' | 'unknown';

function errorName(err: unknown): string {
  if (!err || typeof err !== 'object') return '';
  const e = err as { name?: string; inner?: { name?: string } };
  return e.inner?.name || e.name || '';
}

export function classifyStorageError(err: unknown): StorageProblem {
  const name = errorName(err);
  if (name === 'QuotaExceededError' || /quota/i.test(String((err as Error)?.message ?? ''))) return 'quota';
  if (['InvalidStateError', 'SecurityError', 'UnknownError', 'MissingAPIError', 'OpenFailedError', 'DatabaseClosedError'].includes(name)) {
    return 'blocked';
  }
  return 'unknown';
}

export function describeStorageError(err: unknown): string {
  switch (classifyStorageError(err)) {
    case 'quota':
      return 'Your browser is out of storage space for this site, so this was not saved. Free up space in Manage storage (or delete older entries), then try again.';
    case 'blocked':
      return 'This browser is not letting the site save data (this happens in some private-browsing modes or when site data is blocked). Your answers work on this page but will not be kept.';
    default:
      return 'Something went wrong saving to this device, so this was not saved. Please try again.';
  }
}
