// On-device nudges shown inside the tracker: log reminders, appointment mode
// and the backup reminder.
//
// There is no push server (DECISIONS.md), so these are only ever shown when she
// opens the app herself. Nothing here leaves the device: the settings live in
// IndexedDB next to her entries, and the calendar file is built in the browser.

import { daysBetween } from '../storage/periods';
import { addIsoDays } from '../utils/local-date';

export type LogReminderFrequency = 'off' | 'daily' | 'weekly';

export interface LogReminderSettings {
  frequency: LogReminderFrequency;
  /** 0 = Sunday … 6 = Saturday. Used for weekly reminders. */
  weekday: number;
  /** Local time, "HH:MM". */
  time: string;
}

export const LOG_REMINDER_KEY = 'log_reminder';
export const APPOINTMENT_KEY = 'next_appointment_date';
export const LAST_BACKUP_KEY = 'last_backup_at';

export const DEFAULT_LOG_REMINDER: LogReminderSettings = { frequency: 'off', weekday: 0, time: '20:00' };

/** Days before an appointment when the tracker starts helping her prepare. */
export const APPOINTMENT_LEAD_DAYS = 3;
/** Days after the last backup (or first entry) before suggesting a new one. */
export const BACKUP_REMINDER_DAYS = 30;

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function weekdayName(day: number): string {
  return WEEKDAYS[((day % 7) + 7) % 7];
}

function minutesOf(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
}

/**
 * Whether the log reminder card should show right now.
 * - daily: from the chosen time onwards, if today isn't logged yet.
 * - weekly: from the chosen weekday and time onwards, if nothing was logged in
 *   the last 7 days.
 */
export function isLogReminderDue(
  settings: LogReminderSettings,
  lastLoggedDate: string | null,
  todayStr: string,
  now: Date,
): boolean {
  if (settings.frequency === 'off') return false;
  const pastTime = now.getHours() * 60 + now.getMinutes() >= minutesOf(settings.time);

  if (settings.frequency === 'daily') {
    return lastLoggedDate !== todayStr && pastTime;
  }

  // The most recent reminder slot at or before now. Due until she logs on or after that day.
  let daysBack = (now.getDay() - settings.weekday + 7) % 7;
  if (daysBack === 0 && !pastTime) daysBack = 7;
  const slotDate = addIsoDays(todayStr, -daysBack);
  return lastLoggedDate === null || lastLoggedDate < slotDate;
}

/**
 * Days until her saved appointment when it's within the lead window (0 = today),
 * otherwise null. Past appointments return null.
 */
export function appointmentCountdown(appointmentDate: string | null, todayStr: string): number | null {
  if (!appointmentDate || appointmentDate < todayStr) return null;
  const days = daysBetween(todayStr, appointmentDate);
  return days <= APPOINTMENT_LEAD_DAYS ? days : null;
}

/**
 * Whether to suggest a backup: she has entries, and her last backup (or, if
 * she's never backed up, her first entry) was 30 or more days ago.
 */
export function isBackupDue(lastBackupAt: number | null, firstEntryDate: string | null, todayStr: string, now = Date.now()): boolean {
  if (!firstEntryDate) return false;
  if (lastBackupAt) return now - lastBackupAt >= BACKUP_REMINDER_DAYS * 24 * 60 * 60 * 1000;
  return daysBetween(firstEntryDate, todayStr) >= BACKUP_REMINDER_DAYS;
}

const ICS_DAYS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

/**
 * A weekly calendar reminder (.ics) for her own calendar app. It holds no
 * health data: just a title, a link to the check-in screen and the time.
 */
export function buildWeeklyReminderIcs(weekday: number, time: string, siteUrl: string, from: Date = new Date()): string {
  const [h, m] = time.split(':').map((n) => n.padStart(2, '0'));
  const start = new Date(from);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + ((weekday - start.getDay() + 7) % 7));
  const date = `${start.getFullYear()}${String(start.getMonth() + 1).padStart(2, '0')}${String(start.getDate()).padStart(2, '0')}`;
  const stamp = from.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const url = new URL('/app/check-in/', siteUrl).toString();
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MenoVerdict//Weekly check-in//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:weekly-check-in-${date}@menoverdict`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${date}T${h}${m}00`,
    'DURATION:PT10M',
    `RRULE:FREQ=WEEKLY;BYDAY=${ICS_DAYS[((weekday % 7) + 7) % 7]}`,
    'SUMMARY:Weekly check-in',
    `DESCRIPTION:A few minutes to log your week. ${url}`,
    `URL:${url}`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'DESCRIPTION:Weekly check-in',
    'TRIGGER:PT0M',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ].join('\r\n');
}
