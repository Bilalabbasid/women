'use client';

import { useEffect } from 'react';
import { NotificationService } from '@/lib/notifications/treatment-reminders';

/**
 * Mounts once in the tracker layout. Checks every minute whether any active
 * treatment's reminder time has arrived today, and fires a real notification
 * (never more than once per treatment per day). Renders nothing. Only runs
 * while this app is open in a tab — there is no push server, so nothing fires
 * once the browser is fully closed (src/lib/notifications/treatment-reminders.ts).
 */
export function ReminderScheduler() {
  useEffect(() => {
    return NotificationService.startScheduler();
  }, []);
  return null;
}
