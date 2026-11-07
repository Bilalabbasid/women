'use client';

import React, { useState, useEffect } from 'react';
import {
  Bell,
  BellOff,
  CalendarDays,
  Clock,
  Eye,
  EyeOff,
  LineChart,
  Pencil,
  RotateCcw,
  Share2,
  Trash2,
} from 'lucide-react';
import { AppHeader } from '@/components/app/app-header';
import { AppPage, Icon, Panel, QuickPick, SectionHead } from '@/components/app/kit';
import { TreatmentSheet } from '@/components/app/treatments-sheet';
import { Callout } from '@/components/ui/callout';
import { IlloEmpty } from '@/components/ui/illustrations';
import { Switch } from '@/components/ui/interactive';
import { LocalDataService } from '@/lib/db/service';
import {
  LocalTreatment,
  LocalTreatmentEvent,
  TreatmentType,
  TreatmentAction,
  LocalCheckin,
  LocalSymptomEntry,
} from '@/lib/db/schema';
import {
  NotificationService,
  TreatmentReminderSettings,
  NotificationPermissionState,
} from '@/lib/notifications/treatment-reminders';
import {
  TreatmentComparisonEngine,
  TreatmentComparisonResult,
} from '@/lib/insights/treatment-comparison';
import { newId } from '@/lib/utils/id';
import { useLocalToday } from '@/components/storage/use-tool-state';

const TREATMENT_TYPES: Array<{ value: TreatmentType; label: string }> = [
  { value: 'patch', label: 'Patch (e.g. estradiol patch)' },
  { value: 'gel', label: 'Gel (e.g. Estrogel, Divigel)' },
  { value: 'cream', label: 'Cream (e.g. vaginal estrogen)' },
  { value: 'oral', label: 'Tablet or capsule (e.g. progesterone)' },
  { value: 'supplement', label: 'Supplement (e.g. magnesium, vitamin D)' },
  { value: 'other', label: 'Something else' },
];

/** Short, plain names for the type badge (includes older stored types). */
const TYPE_LABEL: Record<TreatmentType, string> = {
  patch: 'Patch',
  hrt_patch: 'Patch',
  gel: 'Gel',
  hrt_gel: 'Gel',
  cream: 'Cream',
  oral: 'Tablet',
  oral_tablet: 'Tablet',
  supplement: 'Supplement',
  lifestyle: 'Lifestyle',
  other: 'Other',
};

/** Medicines get the capsule icon and a type badge; routines, devices and therapies (type other or lifestyle) don't. */
const isMedicine = (t: LocalTreatment) => t.type !== 'other' && t.type !== 'lifestyle';
/** An hour's snooze makes sense for a daytime dose, not for a nightly routine or a non-medicine item. */
const canSnooze = (t: LocalTreatment) => isMedicine(t) && !/night|bedtime/i.test(t.frequency ?? '');

function TreatmentIcon({ t }: { t: LocalTreatment }) {
  return isMedicine(t) ? <Icon.Treatments width={22} height={22} /> : <Icon.Routine width={22} height={22} />;
}

function TypeBadge({ t }: { t: LocalTreatment }) {
  if (!isMedicine(t)) return null;
  return <span className="grade-badge bg-[var(--accent-soft)] text-[var(--accent)]">{TYPE_LABEL[t.type] ?? 'Other'}</span>;
}

const ACTION_LABEL: Record<TreatmentAction, string> = {
  applied: 'Applied',
  taken: 'Taken',
  changed: 'Changed',
  skipped: 'Skipped',
  snoozed: 'Snoozed',
};

const APPLICATION_SITES = [
  'Lower abdomen — Left',
  'Lower abdomen — Right',
  'Upper buttock — Left',
  'Upper buttock — Right',
  'Outer arm — Left',
  'Outer arm — Right',
  'Inner thigh',
  'Not applicable / Oral',
];

const DAYS_OF_WEEK = [
  { day: 0, label: 'Sun', name: 'Sunday' },
  { day: 1, label: 'Mon', name: 'Monday' },
  { day: 2, label: 'Tue', name: 'Tuesday' },
  { day: 3, label: 'Wed', name: 'Wednesday' },
  { day: 4, label: 'Thu', name: 'Thursday' },
  { day: 5, label: 'Fri', name: 'Friday' },
  { day: 6, label: 'Sat', name: 'Saturday' },
];

const isPatch = (t: LocalTreatment) => t.type === 'patch' || t.type === 'hrt_patch';
const defaultActionFor = (t: LocalTreatment): TreatmentAction =>
  isPatch(t) ? 'changed' : t.type === 'oral' || t.type === 'oral_tablet' || t.type === 'supplement' ? 'taken' : 'applied';

/** "Sat, Nov 7" from "2026-11-07", in her own time zone. */
function fmtDay(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function TreatmentsPage() {
  // Her local date ('' during server render so hydration matches): an evening dose belongs to today, not UTC tomorrow.
  const todayStr = useLocalToday();

  const [treatments, setTreatments] = useState<LocalTreatment[]>([]);
  const [events, setEvents] = useState<LocalTreatmentEvent[]>([]);
  const [allCheckins, setAllCheckins] = useState<Array<LocalCheckin & { symptoms: LocalSymptomEntry[] }>>([]);
  const [reminderSettings, setReminderSettings] = useState<TreatmentReminderSettings>({
    enabled: false,
    privacyMode: 'discrete',
    defaultTime: '08:00',
  });
  const [permissionState, setPermissionState] = useState<NotificationPermissionState>('not_requested');
  const [iosGuidance, setIosGuidance] = useState<{ isIOS: boolean; isStandalone: boolean; requiresInstallForPush: boolean; message: string }>({
    isIOS: false,
    isStandalone: false,
    requiresInstallForPush: false,
    message: '',
  });

  const [reloadTrigger, setReloadTrigger] = useState(0);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Add / Edit sheet state
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingTreatmentId, setEditingTreatmentId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<TreatmentType>('patch');
  const [formDosage, setFormDosage] = useState('');
  const [formFrequency, setFormFrequency] = useState('Daily');
  const [formScheduleDays, setFormScheduleDays] = useState<number[]>([]);
  const [formInstructions, setFormInstructions] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formDefaultSite, setFormDefaultSite] = useState('');
  const [formReminderEnabled, setFormReminderEnabled] = useState(true);
  const [formReminderTime, setFormReminderTime] = useState('08:00');
  const [formStartDate, setFormStartDate] = useState(todayStr);
  const [formEndDate, setFormEndDate] = useState('');

  // Log-a-dose sheet state
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionTreatment, setActionTreatment] = useState<LocalTreatment | null>(null);
  const [selectedAction, setSelectedAction] = useState<TreatmentAction>('applied');
  const [selectedSite, setSelectedSite] = useState<string>('');
  const [eventNotes, setEventNotes] = useState('');

  // Before / after sheet state
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [comparisonTreatment, setComparisonTreatment] = useState<LocalTreatment | null>(null);
  const [comparisonWindow, setComparisonWindow] = useState<7 | 14 | 30>(14);
  const [comparisonResult, setComparisonResult] = useState<TreatmentComparisonResult | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      const list = await LocalDataService.getTreatments();
      const evts = await LocalDataService.getTreatmentEvents();
      const checkinList = await LocalDataService.getAllCheckins();
      const settings = await NotificationService.getSettings();
      const perm = NotificationService.getPermissionState();
      const guidance = NotificationService.getIOSGuidance();

      if (!isMounted) return;
      setTreatments(list);
      setEvents(evts);
      setAllCheckins(checkinList);
      setReminderSettings(settings);
      setPermissionState(perm);
      setIosGuidance(guidance);
      setLoaded(true);
    }

    void loadData();

    return () => {
      isMounted = false;
    };
  }, [reloadTrigger]);

  // Open the add form
  const handleOpenAdd = () => {
    setEditingTreatmentId(null);
    setFormName('');
    setFormType('patch');
    setFormDosage('');
    setFormFrequency('Daily');
    setFormScheduleDays([]);
    setFormInstructions('');
    setFormNotes('');
    setFormDefaultSite('Lower abdomen — Left');
    setFormReminderEnabled(true);
    setFormReminderTime('08:00');
    setFormStartDate(todayStr);
    setFormEndDate('');
    setShowAddEditModal(true);
  };

  // Open the edit form
  const handleOpenEdit = (t: LocalTreatment) => {
    setEditingTreatmentId(t.id);
    setFormName(t.name);
    setFormType(t.type);
    setFormDosage(t.dosage || '');
    setFormFrequency(t.frequency);
    setFormScheduleDays(t.scheduleDays || []);
    setFormInstructions(t.instructions || '');
    setFormNotes(t.notes || '');
    setFormDefaultSite(t.defaultSite || 'Lower abdomen — Left');
    setFormReminderEnabled(t.reminderEnabled ?? true);
    setFormReminderTime(t.reminderTime || '08:00');
    setFormStartDate(t.startDate);
    setFormEndDate(t.endDate || '');
    setShowAddEditModal(true);
  };

  // Save a treatment (add or update)
  const handleSaveTreatment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const treatmentRecord: LocalTreatment = {
      id: editingTreatmentId || newId('trt'),
      name: formName.trim(),
      type: formType,
      dosage: formDosage.trim() || undefined,
      frequency: formFrequency.trim(),
      scheduleDays: formScheduleDays.length > 0 ? formScheduleDays : undefined,
      instructions: formInstructions.trim() || undefined,
      notes: formNotes.trim() || undefined,
      defaultSite: formDefaultSite || undefined,
      reminderEnabled: formReminderEnabled,
      reminderTime: formReminderEnabled ? formReminderTime : undefined,
      startDate: formStartDate || todayStr,
      endDate: formEndDate.trim() || undefined,
      active: true,
      createdAt: editingTreatmentId
        ? treatments.find((t) => t.id === editingTreatmentId)?.createdAt || Date.now()
        : Date.now(),
      updatedAt: Date.now(),
    };

    await LocalDataService.saveTreatment(treatmentRecord);
    setReloadTrigger((n) => n + 1);
    setShowAddEditModal(false);
    setActionSuccess(editingTreatmentId ? 'Treatment updated.' : 'Treatment saved.');
    setTimeout(() => setActionSuccess(null), 3000);
  };

  // Delete a treatment
  const handleDeleteTreatment = async (id: string, name: string) => {
    if (confirm(`Delete "${name}" and everything you logged for it? This removes it from this device and can't be undone.`)) {
      await LocalDataService.deleteTreatment(id);
      setReloadTrigger((n) => n + 1);
      setActionSuccess(`Deleted "${name}".`);
      setTimeout(() => setActionSuccess(null), 3000);
    }
  };

  // Open the log-a-dose form
  const handleOpenActionModal = (t: LocalTreatment, defaultAction: TreatmentAction = 'applied') => {
    setActionTreatment(t);
    setSelectedAction(defaultAction);
    setSelectedSite(t.defaultSite || 'Lower abdomen — Left');
    setEventNotes('');
    setShowActionModal(true);
  };

  // Save a logged dose
  const handleSaveAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionTreatment) return;

    await LocalDataService.logTreatmentEvent({
      treatmentId: actionTreatment.id,
      treatmentName: actionTreatment.name,
      date: todayStr,
      action: selectedAction,
      site: selectedAction === 'applied' || selectedAction === 'changed' ? selectedSite : undefined,
      notes: eventNotes.trim() || undefined,
    });

    setReloadTrigger((n) => n + 1);
    setShowActionModal(false);
    setActionSuccess(`${actionTreatment.name}: ${ACTION_LABEL[selectedAction].toLowerCase()} today.`);
    setTimeout(() => setActionSuccess(null), 3000);
  };

  // Snooze for an hour
  const handleQuickSnooze = async (t: LocalTreatment) => {
    const oneHourLater = Date.now() + 60 * 60 * 1000;
    await LocalDataService.logTreatmentEvent({
      treatmentId: t.id,
      treatmentName: t.name,
      date: todayStr,
      action: 'snoozed',
      snoozeUntil: oneHourLater,
      notes: 'Reminder snoozed for 1 hour.',
    });
    setReloadTrigger((n) => n + 1);
    setActionSuccess(`We'll remind you about ${t.name} in an hour.`);
    setTimeout(() => setActionSuccess(null), 3000);
  };

  // Skip for today
  const handleQuickSkip = async (t: LocalTreatment) => {
    await LocalDataService.logTreatmentEvent({
      treatmentId: t.id,
      treatmentName: t.name,
      date: todayStr,
      action: 'skipped',
      notes: 'Skipped for today.',
    });
    setReloadTrigger((n) => n + 1);
    setActionSuccess(`${t.name}: skipped today.`);
    setTimeout(() => setActionSuccess(null), 3000);
  };

  // Open before / after
  const handleOpenComparison = (t: LocalTreatment) => {
    setComparisonTreatment(t);
    const result = TreatmentComparisonEngine.comparePeriods(
      t.name,
      t.startDate,
      comparisonWindow,
      allCheckins
    );
    setComparisonResult(result);
    setShowComparisonModal(true);
  };

  const handleChangeComparisonWindow = (win: 7 | 14 | 30) => {
    setComparisonWindow(win);
    if (comparisonTreatment) {
      const result = TreatmentComparisonEngine.comparePeriods(
        comparisonTreatment.name,
        comparisonTreatment.startDate,
        win,
        allCheckins
      );
      setComparisonResult(result);
    }
  };

  // Lock-screen privacy (discrete vs detailed)
  const handleTogglePrivacyMode = async () => {
    const newMode = reminderSettings.privacyMode === 'discrete' ? 'detailed' : 'discrete';
    const updated = await NotificationService.saveSettings({ privacyMode: newMode });
    setReminderSettings(updated);
    setActionSuccess(
      newMode === 'discrete' ? 'Reminders will keep the medicine name private.' : 'Reminders will show the medicine name and dose.',
    );
    setTimeout(() => setActionSuccess(null), 3000);
  };

  // Ask the browser for notification permission
  const handleRequestPermission = async () => {
    const perm = await NotificationService.requestPermission();
    setPermissionState(perm);
    if (perm === 'granted') {
      await NotificationService.saveSettings({ enabled: true });
      setReminderSettings((s) => ({ ...s, enabled: true }));
      setActionSuccess('Reminders are on.');
    } else if (perm === 'denied') {
      setActionSuccess('Your browser blocked reminders. You can allow them in its site settings.');
    }
    setTimeout(() => setActionSuccess(null), 3500);
  };

  // Send a test notification
  const handleTestNotification = async () => {
    const result = await NotificationService.sendTestNotification();
    setActionSuccess(result.message);
    setTimeout(() => setActionSuccess(null), 4000);
  };

  // What's due today
  const { due, completed, skipped } = NotificationService.calculateDueTreatments(
    treatments,
    events,
    todayStr
  );

  const remindersOn = reminderSettings.enabled && permissionState === 'granted';
  const activeCount = treatments.filter((t) => t.active).length;

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader title="Treatments" subtitle="What you take, and reminders" showPrivacyBadge showSettings />

      <AppPage>
        {/* Confirmation, announced politely */}
        <div
          className="toast-region bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] md:bottom-6"
          role="status"
          aria-live="polite"
        >
          {actionSuccess && (
            <div className="toast">
              <span className="toast-icon" aria-hidden="true">
                <Icon.Check width={14} height={14} />
              </span>
              {actionSuccess}
            </div>
          )}
        </div>

        {/* ------------------------------------------------ due today */}
        <section aria-labelledby="due-heading" className="grid gap-3">
          <SectionHead
            id="due-heading"
            title="Due today"
            action={todayStr ? <span className="text-[1rem] text-[var(--ink-muted)]">{fmtDay(todayStr)}</span> : undefined}
          />

          {!loaded ? (
            <div className="panel" role="status" aria-busy="true" aria-label="Loading your treatments">
              <span className="skeleton h-6 w-1/2" />
              <span className="skeleton h-12 w-full" />
            </div>
          ) : due.length === 0 && completed.length === 0 && skipped.length === 0 ? (
            <Panel tone="quiet">
              <p className="text-[var(--ink-muted)]">
                {treatments.length === 0
                  ? 'Nothing to take today. Add a treatment below and it will show here on the days you take it.'
                  : 'Nothing is due today.'}
              </p>
            </Panel>
          ) : (
            <div className="grid gap-3">
              {due.map((t) => (
                <article key={t.id} className="panel panel-feature" aria-labelledby={`due-${t.id}`}>
                  <div className="flex items-start gap-3">
                    <span className="row-icon" aria-hidden="true">
                      <TreatmentIcon t={t} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <h3 id={`due-${t.id}`} className="text-[1.125rem] font-bold leading-snug">
                          {t.name}
                        </h3>
                        <TypeBadge t={t} />
                      </div>
                      <p className="row-meta mt-0.5">
                        {[t.dosage, t.frequency, t.defaultSite ? `Site: ${t.defaultSite}` : null].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    {t.reminderTime && (
                      <span className="inline-flex shrink-0 items-center gap-1 text-[1rem] font-bold text-[var(--accent)]">
                        <Clock className="h-4 w-4" aria-hidden="true" />
                        <span className="visually-hidden">Reminder at </span>
                        {t.reminderTime}
                      </span>
                    )}
                  </div>

                  {t.instructions && (
                    <p className="rounded-[var(--radius)] bg-[var(--paper-sunk)] px-3.5 py-2.5 text-[1rem] leading-relaxed">
                      {t.instructions}
                    </p>
                  )}

                  <button type="button" className="btn btn-secondary btn-block" onClick={() => handleOpenActionModal(t, defaultActionFor(t))}>
                    <Icon.Check width={20} height={20} />
                    {isPatch(t) ? 'Change patch' : 'Mark done'}
                  </button>
                  <div className={`-mt-1 grid gap-2 ${canSnooze(t) ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    <button type="button" className="btn btn-quiet btn-sm" onClick={() => handleQuickSkip(t)}>
                      Skip today
                    </button>
                    {canSnooze(t) && (
                      <button type="button" className="btn btn-quiet btn-sm" onClick={() => handleQuickSnooze(t)}>
                        Snooze 1 hour
                      </button>
                    )}
                  </div>
                </article>
              ))}

              {(completed.length > 0 || skipped.length > 0) && (
                <div className="row-list">
                  {completed.map((t) => (
                    <div key={t.id} className="row">
                      <span className="row-icon bg-[var(--g-strong-soft)] text-[var(--g-strong-ink)]" aria-hidden="true">
                        <Icon.Check width={20} height={20} />
                      </span>
                      <div className="row-main">
                        <p className="row-title">{t.name}</p>
                        <p className="row-meta text-[var(--g-strong-ink)]">Done today</p>
                      </div>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleOpenActionModal(t, 'applied')}>
                        Log again
                      </button>
                    </div>
                  ))}
                  {skipped.map((t) => (
                    <div key={t.id} className="row">
                      <span className="row-icon bg-[var(--paper-sunk)] text-[var(--ink-muted)]" aria-hidden="true">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                          <path d="M6 12h12" />
                        </svg>
                      </span>
                      <div className="row-main">
                        <p className="row-title">{t.name}</p>
                        <p className="row-meta">Skipped today</p>
                      </div>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleOpenActionModal(t, 'applied')}>
                        Mark done
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* ------------------------------------------------ what you take */}
        <section aria-labelledby="list-heading" className="grid gap-3">
          <SectionHead id="list-heading" title={activeCount > 0 ? `What you take (${activeCount})` : 'What you take'} />

          {loaded && treatments.length === 0 ? (
            <div className="empty-state">
              <IlloEmpty />
              <strong>Nothing added yet</strong>
              <span className="max-w-[30rem]">
                Add the medicines, patches or supplements you use. You&apos;ll get a simple checklist for the days you take
                them, and can compare how you felt before and after starting each one.
              </span>
              <button type="button" className="btn btn-primary" onClick={handleOpenAdd}>
                <Icon.Plus width={20} height={20} />
                Add a treatment
              </button>
            </div>
          ) : (
            <div className="grid gap-3">
              {treatments.map((t) => (
                <article key={t.id} className="panel" aria-labelledby={`trt-${t.id}`}>
                  <div className="flex items-start gap-3">
                    <span className="row-icon" aria-hidden="true">
                      <TreatmentIcon t={t} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <h3 id={`trt-${t.id}`} className="text-[1.125rem] font-bold leading-snug">
                          {t.name}
                        </h3>
                        <TypeBadge t={t} />
                      </div>
                      <p className="row-meta mt-0.5">{[t.dosage, t.frequency].filter(Boolean).join(' · ')}</p>
                    </div>
                    <div className="-mr-2 -mt-1 flex shrink-0">
                      <button type="button" className="icon-btn text-[var(--ink-muted)]" onClick={() => handleOpenEdit(t)} aria-label={`Edit ${t.name}`}>
                        <Pencil className="h-5 w-5" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className="icon-btn text-[var(--ink-muted)] hover:text-[var(--urgent)]"
                        onClick={() => handleDeleteTreatment(t.id, t.name)}
                        aria-label={`Delete ${t.name}`}
                      >
                        <Trash2 className="h-5 w-5" aria-hidden="true" />
                      </button>
                    </div>
                  </div>

                  {(t.instructions || t.notes) && (
                    <dl className="grid gap-2 rounded-[var(--radius)] bg-[var(--paper-sunk)] px-3.5 py-2.5 text-[1rem] leading-relaxed">
                      {t.instructions && (
                        <div>
                          <dt className="font-bold">How to use it</dt>
                          <dd>{t.instructions}</dd>
                        </div>
                      )}
                      {t.notes && (
                        <div>
                          <dt className="font-bold">Your notes</dt>
                          <dd>{t.notes}</dd>
                        </div>
                      )}
                    </dl>
                  )}

                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[1rem] text-[var(--ink-muted)]">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="h-4 w-4" aria-hidden="true" />
                      Started {fmtDay(t.startDate)}
                    </span>
                    {t.defaultSite && (
                      <span className="inline-flex items-center gap-1.5">
                        <RotateCcw className="h-4 w-4" aria-hidden="true" />
                        {t.defaultSite}
                      </span>
                    )}
                  </div>

                  <button type="button" className="btn btn-secondary justify-self-start" onClick={() => handleOpenComparison(t)}>
                    <LineChart className="h-5 w-5" aria-hidden="true" />
                    Compare before and after
                  </button>
                </article>
              ))}
              <button type="button" className="btn btn-secondary btn-block" onClick={handleOpenAdd}>
                <Icon.Plus width={20} height={20} />
                Add a treatment
              </button>
            </div>
          )}
        </section>

        {/* ------------------------------------------------ reminders */}
        <Panel
          title="Reminders"
          hint={
            permissionState === 'granted'
              ? 'On. They arrive while MenoVerdict is open in your browser; nothing comes if the browser is fully closed.'
              : permissionState === 'denied'
                ? 'Blocked in your browser’s settings for this site.'
                : permissionState === 'unsupported'
                  ? 'This browser can’t show reminders. Your checklist above still works.'
                  : 'Off. Turn them on to get a nudge at the times you set.'
          }
          action={
            <span
              className={`row-icon ${remindersOn ? '' : 'bg-[var(--paper-sunk)] text-[var(--ink-muted)]'}`}
              aria-hidden="true"
            >
              {remindersOn ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
            </span>
          }
        >
          {permissionState !== 'granted' ? (
            <button type="button" className="btn btn-primary justify-self-start" onClick={handleRequestPermission}>
              <Bell className="h-5 w-5" aria-hidden="true" />
              Turn on reminders
            </button>
          ) : (
            <button type="button" className="btn btn-secondary justify-self-start" onClick={handleTestNotification}>
              Send a test reminder
            </button>
          )}

          <div className="grid gap-2 border-t border-[var(--rule)] pt-4">
            <p className="font-bold">What the lock screen shows</p>
            <p className="text-[1rem] text-[var(--ink-muted)]">
              {reminderSettings.privacyMode === 'discrete'
                ? 'Only “Scheduled routine reminder”. The medicine name stays private.'
                : 'The medicine name and dose.'}
            </p>
            <button type="button" className="btn btn-secondary btn-sm justify-self-start" onClick={handleTogglePrivacyMode}>
              {reminderSettings.privacyMode === 'discrete' ? (
                <>
                  <Eye className="h-4 w-4" aria-hidden="true" /> Show the name instead
                </>
              ) : (
                <>
                  <EyeOff className="h-4 w-4" aria-hidden="true" /> Keep it private
                </>
              )}
            </button>
          </div>

          {iosGuidance.requiresInstallForPush && (
            <p className="flex items-start gap-2.5 rounded-[var(--radius)] bg-[var(--paper-sunk)] px-3.5 py-3 text-[1rem] leading-relaxed">
              <Share2 className="mt-1 h-4 w-4 shrink-0 text-[var(--accent)]" aria-hidden="true" />
              <span>
                <strong>On iPhone:</strong> reminders on the lock screen need MenoVerdict on your Home Screen. In Safari, tap
                Share, then “Add to Home Screen”. The checklist on this screen works either way.
              </span>
            </p>
          )}
        </Panel>

        {/* ------------------------------------------------ history */}
        {events.length > 0 && (
          <section aria-labelledby="history-heading" className="grid gap-3">
            <SectionHead id="history-heading" title="Recently logged" />
            <ul className="row-list">
              {events.slice(0, 8).map((evt) => (
                <li key={evt.id} className="row">
                  <div className="row-main">
                    <p className="row-title">
                      {evt.treatmentName}{' '}
                      <span
                        className={`grade-badge ml-1 align-middle ${
                          evt.action === 'skipped' || evt.action === 'snoozed'
                            ? 'bg-[var(--paper-sunk)] text-[var(--ink-muted)]'
                            : 'bg-[var(--g-strong-soft)] text-[var(--g-strong-ink)]'
                        }`}
                      >
                        {ACTION_LABEL[evt.action] ?? evt.action}
                      </span>
                    </p>
                    {(evt.site || evt.notes) && (
                      <p className="row-meta">{[evt.site ? `Site: ${evt.site}` : null, evt.notes].filter(Boolean).join(' · ')}</p>
                    )}
                  </div>
                  <span className="shrink-0 text-[1rem] text-[var(--ink-muted)]">{fmtDay(evt.date)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ------------------------------------------------ guardrail */}
        <section className="panel panel-quiet gap-1" aria-labelledby="own-record">
          <h2 id="own-record" className="font-bold">
            This is your own record
          </h2>
          <p className="text-[var(--ink-muted)]">
            MenoVerdict keeps track of what you and your doctor decided. It never suggests starting, stopping or
            changing a medicine or dose: talk to your doctor or pharmacist before changing anything.
          </p>
        </section>
      </AppPage>

      {/* ================================================ sheet: add or edit */}
      <TreatmentSheet
        open={showAddEditModal}
        onClose={() => setShowAddEditModal(false)}
        title={editingTreatmentId ? 'Edit treatment' : 'Add a treatment'}
      >
        <form onSubmit={handleSaveTreatment} className="grid gap-5">
          <div className="field">
            <label className="label" htmlFor="trt-name">
              Name
            </label>
            <input
              id="trt-name"
              className="input"
              type="text"
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. Estradiol patch"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="field">
              <label className="label" htmlFor="trt-type">
                Type
              </label>
              <select id="trt-type" className="select" value={formType} onChange={(e) => setFormType(e.target.value as TreatmentType)}>
                {TREATMENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label className="label" htmlFor="trt-dose">
                Dose <span className="font-normal text-[var(--ink-muted)]">(optional)</span>
              </label>
              <input
                id="trt-dose"
                className="input"
                type="text"
                value={formDosage}
                onChange={(e) => setFormDosage(e.target.value)}
                placeholder="e.g. 0.05 mg a day"
              />
            </div>
          </div>

          <div className="field">
            <label className="label" htmlFor="trt-freq">
              How often
            </label>
            <input
              id="trt-freq"
              className="input"
              type="text"
              required
              value={formFrequency}
              onChange={(e) => setFormFrequency(e.target.value)}
              placeholder="e.g. Twice a week, or every night"
            />
          </div>

          <fieldset className="field min-w-0 border-0 p-0">
            <legend className="label mb-1">
              On these days <span className="font-normal text-[var(--ink-muted)]">(optional)</span>
            </legend>
            <div className="grid grid-cols-7 gap-1.5">
              {DAYS_OF_WEEK.map((d) => {
                const isSelected = formScheduleDays.includes(d.day);
                return (
                  <button
                    type="button"
                    key={d.day}
                    aria-pressed={isSelected}
                    aria-label={d.name}
                    onClick={() => {
                      if (isSelected) {
                        setFormScheduleDays(formScheduleDays.filter((x) => x !== d.day));
                      } else {
                        setFormScheduleDays([...formScheduleDays, d.day]);
                      }
                    }}
                    className="chip min-h-12 justify-center px-0 text-[0.95rem] font-bold before:hidden"
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
            <span className="hint">Leave these empty to see it every day.</span>
          </fieldset>

          {(formType === 'patch' || formType === 'gel' || formType === 'cream') && (
            <div className="field">
              <label className="label" htmlFor="trt-site">
                Usual place on your body
              </label>
              <select id="trt-site" className="select" value={formDefaultSite} onChange={(e) => setFormDefaultSite(e.target.value)}>
                {APPLICATION_SITES.map((site) => (
                  <option key={site} value={site}>
                    {site}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="field">
            <label className="label" htmlFor="trt-instr">
              How to use it <span className="font-normal text-[var(--ink-muted)]">(optional)</span>
            </label>
            <input
              id="trt-instr"
              className="input"
              type="text"
              value={formInstructions}
              onChange={(e) => setFormInstructions(e.target.value)}
              placeholder="e.g. Change the spot each time; clean, dry skin"
            />
            <span className="hint">What your doctor or the leaflet told you.</span>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="field">
              <label className="label" htmlFor="trt-start">
                Started on
              </label>
              <input
                id="trt-start"
                className="input"
                type="date"
                required
                value={formStartDate}
                onChange={(e) => setFormStartDate(e.target.value)}
              />
            </div>
            <div className="field">
              <label className="label" htmlFor="trt-end">
                Stops on <span className="font-normal text-[var(--ink-muted)]">(optional)</span>
              </label>
              <input id="trt-end" className="input" type="date" value={formEndDate} onChange={(e) => setFormEndDate(e.target.value)} />
            </div>
          </div>

          <div className="grid gap-3 border-t border-[var(--rule)] pt-4">
            <Switch label="Remind me" checked={formReminderEnabled} onChange={setFormReminderEnabled} />
            {formReminderEnabled && (
              <div className="field max-w-[12rem]">
                <label className="label" htmlFor="trt-time">
                  At
                </label>
                <input
                  id="trt-time"
                  className="input"
                  type="time"
                  value={formReminderTime}
                  onChange={(e) => setFormReminderTime(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <button type="submit" className="btn btn-primary">
              Save treatment
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => setShowAddEditModal(false)}>
              Cancel
            </button>
          </div>
        </form>
      </TreatmentSheet>

      {/* ================================================ sheet: log a dose */}
      <TreatmentSheet
        open={showActionModal && !!actionTreatment}
        onClose={() => setShowActionModal(false)}
        title="Log it"
        subtitle={actionTreatment?.name}
      >
        <form onSubmit={handleSaveAction} className="grid gap-5">
          <div className="grid gap-2">
            <span className="label">What did you do?</span>
            <QuickPick<TreatmentAction>
              label="What did you do?"
              columns={2}
              options={(['applied', 'taken', 'changed', 'skipped'] as TreatmentAction[]).map((a) => ({ value: a, label: ACTION_LABEL[a] }))}
              value={selectedAction}
              onChange={setSelectedAction}
            />
          </div>

          {(selectedAction === 'applied' || selectedAction === 'changed') && (
            <div className="field">
              <label className="label" htmlFor="act-site">
                Where on your body
              </label>
              <select id="act-site" className="select" value={selectedSite} onChange={(e) => setSelectedSite(e.target.value)}>
                {APPLICATION_SITES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <span className="hint">Changing the spot each time helps your skin.</span>
            </div>
          )}

          <div className="field">
            <label className="label" htmlFor="act-notes">
              Note <span className="font-normal text-[var(--ink-muted)]">(optional)</span>
            </label>
            <input
              id="act-notes"
              className="input"
              type="text"
              value={eventNotes}
              onChange={(e) => setEventNotes(e.target.value)}
              placeholder="e.g. After my evening shower, no itching"
            />
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <button type="submit" className="btn btn-primary">
              <Icon.Check width={20} height={20} />
              Save
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => setShowActionModal(false)}>
              Cancel
            </button>
          </div>
        </form>
      </TreatmentSheet>

      {/* ================================================ sheet: before and after */}
      <TreatmentSheet
        open={showComparisonModal && !!comparisonTreatment && !!comparisonResult}
        onClose={() => setShowComparisonModal(false)}
        title="Before and after"
        subtitle={comparisonTreatment ? `${comparisonTreatment.name} · started ${fmtDay(comparisonTreatment.startDate)}` : undefined}
      >
        {comparisonResult && (
          <div className="grid gap-5">
            <div className="grid gap-2">
              <span className="label">Days to compare</span>
              <QuickPick<7 | 14 | 30>
                label="Days to compare"
                options={[
                  { value: 7, label: '7 days' },
                  { value: 14, label: '14 days' },
                  { value: 30, label: '30 days' },
                ]}
                value={comparisonWindow}
                onChange={handleChangeComparisonWindow}
              />
              <span className="hint">The same number of days before and after you started.</span>
            </div>

            {[
              {
                key: 'hf',
                icon: <Icon.Flame width={20} height={20} />,
                title: 'Hot flashes a day',
                enough: comparisonResult.hotFlashes.reportedTrend !== 'insufficient_data',
                before: comparisonResult.hotFlashes.beforeDailyAvg,
                after: comparisonResult.hotFlashes.afterDailyAvg,
                statement: comparisonResult.hotFlashes.statement,
              },
              {
                key: 'sleep',
                icon: <Icon.Moon width={20} height={20} />,
                title: 'Hours of sleep',
                enough: comparisonResult.sleep.reportedTrend !== 'insufficient_data',
                before: `${comparisonResult.sleep.beforeAvgHours}`,
                after: `${comparisonResult.sleep.afterAvgHours}`,
                statement: comparisonResult.sleep.statement,
              },
              {
                key: 'feel',
                icon: <Icon.Today width={20} height={20} />,
                title: 'How you felt overall (out of 5)',
                enough: comparisonResult.feeling.reportedTrend !== 'insufficient_data',
                before: comparisonResult.feeling.beforeAvg,
                after: comparisonResult.feeling.afterAvg,
                statement: comparisonResult.feeling.statement,
              },
            ].map((m) => (
              <section key={m.key} className="grid gap-3 rounded-[var(--radius-lg)] border border-[var(--rule)] p-4" aria-label={m.title}>
                <p className="flex items-center gap-2 font-bold">
                  <span className="text-[var(--accent)]" aria-hidden="true">
                    {m.icon}
                  </span>
                  {m.title}
                </p>
                {m.enough && (
                  <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2 text-center">
                    <div>
                      <p className="stat-value">{m.before}</p>
                      <p className="stat-label">Before</p>
                    </div>
                    <span className="pb-6 text-[var(--ink-muted)]" aria-hidden="true">
                      →
                    </span>
                    <div>
                      <p className="stat-value">{m.after}</p>
                      <p className="stat-label">After</p>
                    </div>
                  </div>
                )}
                <p className="text-[1rem] leading-relaxed text-[var(--ink-muted)]">{m.statement}</p>
              </section>
            ))}

            {comparisonResult.topSymptomSeverities.length > 0 && (
              <section className="grid gap-2" aria-label="Symptoms you logged most">
                <p className="font-bold">Symptoms you logged most</p>
                <ul className="grid gap-2">
                  {comparisonResult.topSymptomSeverities.map((sym) => (
                    <li key={sym.symptomName} className="rounded-[var(--radius)] bg-[var(--paper-sunk)] px-3.5 py-2.5 text-[1rem] leading-relaxed">
                      {sym.statement}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <Callout kind="careful" title="This shows timing, not cause" headingLevel={3}>
              <p>{comparisonResult.safetyNotice}</p>
            </Callout>

            <button type="button" className="btn btn-secondary" onClick={() => setShowComparisonModal(false)}>
              Close
            </button>
          </div>
        )}
      </TreatmentSheet>
    </div>
  );
}
