'use client';

import { useEffect, useState } from 'react';
import { LocalDataService } from '@/lib/db/service';
import { QuickPick } from '@/components/app/kit';
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

  if (!settings)
    return (
      <div className="grid gap-3" role="status" aria-busy="true" aria-label="Loading your reminder settings">
        <span className="skeleton h-12 w-full" />
        <span className="skeleton h-5 w-2/3" />
      </div>
    );

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
    <div className="grid gap-6">
      <fieldset className="grid min-w-0 gap-3 border-0 p-0">
        <legend className="label mb-1">Reminder to log</legend>
        <QuickPick
          label="How often"
          options={FREQUENCIES}
          value={settings.frequency}
          onChange={(v) => void save({ ...settings, frequency: v })}
        />

        {settings.frequency !== 'off' && (
          <div className="grid gap-3 sm:grid-cols-2">
            {settings.frequency === 'weekly' && (
              <div className="field">
                <label className="label" htmlFor="reminder-day">
                  Day
                </label>
                <select
                  id="reminder-day"
                  className="select"
                  value={settings.weekday}
                  onChange={(e) => void save({ ...settings, weekday: Number(e.target.value) })}
                >
                  {[0, 1, 2, 3, 4, 5, 6].map((d) => (
                    <option key={d} value={d}>
                      {weekdayName(d)}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="field">
              <label className="label" htmlFor="reminder-time">
                Time
              </label>
              <input
                id="reminder-time"
                type="time"
                className="input"
                value={settings.time}
                onChange={(e) => e.target.value && void save({ ...settings, time: e.target.value })}
              />
            </div>
          </div>
        )}

        <p className="hint">
          The reminder shows on the Today screen when you open the app. Nothing is sent to you, because nothing about
          you is stored anywhere but this device.
        </p>

        <div className="grid gap-1">
          <button
            type="button"
            className="btn btn-secondary justify-self-start"
            onClick={() =>
              downloadText(
                buildWeeklyReminderIcs(settings.weekday, settings.time, window.location.origin),
                'menoverdict-weekly-check-in.ics',
                'text/calendar',
              )
            }
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
              <path d="M3.5 10h17M8 3v4M16 3v4M12 13v5M9.5 15.5h5" />
            </svg>
            Add a weekly reminder to my calendar
          </button>
          <p className="hint">
            Downloads a calendar file for {weekdayName(settings.weekday)}s at {settings.time}. Your calendar app does the
            reminding. The file holds only a title and a link.
          </p>
        </div>
      </fieldset>

      <fieldset className="grid min-w-0 gap-2 border-0 border-t border-[var(--rule)] p-0 pt-5">
        <legend className="visually-hidden">Next appointment</legend>
        <div className="field">
          <label className="label" htmlFor="appointment-date">
            Next appointment
          </label>
          <input
            id="appointment-date"
            type="date"
            className="input sm:max-w-xs"
            value={appointment}
            onChange={(e) => void saveAppointment(e.target.value)}
            aria-describedby="appointment-hint"
          />
          <span id="appointment-hint" className="hint">
            From {APPOINTMENT_LEAD_DAYS} days before, the Today screen reminds you to prepare your report and questions.
          </span>
        </div>
      </fieldset>

      <p role="status" className={status ? 'flex items-center gap-2 font-bold text-[var(--g-strong-ink)]' : 'visually-hidden'}>
        {status && (
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12.5l4.5 4.5L19 7" />
          </svg>
        )}
        {status ?? ''}
      </p>
    </div>
  );
}
