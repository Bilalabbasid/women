/**
 * Pages she saved for later. Kept in this browser only (local storage) and, when
 * the browser supports it, copied into a cache so they can be read offline.
 * The list holds only page addresses and titles, never anything she logged.
 */
export interface SavedPage {
  url: string;
  title?: string;
  savedAt?: string;
}

export const BOOKMARKS_KEY = 'menowell_bookmarks';
/** Must match SAVED_CACHE in src/app/sw.js/route.ts. */
export const SAVED_CACHE = 'saved-pages';
const BOOKMARKS_EVENT = 'menowell-bookmarks-change';

export function readSavedPages(): SavedPage[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || '[]');
    return Array.isArray(saved) ? saved.filter((b) => b && typeof b.url === 'string') : [];
  } catch {
    return [];
  }
}

export function subscribeSavedPages(onChange: () => void): () => void {
  window.addEventListener('storage', onChange);
  window.addEventListener(BOOKMARKS_EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(BOOKMARKS_EVENT, onChange);
  };
}

function write(list: SavedPage[]): void {
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(BOOKMARKS_EVENT));
}

function cacheForOffline(url: string, keep: boolean): void {
  if (typeof caches === 'undefined') return;
  void caches
    .open(SAVED_CACHE)
    .then(async (c) => {
      if (keep) await c.add(url);
      else await c.delete(url);
    })
    .catch(() => {});
}

export function savePage(url: string, title: string): void {
  const list = readSavedPages().filter((b) => b.url !== url);
  write([...list, { url, title, savedAt: new Date().toISOString() }]);
  cacheForOffline(url, true);
}

export function removeSavedPage(url: string): void {
  write(readSavedPages().filter((b) => b.url !== url));
  cacheForOffline(url, false);
}
