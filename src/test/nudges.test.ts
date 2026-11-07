import { describe, expect, it } from 'vitest';
import {
  appointmentCountdown,
  buildWeeklyReminderIcs,
  isBackupDue,
  isLogReminderDue,
  type LogReminderSettings,
} from '@/lib/tracker/nudges';

const at = (iso: string, time: string) => new Date(`${iso}T${time}:00`);
// 2026-11-04 is a Wednesday (getDay() === 3).
const WED = '2026-11-04';

describe('log reminders', () => {
  const daily: LogReminderSettings = { frequency: 'daily', weekday: 0, time: '20:00' };
  const weekly: LogReminderSettings = { frequency: 'weekly', weekday: 3, time: '09:00' };

  it('never shows when off', () => {
    expect(isLogReminderDue({ ...daily, frequency: 'off' }, null, WED, at(WED, '23:00'))).toBe(false);
  });

  it('daily: due after the chosen time until today is logged', () => {
    expect(isLogReminderDue(daily, '2026-11-03', WED, at(WED, '19:59'))).toBe(false);
    expect(isLogReminderDue(daily, '2026-11-03', WED, at(WED, '20:00'))).toBe(true);
    expect(isLogReminderDue(daily, WED, WED, at(WED, '21:00'))).toBe(false);
  });

  it('weekly: due from the reminder slot until she logs again', () => {
    // Before Wednesday 09:00 the last slot was the previous Wednesday; she logged after it.
    expect(isLogReminderDue(weekly, '2026-10-30', WED, at(WED, '08:00'))).toBe(false);
    // From Wednesday 09:00, a log from before today no longer counts.
    expect(isLogReminderDue(weekly, '2026-10-30', WED, at(WED, '09:00'))).toBe(true);
    expect(isLogReminderDue(weekly, WED, WED, at(WED, '10:00'))).toBe(false);
    // Missed slot stays due on later days.
    expect(isLogReminderDue(weekly, '2026-10-30', '2026-11-06', at('2026-11-06', '08:00'))).toBe(true);
  });
});

describe('appointment mode', () => {
  it('counts down only within 3 days', () => {
    expect(appointmentCountdown('2026-11-07', WED)).toBe(3);
    expect(appointmentCountdown(WED, WED)).toBe(0);
    expect(appointmentCountdown('2026-11-08', WED)).toBeNull();
    expect(appointmentCountdown('2026-11-01', WED)).toBeNull();
    expect(appointmentCountdown(null, WED)).toBeNull();
  });
});

describe('backup reminder', () => {
  const now = at(WED, '12:00').getTime();
  it('needs entries', () => {
    expect(isBackupDue(null, null, WED, now)).toBe(false);
  });
  it('uses the first entry when never backed up', () => {
    expect(isBackupDue(null, '2026-10-10', WED, now)).toBe(false);
    expect(isBackupDue(null, '2026-10-05', WED, now)).toBe(true);
  });
  it('uses the last backup when there is one', () => {
    expect(isBackupDue(now - 29 * 86_400_000, '2026-01-01', WED, now)).toBe(false);
    expect(isBackupDue(now - 30 * 86_400_000, '2026-01-01', WED, now)).toBe(true);
  });
});

describe('weekly calendar file', () => {
  const ics = buildWeeklyReminderIcs(5, '08:30', 'https://example.test', at(WED, '12:00'));
  it('starts on the next chosen weekday and repeats weekly', () => {
    expect(ics).toContain('DTSTART:20261106T083000');
    expect(ics).toContain('RRULE:FREQ=WEEKLY;BYDAY=FR');
    expect(ics).toContain('URL:https://example.test/app/check-in/');
    expect(ics.split('\r\n')[0]).toBe('BEGIN:VCALENDAR');
  });
  it('holds no health data', () => {
    expect(ics).not.toMatch(/symptom|hot flash|feeling|severity/i);
  });
});
