import { describe, it, expect, beforeEach } from 'vitest';
import {
  NotificationService,
  DEFAULT_REMINDER_SETTINGS,
} from '../lib/notifications/treatment-reminders';
import { LocalTreatment, LocalTreatmentEvent } from '../lib/db/schema';
import { db } from '../lib/db/db';

describe('Phase 3: PWA Notifications & Treatment Reminders', () => {
  beforeEach(async () => {
    await db.settings.clear();
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

    expect(discretePayload.title).toBe('MenoWell Reminder');
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
});
