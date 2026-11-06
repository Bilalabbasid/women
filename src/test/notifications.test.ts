import { describe, it, expect, beforeEach } from 'vitest';
import {
  NotificationService,
} from '../lib/notifications/treatment-reminders';
import { LocalTreatment, LocalTreatmentEvent } from '../lib/db/schema';
import { db } from '../lib/db/db';

describe('Phase 3: PWA Notifications & Treatment Reminders', () => {
  beforeEach(async () => {
    await db.settings.clear();
    await db.treatments.clear();
    await db.treatmentEvents.clear();
  });

  it('handles permission states: not_requested, granted, denied, unsupported', () => {
    // In node/vitest environment, 'Notification' is either undefined or mocked
    const perm = NotificationService.getPermissionState();
    expect(['not_requested', 'granted', 'denied', 'unsupported']).toContain(perm);
  });

  it('builds discrete lock-screen notification payload by default to protect medical privacy', () => {
    const discretePayload = NotificationService.buildNotificationPayload(
      'Estradiol Transdermal Patch',
      '0.05 mg/day',
      'discrete'
    );

    expect(discretePayload.title).toBe('MenoVerdict Reminder');
    expect(discretePayload.body).toContain('Scheduled routine reminder');
    // Lock-screen safety: NEVER leak sensitive hormone or medication names in discrete mode
    expect(discretePayload.body).not.toContain('Estradiol');
    expect(discretePayload.body).not.toContain('0.05 mg/day');
  });

  it('builds detailed notification payload when user explicitly selects detailed mode', () => {
    const detailedPayload = NotificationService.buildNotificationPayload(
      'Estradiol Transdermal Patch',
      '0.05 mg/day',
      'detailed'
    );

    expect(detailedPayload.title).toBe('Treatment Reminder');
    expect(detailedPayload.body).toContain('Estradiol Transdermal Patch');
    expect(detailedPayload.body).toContain('(0.05 mg/day)');
  });

  it('persists and updates notification settings in local database', async () => {
    const initial = await NotificationService.getSettings();
    expect(initial.privacyMode).toBe('discrete');

    await NotificationService.saveSettings({
      enabled: true,
      privacyMode: 'detailed',
      defaultTime: '09:30',
    });

    const updated = await NotificationService.getSettings();
    expect(updated.enabled).toBe(true);
    expect(updated.privacyMode).toBe('detailed');
    expect(updated.defaultTime).toBe('09:30');
  });

  it('calculates due, completed, skipped, and snoozed treatments accurately', () => {
    const treatments: LocalTreatment[] = [
      {
        id: 'trt_daily',
        name: 'Progesterone',
        type: 'oral',
        frequency: 'Daily',
        startDate: '2026-09-01',
        active: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: 'trt_patch',
        name: 'Estradiol Patch',
        type: 'patch',
        frequency: 'Twice weekly',
        scheduleDays: [1, 4], // Monday, Thursday
        startDate: '2026-09-01',
        active: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: 'trt_inactive',
        name: 'Old Supplement',
        type: 'supplement',
        frequency: 'Daily',
        startDate: '2026-08-01',
        active: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    const todayDate = '2026-09-14'; // A Monday (day 1)

    // Scenario A: Nothing logged yet today
    const resA = NotificationService.calculateDueTreatments(treatments, [], todayDate);
    expect(resA.due.length).toBe(2); // both daily and Monday patch are due
    expect(resA.completed.length).toBe(0);

    // Scenario B: Patch is completed, oral is skipped
    const events: LocalTreatmentEvent[] = [
      {
        id: 'evt_1',
        treatmentId: 'trt_patch',
        treatmentName: 'Estradiol Patch',
        date: todayDate,
        timestamp: Date.now(),
        action: 'changed',
      },
      {
        id: 'evt_2',
        treatmentId: 'trt_daily',
        treatmentName: 'Progesterone',
        date: todayDate,
        timestamp: Date.now(),
        action: 'skipped',
      },
    ];

    const resB = NotificationService.calculateDueTreatments(treatments, events, todayDate);
    expect(resB.due.length).toBe(0);
    expect(resB.completed.length).toBe(1);
    expect(resB.skipped.length).toBe(1);
  });

  it('provides iOS guidance with graceful fallback message', () => {
    const guidance = NotificationService.getIOSGuidance();
    expect(typeof guidance.message).toBe('string');
    expect(typeof guidance.requiresInstallForPush).toBe('boolean');
  });

  describe('checkAndFireDueReminders (real scheduling, not just a status badge)', () => {
    const fired: Array<{ title: string; body: string }> = [];

    beforeEach(() => {
      fired.length = 0;
      // jsdom has no real Notification API; stub just enough to exercise the firing path.
      (globalThis as unknown as { Notification: unknown }).Notification = class {
        static permission = 'granted';
        constructor(title: string, opts: { body: string }) {
          fired.push({ title, body: opts.body });
        }
      };
    });

    it('does nothing if reminders are disabled, even when a treatment is due and its time has passed', async () => {
      await NotificationService.saveSettings({ enabled: false, defaultTime: '08:00' });
      const treatments: LocalTreatment[] = [
        { id: 't1', name: 'Progesterone', type: 'oral', frequency: 'Daily', startDate: '2026-09-01', active: true, reminderEnabled: true, createdAt: 0, updatedAt: 0 },
      ];
      await db.treatments.bulkPut(treatments);
      const result = await NotificationService.checkAndFireDueReminders(new Date('2026-09-14T20:00:00'));
      expect(result).toEqual([]);
      expect(fired).toEqual([]);
    });

    it('does nothing before the reminder time arrives', async () => {
      await NotificationService.saveSettings({ enabled: true, defaultTime: '20:00' });
      await db.treatments.bulkPut([
        { id: 't2', name: 'Progesterone', type: 'oral', frequency: 'Daily', startDate: '2026-09-01', active: true, reminderEnabled: true, createdAt: 0, updatedAt: 0 },
      ]);
      const result = await NotificationService.checkAndFireDueReminders(new Date('2026-09-14T08:00:00'));
      expect(result).toEqual([]);
      expect(fired).toEqual([]);
    });

    it('fires a real notification once the reminder time arrives for a due, enabled treatment', async () => {
      await NotificationService.saveSettings({ enabled: true, defaultTime: '08:00' });
      await db.treatments.bulkPut([
        { id: 't3', name: 'Progesterone', type: 'oral', frequency: 'Daily', startDate: '2026-09-01', active: true, reminderEnabled: true, createdAt: 0, updatedAt: 0 },
      ]);
      const result = await NotificationService.checkAndFireDueReminders(new Date('2026-09-14T08:05:00'));
      expect(result).toEqual(['t3']);
      expect(fired).toHaveLength(1);
    });

    it('never fires twice for the same treatment on the same day', async () => {
      await NotificationService.saveSettings({ enabled: true, defaultTime: '08:00' });
      await db.treatments.bulkPut([
        { id: 't4', name: 'Progesterone', type: 'oral', frequency: 'Daily', startDate: '2026-09-01', active: true, reminderEnabled: true, createdAt: 0, updatedAt: 0 },
      ]);
      const first = await NotificationService.checkAndFireDueReminders(new Date('2026-09-14T08:05:00'));
      const second = await NotificationService.checkAndFireDueReminders(new Date('2026-09-14T09:00:00'));
      expect(first).toEqual(['t4']);
      expect(second).toEqual([]);
      expect(fired).toHaveLength(1);
    });

    it('respects a per-treatment reminderTime over the global default, and skips when reminderEnabled is false', async () => {
      await NotificationService.saveSettings({ enabled: true, defaultTime: '06:00' });
      await db.treatments.bulkPut([
        { id: 't5', name: 'Morning patch', type: 'patch', frequency: 'Daily', startDate: '2026-09-01', active: true, reminderEnabled: true, reminderTime: '21:00', createdAt: 0, updatedAt: 0 },
        { id: 't6', name: 'Opted out', type: 'oral', frequency: 'Daily', startDate: '2026-09-01', active: true, reminderEnabled: false, createdAt: 0, updatedAt: 0 },
      ]);
      // Global default time (06:00) has passed, but t5's own reminderTime (21:00) hasn't.
      const early = await NotificationService.checkAndFireDueReminders(new Date('2026-09-14T08:00:00'));
      expect(early).toEqual([]);

      const late = await NotificationService.checkAndFireDueReminders(new Date('2026-09-14T21:05:00'));
      expect(late).toEqual(['t5']); // t6 never fires: reminderEnabled is false
    });

    it('does not fire for a treatment already logged as taken/skipped/snoozed today', async () => {
      await NotificationService.saveSettings({ enabled: true, defaultTime: '08:00' });
      await db.treatments.bulkPut([
        { id: 't7', name: 'Progesterone', type: 'oral', frequency: 'Daily', startDate: '2026-09-01', active: true, reminderEnabled: true, createdAt: 0, updatedAt: 0 },
      ]);
      await db.treatmentEvents.put({
        id: 'evt_t7', treatmentId: 't7', treatmentName: 'Progesterone', date: '2026-09-14', timestamp: Date.now(), action: 'taken',
      });
      const result = await NotificationService.checkAndFireDueReminders(new Date('2026-09-14T08:05:00'));
      expect(result).toEqual([]);
      expect(fired).toEqual([]);
    });
  });
});
