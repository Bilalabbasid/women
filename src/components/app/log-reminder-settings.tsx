'use client';

import React, { useEffect, useState } from 'react';
import { LocalDataService } from '@/lib/db/service';
import { btnSecondary, field } from '@/components/storage/styles';
import {
  APPOINTMENT_KEY,
  APPOINTMENT_LEAD_DAYS,
  DEFAULT_LOG_REMINDER,
  LOG_REMINDER_KEY,
  buildWeeklyReminderIcs,
  weekdayName,
  type LogReminderFrequency,
  type LogReminderSettings as Settings,
} from '@/lib/tracker/nudges';

const FREQUENCIES: Array<{ value: LogReminderFrequency; label: string }> = [
  { value: 'off', label: 'Off' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
];

function downloadText(text: string, fileName: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/**
 * Log reminders and appointment mode. Saved in this browser with her entries.
 * The reminder shows as a card on Today when she opens the app; for a reminder
 * while the app is closed, she can add a weekly event to her own calendar.
 */
export function LogReminderSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [appointment, setAppointment] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    void Promise.all([
      LocalDataService.getSetting<Settings>(LOG_REMINDER_KEY, DEFAULT_LOG_REMINDER),
      LocalDataService.getSetting<string | null>(APPOINTMENT_KEY, null),
    ]).then(([s, a]) => {
      setSettings({ ...DEFAULT_LOG_REMINDER, ...s });
      setAppointment(a ?? '');
    });
  }, []);

  if (!settings) return <p className="text-sm text-[var(--color-ink-muted)]">Loading…</p>;

  const save = async (next: Settings) => {
    setSettings(next);
    await LocalDataService.setSetting(LOG_REMINDER_KEY, next);
    setStatus('Saved on this device.');
  };

  const saveAppointment = async (value: string) => {
    setAppointment(value);
    await LocalDataService.setSetting(APPOINTMENT_KEY, value || null);
    setStatus(value ? 'Appointment saved on this device.' : 'Appointment cleared.');
  };

  return (
    <div className="space-y-5">
      <fieldset className="space-y-3">
        <legend className="font-semibold text-[var(--color-ink)]">Reminder to log</legend>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="How often">
          {FREQUENCIES.map((f) => (
            <label key={f.value} className={`${btnSecondary} cursor-pointer ${settings.frequency === f.value ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)]' : ''}`}>
              <input
                type="radio"
                name="log-frequency"
                value={f.value}
                checked={settings.frequency === f.value}
                onChange={() => void save({ ...settings, frequency: f.value })}
                className="sr-only"
              />
              {f.label}
            </label>
          ))}
        </div>

        {settings.frequency !== 'off' && (
          <div className="grid gap-3 sm:grid-cols-2">
            {settings.frequency === 'weekly' && (
              <label className="block text-sm">
                <span className="font-semibold">Day</span>
                <select
                  className={field}
                  value={settings.weekday}
                  onChange={(e) => void save({ ...settings, weekday: Number(e.target.value) })}
                >
                  {[0, 1, 2, 3, 4, 5, 6].map((d) => (
                    <option key={d} value={d}>
                      {weekdayName(d)}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="block text-sm">
              <span className="font-semibold">Time</span>
              <input
                type="time"
                className={field}
                value={settings.time}
                onChange={(e) => e.target.value && void save({ ...settings, time: e.target.value })}
              />
            </label>
          </div>
        )}

        <p className="text-sm text-[var(--color-ink-muted)]">
          The reminder shows on the Today screen when you open the app. Nothing is sent to you, because nothing about
          you is stored anywhere but this device.
        </p>

        <div>
          <button
            type="button"
            className={btnSecondary}
            onClick={() =>
              downloadText(
                buildWeeklyReminderIcs(settings.weekday, settings.time, window.location.origin),
                'menoverdict-weekly-check-in.ics',
                'text/calendar',
              )
            }
          >
            Add a weekly reminder to my calendar
          </button>
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
            Downloads a calendar file for {weekdayName(settings.weekday)}s at {settings.time}. Your calendar app does the
            reminding. The file holds only a title and a link.
          </p>
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="font-semibold text-[var(--color-ink)]">Next appointment</legend>
        <label className="block text-sm">
          <span>Date</span>
          <input type="date" className={field} value={appointment} onChange={(e) => void saveAppointment(e.target.value)} />
        </label>
        <p className="text-sm text-[var(--color-ink-muted)]">
          From {APPOINTMENT_LEAD_DAYS} days before, the Today screen reminds you to prepare your report and questions.
        </p>
      </fieldset>

      {status && (
        <p role="status" className="text-sm text-[var(--color-ink-muted)]">
          {status}
        </p>
      )}
    </div>
  );
}
