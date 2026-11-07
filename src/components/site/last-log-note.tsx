'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { APP_ROUTES } from '@/lib/routes';
import { DB_NAME } from '@/lib/db/name';
import { localDateString } from '@/lib/utils/local-date';
import { daysBetween } from '@/lib/storage/periods';

/**
 * Reads the date of her most recent check-in straight from IndexedDB, without
 * loading the tracker's database library, so the homepage stays light. Never
 * creates the database: a visitor who has never used the tracker sees nothing,
 * and nothing is stored for her.
 */
async function latestCheckinDate(): Promise<string | null> {
  if (typeof indexedDB === 'undefined') return null;
  if (typeof indexedDB.databases === 'function') {
    const dbs = await indexedDB.databases();
    if (!dbs.some((d) => d.name === DB_NAME)) return null;
  }
  return new Promise((resolve) => {
    const req = indexedDB.open(DB_NAME);
    // The database didn't exist after all: cancel, so opening it doesn't create it.
    req.onupgradeneeded = () => req.transaction?.abort();
    req.onerror = () => resolve(null);
    req.onsuccess = () => {
      const db = req.result;
      try {
        if (!db.objectStoreNames.contains('checkins')) {
          db.close();
          return resolve(null);
        }
        const cursor = db.transaction('checkins', 'readonly').objectStore('checkins').index('date').openCursor(null, 'prev');
        cursor.onsuccess = () => {
          const value = cursor.result?.value as { date?: unknown } | undefined;
          db.close();
          resolve(typeof value?.date === 'string' ? value.date : null);
        };
        cursor.onerror = () => {
          db.close();
          resolve(null);
        };
      } catch {
        db.close();
        resolve(null);
      }
    };
  });
}

/** "Your last log was 4 days ago", shown on the homepage only to people who use the tracker. */
export function LastLogNote() {
  const [days, setDays] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    latestCheckinDate()
      .then((date) => {
        if (alive && date) setDays(Math.max(0, daysBetween(date, localDateString())));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  if (days === null) return null;

  const text =
    days === 0 ? 'You logged today.' : `Your last log was ${days === 1 ? 'yesterday' : `${days} days ago`}.`;

  return (
    <p role="status" className="inline-flex flex-wrap items-center gap-x-2 rounded-xl bg-white/10 px-4 py-2 text-sm text-white">
      <span>{text}</span>
      <Link href={days === 0 ? APP_ROUTES.today : days > 1 ? APP_ROUTES.catchUp : APP_ROUTES.checkIn} className="font-semibold underline underline-offset-4 focus-visible:outline-white">
        {days === 0 ? 'Open your tracker' : days > 1 ? 'Catch up' : 'Log today'}
      </Link>
    </p>
  );
}
