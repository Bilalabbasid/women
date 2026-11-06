/**
 * Asks the browser to keep this site's storage (her tracker in IndexedDB)
 * instead of clearing it when the device is short of space. Called after she
 * saves a check-in. Browsers decide silently or with their own prompt; if
 * they refuse, nothing changes and entries are still saved as before.
 * Nothing is sent anywhere.
 */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (typeof navigator === 'undefined' || !navigator.storage?.persist) return false;
    if (await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}
