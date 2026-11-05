/**
 * Collision-safe local record IDs.
 *
 * Timestamp-only IDs (`te_${Date.now()}`) collide when two records are written
 * in the same millisecond, and IndexedDB `put` then silently overwrites the
 * first record. crypto.randomUUID is available in every browser we support
 * (Chrome/Edge/Firefox 111+, Safari 16.4+) and in Node 19+ for tests.
 */
export function newId(prefix: string): string {
  return `${prefix}_${globalThis.crypto.randomUUID()}`;
}
