// Treatment Reminder & PWA Notification Service
// Provides privacy-preserving notifications, iOS PWA detection, and due-treatment tracking.

import { LocalTreatment, LocalTreatmentEvent } from '../db/schema';
import { db } from '../db/db';
import { LocalDataService } from '../db/service';
import { localDateString } from '../utils/local-date';

const FIRED_TODAY_KEY = 'treatment_reminders_fired';

interface FiredTodayRecord {
  date: string;
  treatmentIds: string[];
}

export type NotificationPermissionState = 'granted' | 'denied' | 'not_requested' | 'unsupported';
export type NotificationPrivacyMode = 'discrete' | 'detailed';

export interface TreatmentReminderSettings {
  enabled: boolean;
  privacyMode: NotificationPrivacyMode;
  defaultTime: string; // HH:MM e.g. "08:00"
}

export const DEFAULT_REMINDER_SETTINGS: TreatmentReminderSettings = {
  enabled: false,
  privacyMode: 'discrete', // Privacy by default: never leak sensitive medication names on lock screen
  defaultTime: '08:00',
};

export const NotificationService = {
  getPermissionState(): NotificationPermissionState {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }
    if (Notification.permission === 'denied') {
      return 'denied';
    }
    return 'not_requested';
  },

  async requestPermission(): Promise<NotificationPermissionState> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') return 'granted';
      if (permission === 'denied') return 'denied';
      return 'not_requested';
    } catch {
      return 'unsupported';
    }
  },

  isIOS(): boolean {
    if (typeof window === 'undefined') return false;
    const ua = window.navigator.userAgent;
    return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  },

  isStandalone(): boolean {
    if (typeof window === 'undefined') return false;
    const isStandaloneDisplay =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(display-mode: standalone)').matches
        : false;
    const isNavStandalone =
      typeof navigator !== 'undefined' &&
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    return isStandaloneDisplay || isNavStandalone;
  },

  getIOSGuidance(): { isIOS: boolean; isStandalone: boolean; requiresInstallForPush: boolean; message: string } {
    const ios = this.isIOS();
    const standalone = this.isStandalone();

    if (!ios) {
      return {
        isIOS: false,
        isStandalone: standalone,
        requiresInstallForPush: false,
        message: 'Web notifications are supported in this browser.',
      };
    }

    if (ios && !standalone) {
      return {
        isIOS: true,
        isStandalone: false,
        requiresInstallForPush: true,
        message:
          'On iPhone and iPad, Apple requires adding MenoVerdict to your Home Screen (Share -> Add to Home Screen) to receive lock-screen push notifications. In-app reminders will always display here.',
      };
    }

    return {
      isIOS: true,
      isStandalone: true,
      requiresInstallForPush: false,
      message: 'Running in standalone Home Screen mode on iOS. Notifications are supported.',
    };
  },

  async getSettings(): Promise<TreatmentReminderSettings> {
    try {
      const stored = await db.settings.get('treatment_reminders');
      if (stored && stored.value && typeof stored.value === 'object') {
        return {
          ...DEFAULT_REMINDER_SETTINGS,
          ...(stored.value as Partial<TreatmentReminderSettings>),
        };
      }
    } catch {
      // Fallback
    }
    return DEFAULT_REMINDER_SETTINGS;
  },

  async saveSettings(settings: Partial<TreatmentReminderSettings>): Promise<TreatmentReminderSettings> {
    const current = await this.getSettings();
    const updated: TreatmentReminderSettings = {
      ...current,
      ...settings,
    };
    await db.settings.put({
      key: 'treatment_reminders',
      value: updated,
      updatedAt: Date.now(),
    });
    return updated;
  },

  buildNotificationPayload(
    treatmentName: string,
    dosage: string | undefined,
    privacyMode: NotificationPrivacyMode
  ): { title: string; body: string; icon: string; tag: string } {
    if (privacyMode === 'discrete') {
      return {
        title: 'MenoVerdict Reminder',
        body: 'Scheduled routine reminder. Tap to view your personal dashboard.',
        icon: '/icons/icon-192.png',
        tag: 'menoverdict-treatment-discrete',
      };
    }

    // Detailed mode: user has explicitly chosen to display medicine details
    const dosePart = dosage ? ` (${dosage})` : '';
    return {
      title: 'Treatment Reminder',
      body: `${treatmentName}${dosePart} is scheduled for today.`,
      icon: '/icons/icon-192.png',
      tag: `menowell-treatment-${treatmentName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
    };
  },

  // The test uses neutral sample text: it must never show a medicine or dose she didn't enter.
  async sendTestNotification(
    treatmentName = 'Test reminder',
    dosage: string | undefined = undefined
  ): Promise<{ success: boolean; message: string }> {
    const state = this.getPermissionState();
    if (state !== 'granted') {
      return { success: false, message: `Notification permission is ${state}. Please grant permission first.` };
    }

    const settings = await this.getSettings();
    const payload = this.buildNotificationPayload(treatmentName, dosage, settings.privacyMode);

    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        if (registration && registration.showNotification) {
          await registration.showNotification(payload.title, {
            body: payload.body,
            icon: payload.icon,
            tag: payload.tag,
            data: { url: '/app/treatments/' },
          });
          return { success: true, message: `Notification sent using ${settings.privacyMode} mode.` };
        }
      }

      // Fallback to desktop Notification constructor
      new Notification(payload.title, {
        body: payload.body,
        icon: payload.icon,
        tag: payload.tag,
      });

      return { success: true, message: `Notification displayed (${settings.privacyMode} privacy mode).` };
    } catch (err) {
      return { success: false, message: err instanceof Error ? err.message : 'Failed to display notification.' };
    }
  },

  /** Shows a real notification via the service worker, falling back to the Notification constructor. */
  async showPayload(payload: { title: string; body: string; icon: string; tag: string }, url = '/app/treatments/'): Promise<boolean> {
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        if (registration && registration.showNotification) {
          await registration.showNotification(payload.title, { body: payload.body, icon: payload.icon, tag: payload.tag, data: { url } });
          return true;
        }
      }
      new Notification(payload.title, { body: payload.body, icon: payload.icon, tag: payload.tag });
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Fires a real notification for every treatment that is due today, has reminders
   * enabled, and whose reminder time has arrived — at most once per treatment per day.
   * Only works while this app is open (foreground or background tab); there is no
   * push server, so nothing fires once the browser is fully closed. Called on a
   * timer by ReminderScheduler (src/components/app/reminder-scheduler.tsx).
   */
  async checkAndFireDueReminders(now: Date = new Date()): Promise<string[]> {
    const settings = await this.getSettings();
    if (!settings.enabled || this.getPermissionState() !== 'granted') return [];

    const todayStr = localDateString(now);
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    const firedRecord = await db.settings.get(FIRED_TODAY_KEY);
    const fired = firedRecord?.value as FiredTodayRecord | undefined;
    const firedToday = fired?.date === todayStr ? fired.treatmentIds : [];

    const [treatments, todayEvents] = await Promise.all([
      LocalDataService.getTreatments(),
      LocalDataService.getTreatmentEvents(todayStr, todayStr),
    ]);
    const { due } = this.calculateDueTreatments(treatments, todayEvents, todayStr);

    const justFired: string[] = [];
    for (const t of due) {
      if (firedToday.includes(t.id)) continue;
      if (t.reminderEnabled === false) continue;
      const timeStr = t.reminderTime || settings.defaultTime;
      const [h, m] = timeStr.split(':').map(Number);
      if (Number.isNaN(h) || Number.isNaN(m) || nowMinutes < h * 60 + m) continue;

      const payload = this.buildNotificationPayload(t.name, t.dosage, settings.privacyMode);
      if (await this.showPayload(payload)) justFired.push(t.id);
    }

    if (justFired.length > 0) {
      await db.settings.put({
        key: FIRED_TODAY_KEY,
        value: { date: todayStr, treatmentIds: [...firedToday, ...justFired] } as FiredTodayRecord,
        updatedAt: Date.now(),
      });
    }
    return justFired;
  },

  /** Starts the foreground check loop. Returns a cleanup function; call once per mounted app. */
  startScheduler(intervalMs = 60_000): () => void {
    void this.checkAndFireDueReminders();
    const id = setInterval(() => void this.checkAndFireDueReminders(), intervalMs);
    return () => clearInterval(id);
  },

  // Calculate treatments due today
  calculateDueTreatments(
    treatments: LocalTreatment[],
    todayEvents: LocalTreatmentEvent[],
    todayDateStr: string = localDateString()
  ): {
    due: LocalTreatment[];
    completed: LocalTreatment[];
    skipped: LocalTreatment[];
    snoozed: Array<{ treatment: LocalTreatment; snoozeUntil: number }>;
  } {
    const due: LocalTreatment[] = [];
    const completed: LocalTreatment[] = [];
    const skipped: LocalTreatment[] = [];
    const snoozed: Array<{ treatment: LocalTreatment; snoozeUntil: number }> = [];

    const now = Date.now();
    const today = new Date(todayDateStr);
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.

    for (const t of treatments) {
      if (!t.active) continue;

      // Check if start date is in the future
      if (t.startDate && t.startDate > todayDateStr) continue;
      // Check if end date is in the past
      if (t.endDate && t.endDate < todayDateStr) continue;

      // Check events for today
      const eventsForTreatment = todayEvents.filter(
        (e) => e.treatmentId === t.id && e.date === todayDateStr
      );

      const isCompleted = eventsForTreatment.some(
        (e) => e.action === 'applied' || e.action === 'taken' || e.action === 'changed'
      );
      const isSkipped = eventsForTreatment.some((e) => e.action === 'skipped');
      const latestSnooze = eventsForTreatment
        .filter((e) => e.action === 'snoozed' && typeof e.snoozeUntil === 'number' && e.snoozeUntil > now)
        .sort((a, b) => (b.snoozeUntil || 0) - (a.snoozeUntil || 0))[0];

      if (isCompleted) {
        completed.push(t);
        continue;
      }

      if (isSkipped) {
        skipped.push(t);
        continue;
      }

      if (latestSnooze && latestSnooze.snoozeUntil) {
        snoozed.push({ treatment: t, snoozeUntil: latestSnooze.snoozeUntil });
        continue;
      }

      // If specific scheduleDays configured, check if today matches
      if (t.scheduleDays && t.scheduleDays.length > 0) {
        if (t.scheduleDays.includes(dayOfWeek)) {
          due.push(t);
        }
        continue;
      }

      // Default: daily or as-needed/custom
      due.push(t);
    }

    return { due, completed, skipped, snoozed };
  },
};
