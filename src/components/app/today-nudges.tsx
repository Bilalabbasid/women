'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { LocalDataService } from '@/lib/db/service';
import { APP_ROUTES } from '@/lib/routes';
import {
  APPOINTMENT_KEY,
  DEFAULT_LOG_REMINDER,
  LAST_BACKUP_KEY,
  LOG_REMINDER_KEY,
  appointmentCountdown,
  isBackupDue,
  isLogReminderDue,
  type LogReminderSettings,
} from '@/lib/tracker/nudges';

interface Props {
  todayStr: string;
  /** Most recent logged day (may be today), or null if nothing is logged. */
  lastLoggedDate: string | null;
  /** Earliest logged day, or null. */
  firstEntryDate: string | null;
}

interface Nudge {
  id: string;
  title: string;
  body: string;
  href: string;
  action: string;
}

function formatDay(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

/**
 * The tracker's own reminders, shown on Today when she opens the app: no
 * notification server is involved, and none of these settings leave the device.
 */
export function TodayNudges({ todayStr, lastLoggedDate, firstEntryDate }: Props) {
  const [nudges, setNudges] = useState<Nudge[]>([]);

  useEffect(() => {
    let alive = true;
    async function load() {
      const [reminder, appointment, lastBackup] = await Promise.all([
        LocalDataService.getSetting<LogReminderSettings>(LOG_REMINDER_KEY, DEFAULT_LOG_REMINDER),
        LocalDataService.getSetting<string | null>(APPOINTMENT_KEY, null),
        LocalDataService.getSetting<number | null>(LAST_BACKUP_KEY, null),
      ]);
      if (!alive) return;
      const list: Nudge[] = [];

      const countdown = appointmentCountdown(appointment, todayStr);
      if (countdown !== null && appointment) {
        list.push({
          id: 'appointment',
          title:
            countdown === 0
              ? 'Your appointment is today'
              : `Your appointment is in ${countdown} ${countdown === 1 ? 'day' : 'days'}`,
          body: `${formatDay(appointment)}. Print or save your one-page report, and pick the questions you want to ask.`,
          href: APP_ROUTES.doctorReport,
          action: 'Prepare my report',
        });
      }

      if (isLogReminderDue({ ...DEFAULT_LOG_REMINDER, ...reminder }, lastLoggedDate, todayStr, new Date())) {
        list.push({
          id: 'log',
          title: reminder.frequency === 'weekly' ? 'Time for your weekly check-in' : 'Time for today’s check-in',
          body: 'A minute now makes your report more useful later.',
          href: APP_ROUTES.checkIn,
          action: 'Log now',
        });
      }

      if (isBackupDue(lastBackup, firstEntryDate, todayStr)) {
        list.push({
          id: 'backup',
          title: lastBackup ? 'It’s been 30 days since your last backup' : 'Back up your entries',
          body: 'Your entries live only in this browser. If it’s cleared or the phone is lost, a backup file is the only copy.',
          href: `${APP_ROUTES.storage}#backup-heading`,
          action: 'Download a backup',
        });
      }

      setNudges(list);
    }
    if (todayStr) void load().catch(() => {});
    return () => {
      alive = false;
    };
  }, [todayStr, lastLoggedDate, firstEntryDate]);

  if (nudges.length === 0) return null;

  return (
    <div className="space-y-3" aria-label="Reminders">
      {nudges.map((n) => (
        <section
          key={n.id}
          aria-labelledby={`nudge-${n.id}`}
          className="rounded-2xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)] p-4"
        >
          <h2 id={`nudge-${n.id}`} className="text-base font-semibold text-[var(--color-ink)]">
            {n.title}
          </h2>
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">{n.body}</p>
          <Link href={n.href} className="tap mt-2 inline-flex font-semibold text-[var(--color-link)] underline">
            {n.action}
          </Link>
        </section>
      ))}
    </div>
  );
}
