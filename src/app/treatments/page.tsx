'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Pill,
  Plus,
  Clock,
  Calendar,
  Info,
  Check,
  CheckCircle2,
  Bell,
  BellOff,
  ShieldCheck,
  Eye,
  EyeOff,
  RotateCcw,
  Sparkles,
  Trash2,
  Edit3,
  Flame,
  Moon,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  Share2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AppHeader } from '@/components/app/app-header';
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

const TREATMENT_TYPES: Array<{ value: TreatmentType; label: string; icon: string; category: string }> = [
  { value: 'patch', label: 'Transdermal Patch (e.g. Estradiol, Combipatch)', icon: '🩹', category: 'HRT / Transdermal' },
  { value: 'gel', label: 'Transdermal Gel (e.g. Estrogel, Divigel)', icon: '🧴', category: 'HRT / Transdermal' },
  { value: 'cream', label: 'Cream (e.g. Vaginal Estrogen, Progesterone)', icon: '✨', category: 'HRT / Topical' },
  { value: 'oral', label: 'Oral Medication (e.g. Micronized Progesterone)', icon: '💊', category: 'Medication' },
  { value: 'supplement', label: 'Supplement (e.g. Magnesium, Vitamin D3, Black Cohosh)', icon: '🌿', category: 'Supplement' },
  { value: 'other', label: 'Other / Custom Regimen', icon: '📝', category: 'Custom' },
];

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
  { day: 0, label: 'Sun' },
  { day: 1, label: 'Mon' },
  { day: 2, label: 'Tue' },
  { day: 3, label: 'Wed' },
  { day: 4, label: 'Thu' },
  { day: 5, label: 'Fri' },
  { day: 6, label: 'Sat' },
];

export default function TreatmentsPage() {
  const todayStr = new Date().toISOString().split('T')[0];

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

  // Add / Edit Modal State
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

  // Log Event Action Modal State
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionTreatment, setActionTreatment] = useState<LocalTreatment | null>(null);
  const [selectedAction, setSelectedAction] = useState<TreatmentAction>('applied');
  const [selectedSite, setSelectedSite] = useState<string>('');
  const [eventNotes, setEventNotes] = useState('');

  // Before / After Comparison Modal State
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
    }

    void loadData();

    return () => {
      isMounted = false;
    };
  }, [reloadTrigger]);

  // Open Add Modal
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

  // Open Edit Modal
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

  // Save Regimen (Add or Update)
  const handleSaveTreatment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const treatmentRecord: LocalTreatment = {
      id: editingTreatmentId || `trt_${Date.now()}`,
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
    setActionSuccess(editingTreatmentId ? 'Regimen updated.' : 'New regimen recorded.');
    setTimeout(() => setActionSuccess(null), 3000);
  };

  // Delete Regimen
  const handleDeleteTreatment = async (id: string, name: string) => {
    if (confirm(`Delete "${name}" and its recorded event history from your local device?`)) {
      await LocalDataService.deleteTreatment(id);
      setReloadTrigger((n) => n + 1);
      setActionSuccess(`Deleted "${name}".`);
      setTimeout(() => setActionSuccess(null), 3000);
    }
  };

  // Open Log Action Modal
  const handleOpenActionModal = (t: LocalTreatment, defaultAction: TreatmentAction = 'applied') => {
    setActionTreatment(t);
    setSelectedAction(defaultAction);
    setSelectedSite(t.defaultSite || 'Lower abdomen — Left');
    setEventNotes('');
    setShowActionModal(true);
  };

  // Save Log Action
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
    setActionSuccess(`${actionTreatment.name} marked as ${selectedAction.toUpperCase()}`);
    setTimeout(() => setActionSuccess(null), 3000);
  };

  // Quick Action for Snooze
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
    setActionSuccess(`Snoozed ${t.name} for 1 hour.`);
    setTimeout(() => setActionSuccess(null), 3000);
  };

  // Quick Action for Skip
  const handleQuickSkip = async (t: LocalTreatment) => {
    await LocalDataService.logTreatmentEvent({
      treatmentId: t.id,
      treatmentName: t.name,
      date: todayStr,
      action: 'skipped',
      notes: 'Skipped for today.',
    });
    setReloadTrigger((n) => n + 1);
    setActionSuccess(`Recorded ${t.name} as skipped.`);
    setTimeout(() => setActionSuccess(null), 3000);
  };

  // Open Comparison Modal
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

  // Toggle Notification Privacy Mode
  const handleTogglePrivacyMode = async () => {
    const newMode = reminderSettings.privacyMode === 'discrete' ? 'detailed' : 'discrete';
    const updated = await NotificationService.saveSettings({ privacyMode: newMode });
    setReminderSettings(updated);
    setActionSuccess(`Reminders set to ${newMode.toUpperCase()} mode.`);
    setTimeout(() => setActionSuccess(null), 3000);
  };

  // Request Notification Permission
  const handleRequestPermission = async () => {
    const perm = await NotificationService.requestPermission();
    setPermissionState(perm);
    if (perm === 'granted') {
      await NotificationService.saveSettings({ enabled: true });
      setReminderSettings((s) => ({ ...s, enabled: true }));
      setActionSuccess('Reminders enabled successfully.');
    } else if (perm === 'denied') {
      setActionSuccess('Notifications were blocked in your browser settings.');
    }
    setTimeout(() => setActionSuccess(null), 3500);
  };

  // Send Test Notification
  const handleTestNotification = async () => {
    const result = await NotificationService.sendTestNotification();
    setActionSuccess(result.message);
    setTimeout(() => setActionSuccess(null), 4000);
  };

  // Calculate Due Treatments
  const { due, completed, skipped, snoozed } = NotificationService.calculateDueTreatments(
    treatments,
    events,
    todayStr
  );

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader
        title="Treatments & HRT"
        subtitle="Schedules, application site rotation & reminders"
        showPrivacyBadge={true}
        showSettings={true}
      />

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-5 space-y-6">
        {/* Success Alert Banner */}
        {actionSuccess && (
          <div
            role="status"
            className="bg-[#EFF7F2] border border-[#CDE0D4] rounded-2xl p-3.5 text-xs text-[#2C6E49] flex items-center gap-2 animate-in fade-in"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Prescription Guardrail Notice */}
        <Card variant="muted" className="p-3.5 flex items-start gap-2.5 text-xs text-[#554E48]">
          <Info className="w-4 h-4 text-[#965342] shrink-0 mt-0.5" />
          <div className="leading-relaxed space-y-1">
            <p>
              <strong>Prescription Guardrail:</strong> MenoWell strictly organizes the routines, schedules, and clinician instructions you record.
            </p>
            <p className="text-[11px] text-[#8A817A]">
              We never recommend starting, stopping, or altering medications or dosages. Consult your qualified healthcare professional before making any changes.
            </p>
          </div>
        </Card>

        {/* PWA Reminders & Privacy Settings Card */}
        <Card className="p-4 bg-white border-[#E5DED5] space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#F7EFEA] text-[#965342] flex items-center justify-center">
                {reminderSettings.enabled && permissionState === 'granted' ? (
                  <Bell className="w-4 h-4" />
                ) : (
                  <BellOff className="w-4 h-4" />
                )}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#231F1D]">PWA Routine Reminders</h3>
                <p className="text-[11px] text-[#68615C]">
                  Status:{' '}
                  {permissionState === 'granted' ? (
                    <span className="text-[#2C6E49] font-medium">Active</span>
                  ) : permissionState === 'denied' ? (
                    <span className="text-[#965342] font-medium">Blocked in browser</span>
                  ) : permissionState === 'unsupported' ? (
                    <span className="text-[#8A817A]">Unsupported in browser</span>
                  ) : (
                    <span className="text-[#68615C]">Not yet enabled</span>
                  )}
                </p>
              </div>
            </div>

            {permissionState !== 'granted' ? (
              <Button
                size="sm"
                variant="primary"
                onClick={handleRequestPermission}
                className="text-xs px-3 min-h-[34px]"
              >
                Enable Reminders
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={handleTestNotification}
                className="text-xs px-3 min-h-[34px]"
              >
                Test Notification
              </Button>
            )}
          </div>

          {/* Privacy Mode Selector (Discrete vs Detailed) */}
          <div className="pt-2 border-t border-[#F0EBE3] flex items-center justify-between text-xs">
            <div className="space-y-0.5 pr-2">
              <span className="font-semibold text-[#231F1D] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#2C6E49]" />
                Lock Screen Privacy:{' '}
                <span className="font-bold text-[#965342] capitalize">
                  {reminderSettings.privacyMode} Mode
                </span>
              </span>
              <p className="text-[11px] text-[#68615C]">
                {reminderSettings.privacyMode === 'discrete'
                  ? 'Displays neutral alert: "Scheduled routine reminder". Keeps medication details off lock screen.'
                  : 'Displays full medication name & dose on lock screen.'}
              </p>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={handleTogglePrivacyMode}
              className="text-[11px] px-2.5 py-1 min-h-[30px] shrink-0"
            >
              {reminderSettings.privacyMode === 'discrete' ? (
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" /> Show Details
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <EyeOff className="w-3 h-3" /> Make Discrete
                </span>
              )}
            </Button>
          </div>

          {/* iOS Fallback Guidance if applicable */}
          {iosGuidance.requiresInstallForPush && (
            <div className="bg-[#FAF8F5] border border-[#E5DED5] rounded-xl p-3 text-[11px] text-[#68615C] flex items-start gap-2">
              <Share2 className="w-4 h-4 text-[#965342] shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong>iPhone Lock-Screen Tip:</strong> Apple iOS requires adding MenoWell to your Home Screen (tap Safari Share → <em>Add to Home Screen</em>) for system push alerts. In-app reminders below remain fully active.
              </p>
            </div>
          )}
        </Card>

        {/* Today's Schedule & Quick Action Hub */}
        <section className="space-y-3" aria-labelledby="due-schedule-heading">
          <div className="flex items-center justify-between">
            <h2 id="due-schedule-heading" className="text-base font-serif font-semibold text-[#231F1D]">
              Scheduled for Today
            </h2>
            <span className="text-xs text-[#8A817A]">{todayStr}</span>
          </div>

          {due.length === 0 && completed.length === 0 && skipped.length === 0 ? (
            <Card variant="muted" className="p-5 text-center text-xs text-[#68615C] space-y-2">
              <p>No treatments scheduled or recorded for today.</p>
              <Button size="sm" variant="outline" onClick={handleOpenAdd} className="text-xs">
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Treatment
              </Button>
            </Card>
          ) : (
            <div className="space-y-2.5">
              {/* Due Treatments */}
              {due.map((t) => (
                <Card key={t.id} className="p-3.5 bg-white border-[#E5DCD2] space-y-3 shadow-xs">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#F7EFEA] text-[#965342] flex items-center justify-center shrink-0 mt-0.5">
                        <Pill className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-sm text-[#231F1D]">{t.name}</h3>
                          <Badge variant="primary" className="text-[10px] capitalize">
                            {t.type.replace('hrt_', '')}
                          </Badge>
                        </div>
                        <p className="text-xs text-[#68615C] mt-0.5">
                          {t.dosage ? `${t.dosage} • ` : ''}
                          {t.frequency}
                          {t.defaultSite ? ` • Site: ${t.defaultSite}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          handleOpenActionModal(
                            t,
                            t.type === 'patch' || t.type === 'hrt_patch'
                              ? 'changed'
                              : t.type === 'oral' || t.type === 'oral_tablet' || t.type === 'supplement'
                              ? 'taken'
                              : 'applied'
                          )
                        }
                        className="text-xs px-3 min-h-[34px] font-semibold"
                      >
                        <Check className="w-3.5 h-3.5 mr-1" />
                        {t.type === 'patch' || t.type === 'hrt_patch' ? 'Change Patch' : 'Log Done'}
                      </Button>
                    </div>
                  </div>

                  {t.instructions && (
                    <p className="text-xs text-[#554E48] bg-[#FAF8F5] p-2.5 rounded-xl border border-[#EBE3D8] leading-relaxed">
                      {t.instructions}
                    </p>
                  )}

                  {/* Secondary Quick Controls: Skip, Snooze */}
                  <div className="pt-2 border-t border-[#F0EBE3] flex items-center justify-between text-xs text-[#8A817A]">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleQuickSkip(t)}
                        className="text-[11px] text-[#68615C] hover:text-[#965342] transition underline"
                      >
                        Skip for today
                      </button>
                      <span>•</span>
                      <button
                        onClick={() => handleQuickSnooze(t)}
                        className="text-[11px] text-[#68615C] hover:text-[#965342] transition underline"
                      >
                        Snooze 1h
                      </button>
                    </div>

                    {t.reminderTime && (
                      <span className="flex items-center gap-1 text-[#2C6E49] font-medium text-[11px]">
                        <Clock className="w-3 h-3" /> {t.reminderTime}
                      </span>
                    )}
                  </div>
                </Card>
              ))}

              {/* Completed Today */}
              {completed.map((t) => (
                <Card
                  key={t.id}
                  variant="muted"
                  className="p-3 bg-[#FAF8F5] border-[#E2DBD1] flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-[#EFF7F2] text-[#2C6E49] flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                    <div>
                      <p className="font-semibold text-[#231F1D] line-through opacity-75">{t.name}</p>
                      <p className="text-[11px] text-[#2C6E49]">Completed today</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenActionModal(t, 'applied')}
                    className="text-[11px] px-2.5 py-1 min-h-[28px]"
                  >
                    Log Again
                  </Button>
                </Card>
              ))}

              {/* Skipped Today */}
              {skipped.map((t) => (
                <Card
                  key={t.id}
                  variant="muted"
                  className="p-3 bg-[#FAF8F5] border-[#E2DBD1] flex items-center justify-between text-xs opacity-75"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-[11px] font-semibold text-[#8A817A]">SKIPPED</span>
                    <p className="text-[#231F1D]">{t.name}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenActionModal(t, 'applied')}
                    className="text-[11px] px-2.5 py-1 min-h-[28px]"
                  >
                    Log Done Instead
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* All Active Regimens List */}
        <section className="space-y-3" aria-labelledby="all-regimens-heading">
          <div className="flex items-center justify-between">
            <h2 id="all-regimens-heading" className="text-base font-serif font-semibold text-[#231F1D]">
              Active Regimens ({treatments.filter((t) => t.active).length})
            </h2>
            <Button
              size="sm"
              variant="outline"
              onClick={handleOpenAdd}
              className="gap-1.5 text-xs px-3 min-h-[34px]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Regimen</span>
            </Button>
          </div>

          {treatments.length === 0 ? (
            <Card variant="muted" className="p-6 text-center space-y-2">
              <p className="text-xs text-[#68615C]">No treatments or supplements recorded yet.</p>
              <Button size="sm" variant="primary" onClick={handleOpenAdd} className="text-xs">
                Add First Regimen
              </Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {treatments.map((t) => (
                <Card key={t.id} className="p-4 bg-white border-[#E5DED5] space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#F7EFEA] text-[#965342] flex items-center justify-center shrink-0">
                        <Pill className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-sm text-[#231F1D]">{t.name}</h3>
                          <Badge variant="primary" className="text-[10px] capitalize">
                            {t.type.replace('hrt_', '')}
                          </Badge>
                        </div>
                        <p className="text-xs text-[#68615C] mt-0.5">
                          {t.dosage ? `${t.dosage} • ` : ''}
                          {t.frequency}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(t)}
                        title="Edit Regimen"
                        className="p-1.5 text-[#68615C] hover:text-[#231F1D] rounded-lg hover:bg-[#F3EFEA] transition"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTreatment(t.id, t.name)}
                        title="Delete Regimen"
                        className="p-1.5 text-[#8A817A] hover:text-[#965342] rounded-lg hover:bg-[#FDF0EC] transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {t.instructions && (
                    <p className="text-xs text-[#554E48] bg-[#FAF8F5] p-2.5 rounded-xl border border-[#EBE3D8] leading-relaxed">
                      <strong>Instructions:</strong> {t.instructions}
                    </p>
                  )}

                  {t.notes && (
                    <p className="text-xs text-[#68615C] italic">
                      Notes: {t.notes}
                    </p>
                  )}

                  <div className="pt-2 border-t border-[#F0EBE3] flex flex-wrap items-center justify-between gap-2 text-xs text-[#68615C]">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> Started: {t.startDate}
                      </span>
                      {t.defaultSite && (
                        <span className="flex items-center gap-1">
                          <RotateCcw className="w-3.5 h-3.5 text-[#965342]" /> Site: {t.defaultSite}
                        </span>
                      )}
                    </div>

                    {/* Compare Before / After Button */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenComparison(t)}
                      className="text-xs px-2.5 py-1 min-h-[30px] gap-1 text-[#965342] hover:bg-[#F7EFEA]"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Compare Before & After
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Recent Application History */}
        {events.length > 0 && (
          <section className="space-y-3" aria-labelledby="history-heading">
            <h2 id="history-heading" className="text-base font-serif font-semibold text-[#231F1D]">
              Recent Application History ({events.length})
            </h2>

            <div className="space-y-2">
              {events.slice(0, 8).map((evt) => (
                <Card key={evt.id} variant="muted" className="p-3 text-xs flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-[#231F1D]">{evt.treatmentName}</p>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          evt.action === 'skipped'
                            ? 'bg-[#F2EDEA] text-[#8A817A]'
                            : evt.action === 'snoozed'
                            ? 'bg-[#FAF3F0] text-[#965342]'
                            : 'bg-[#EFF7F2] text-[#2C6E49]'
                        }`}
                      >
                        {evt.action}
                      </span>
                    </div>
                    {evt.site && <p className="text-[11px] text-[#965342]">Site: {evt.site}</p>}
                    {evt.notes && <p className="text-[#68615C] text-[11px]">{evt.notes}</p>}
                  </div>

                  <span className="text-[#8A817A] text-[11px] shrink-0">{evt.date}</span>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Modal: Add or Edit Regimen */}
        {showAddEditModal && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          >
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#E5DED5] space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <h3 className="font-serif font-bold text-lg text-[#231F1D]">
                  {editingTreatmentId ? 'Edit Regimen' : 'Add Regimen or Treatment'}
                </h3>
                <button
                  onClick={() => setShowAddEditModal(false)}
                  className="text-xs text-[#8A817A] hover:text-[#231F1D]"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveTreatment} className="space-y-3.5 text-xs">
                <div>
                  <label className="font-semibold text-[#231F1D] block mb-1">
                    Treatment / Medication / Supplement Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Estradiol Transdermal Patch"
                    className="w-full px-3 py-2 rounded-xl border border-[#E5DED5] focus:outline-none focus:border-[#965342]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="font-semibold text-[#231F1D] block mb-1">Type *</label>
                    <select
                      value={formType}
                      onChange={(e) => setFormType(e.target.value as TreatmentType)}
                      className="w-full px-2.5 py-2 rounded-xl border border-[#E5DED5] bg-white focus:outline-none focus:border-[#965342]"
                    >
                      {TREATMENT_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-[#231F1D] block mb-1">
                      Optional Dosage
                    </label>
                    <input
                      type="text"
                      value={formDosage}
                      onChange={(e) => setFormDosage(e.target.value)}
                      placeholder="e.g. 0.05 mg/day"
                      className="w-full px-3 py-2 rounded-xl border border-[#E5DED5] focus:outline-none focus:border-[#965342]"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-[#231F1D] block mb-1">Schedule / Frequency *</label>
                  <input
                    type="text"
                    required
                    value={formFrequency}
                    onChange={(e) => setFormFrequency(e.target.value)}
                    placeholder="e.g. Twice weekly (Mon & Thu) or Nightly"
                    className="w-full px-3 py-2 rounded-xl border border-[#E5DED5] focus:outline-none focus:border-[#965342]"
                  />
                </div>

                {/* Specific days selector */}
                <div>
                  <label className="font-semibold text-[#231F1D] block mb-1">
                    Scheduled Days of Week (Optional)
                  </label>
                  <div className="flex gap-1.5">
                    {DAYS_OF_WEEK.map((d) => {
                      const isSelected = formScheduleDays.includes(d.day);
                      return (
                        <button
                          type="button"
                          key={d.day}
                          onClick={() => {
                            if (isSelected) {
                              setFormScheduleDays(formScheduleDays.filter((x) => x !== d.day));
                            } else {
                              setFormScheduleDays([...formScheduleDays, d.day]);
                            }
                          }}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition ${
                            isSelected
                              ? 'bg-[#965342] text-white border-[#965342]'
                              : 'bg-[#FAF8F5] text-[#68615C] border-[#E5DED5] hover:bg-white'
                          }`}
                        >
                          {d.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Default Application Site */}
                {(formType === 'patch' || formType === 'gel' || formType === 'cream') && (
                  <div>
                    <label className="font-semibold text-[#231F1D] block mb-1">
                      Default Application Site
                    </label>
                    <select
                      value={formDefaultSite}
                      onChange={(e) => setFormDefaultSite(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-xl border border-[#E5DED5] bg-white focus:outline-none focus:border-[#965342]"
                    >
                      {APPLICATION_SITES.map((site) => (
                        <option key={site} value={site}>
                          {site}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="font-semibold text-[#231F1D] block mb-1">
                    User-Entered Instructions / Clinician Advice (Optional)
                  </label>
                  <input
                    type="text"
                    value={formInstructions}
                    onChange={(e) => setFormInstructions(e.target.value)}
                    placeholder="e.g. Rotate site each change; apply to dry, clean skin"
                    className="w-full px-3 py-2 rounded-xl border border-[#E5DED5] focus:outline-none focus:border-[#965342]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="font-semibold text-[#231F1D] block mb-1">Start Date</label>
                    <input
                      type="date"
                      required
                      value={formStartDate}
                      onChange={(e) => setFormStartDate(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-xl border border-[#E5DED5] bg-white focus:outline-none focus:border-[#965342]"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-[#231F1D] block mb-1">End Date (Optional)</label>
                    <input
                      type="date"
                      value={formEndDate}
                      onChange={(e) => setFormEndDate(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-xl border border-[#E5DED5] bg-white focus:outline-none focus:border-[#965342]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#F0EBE3]">
                  <div>
                    <label className="font-semibold text-[#231F1D] block">Reminder Alert</label>
                    <span className="text-[11px] text-[#68615C]">Notify on scheduled days</span>
                  </div>
                  <input
                    type="time"
                    value={formReminderTime}
                    onChange={(e) => setFormReminderTime(e.target.value)}
                    className="px-2 py-1.5 rounded-lg border border-[#E5DED5] text-xs"
                  />
                </div>

                <div className="flex gap-2 pt-3">
                  <Button type="submit" variant="primary" fullWidth size="sm">
                    {editingTreatmentId ? 'Update Regimen' : 'Save Regimen'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    fullWidth
                    size="sm"
                    onClick={() => setShowAddEditModal(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Log Action (Applied, Changed, Skipped, Snoozed) */}
        {showActionModal && actionTreatment && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          >
            <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-[#E5DED5] space-y-4">
              <div>
                <h3 className="font-serif font-bold text-lg text-[#231F1D]">
                  Log Treatment Action
                </h3>
                <p className="text-xs text-[#68615C] mt-0.5">{actionTreatment.name}</p>
              </div>

              <form onSubmit={handleSaveAction} className="space-y-3.5 text-xs">
                <div>
                  <label className="font-semibold text-[#231F1D] block mb-1">Action</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(['applied', 'taken', 'changed', 'skipped'] as TreatmentAction[]).map((act) => (
                      <button
                        type="button"
                        key={act}
                        onClick={() => setSelectedAction(act)}
                        className={`py-2 rounded-xl text-xs font-semibold capitalize border transition ${
                          selectedAction === act
                            ? 'bg-[#965342] text-white border-[#965342]'
                            : 'bg-[#FAF8F5] text-[#68615C] border-[#E5DED5]'
                        }`}
                      >
                        {act}
                      </button>
                    ))}
                  </div>
                </div>

                {(selectedAction === 'applied' || selectedAction === 'changed') && (
                  <div>
                    <label className="font-semibold text-[#231F1D] block mb-1">
                      Application / Rotation Site
                    </label>
                    <select
                      value={selectedSite}
                      onChange={(e) => setSelectedSite(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-xl border border-[#E5DED5] bg-white focus:outline-none focus:border-[#965342]"
                    >
                      {APPLICATION_SITES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="font-semibold text-[#231F1D] block mb-1">
                    Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={eventNotes}
                    onChange={(e) => setEventNotes(e.target.value)}
                    placeholder="e.g. Applied after evening shower, no skin irritation"
                    className="w-full px-3 py-2 rounded-xl border border-[#E5DED5] focus:outline-none focus:border-[#965342]"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button type="submit" variant="primary" fullWidth size="sm">
                    Record Log
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    fullWidth
                    size="sm"
                    onClick={() => setShowActionModal(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Before / After Treatment Comparison */}
        {showComparisonModal && comparisonTreatment && comparisonResult && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          >
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#E5DED5] space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between">
                <div>
                  <Badge variant="primary" className="text-[10px]">
                    Deterministic Comparison
                  </Badge>
                  <h3 className="font-serif font-bold text-lg text-[#231F1D] mt-1">
                    {comparisonTreatment.name}
                  </h3>
                  <p className="text-xs text-[#68615C]">
                    Recorded start: {comparisonTreatment.startDate}
                  </p>
                </div>
                <button
                  onClick={() => setShowComparisonModal(false)}
                  className="text-xs text-[#8A817A] hover:text-[#231F1D]"
                >
                  ✕
                </button>
              </div>

              {/* Window Selector */}
              <div className="flex items-center justify-between bg-[#FAF8F5] p-2 rounded-2xl border border-[#E5DED5]">
                <span className="text-xs font-semibold text-[#68615C] pl-2">
                  Comparison Window:
                </span>
                <div className="flex gap-1">
                  {([7, 14, 30] as const).map((win) => (
                    <button
                      key={win}
                      onClick={() => handleChangeComparisonWindow(win)}
                      className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
                        comparisonWindow === win
                          ? 'bg-[#965342] text-white'
                          : 'text-[#68615C] hover:bg-[#F0EBE3]'
                      }`}
                    >
                      {win} Days
                    </button>
                  ))}
                </div>
              </div>

              {/* Comparison Metric Cards */}
              <div className="space-y-3 text-xs">
                {/* Hot Flash Frequency */}
                <Card className="p-3.5 bg-white border-[#E5DED5] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#231F1D] flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-[#965342]" /> Hot Flashes
                    </span>
                    <span className="text-[11px] font-bold text-[#68615C]">
                      {comparisonResult.hotFlashes.beforeDailyAvg}/day → {comparisonResult.hotFlashes.afterDailyAvg}/day
                    </span>
                  </div>
                  <p className="text-[#554E48] text-xs leading-relaxed bg-[#FAF8F5] p-2.5 rounded-xl border border-[#EBE3D8]">
                    {comparisonResult.hotFlashes.statement}
                  </p>
                </Card>

                {/* Sleep Duration */}
                <Card className="p-3.5 bg-white border-[#E5DED5] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#231F1D] flex items-center gap-1.5">
                      <Moon className="w-4 h-4 text-[#577060]" /> Sleep Duration
                    </span>
                    <span className="text-[11px] font-bold text-[#68615C]">
                      {comparisonResult.sleep.beforeAvgHours}h → {comparisonResult.sleep.afterAvgHours}h
                    </span>
                  </div>
                  <p className="text-[#554E48] text-xs leading-relaxed bg-[#FAF8F5] p-2.5 rounded-xl border border-[#EBE3D8]">
                    {comparisonResult.sleep.statement}
                  </p>
                </Card>

                {/* Overall Feeling */}
                <Card className="p-3.5 bg-white border-[#E5DED5] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#231F1D]">Overall Daily Feeling</span>
                    <span className="text-[11px] font-bold text-[#68615C]">
                      {comparisonResult.feeling.beforeAvg}/5 → {comparisonResult.feeling.afterAvg}/5
                    </span>
                  </div>
                  <p className="text-[#554E48] text-xs leading-relaxed bg-[#FAF8F5] p-2.5 rounded-xl border border-[#EBE3D8]">
                    {comparisonResult.feeling.statement}
                  </p>
                </Card>

                {/* Top Recorded Symptoms */}
                {comparisonResult.topSymptomSeverities.length > 0 && (
                  <Card className="p-3.5 bg-white border-[#E5DED5] space-y-2">
                    <span className="font-semibold text-[#231F1D] block">
                      Specific Symptoms Trajectory
                    </span>
                    <div className="space-y-1.5 pt-1">
                      {comparisonResult.topSymptomSeverities.map((sym) => (
                        <p
                          key={sym.symptomName}
                          className="text-[11px] text-[#554E48] bg-[#FAF8F5] p-2 rounded-lg border border-[#EBE3D8]"
                        >
                          {sym.statement}
                        </p>
                      ))}
                    </div>
                  </Card>
                )}
              </div>

              {/* Strict Non-Causation Safety Guardrail */}
              <div className="bg-[#FAF3F0] border border-[#ECD9D1] rounded-2xl p-3.5 text-xs text-[#965342] space-y-1">
                <p className="font-semibold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  Medical Correlation Disclaimer:
                </p>
                <p className="leading-relaxed text-[11px] text-[#7A4234]">
                  {comparisonResult.safetyNotice}
                </p>
              </div>

              <div className="pt-2">
                <Button
                  variant="outline"
                  fullWidth
                  size="sm"
                  onClick={() => setShowComparisonModal(false)}
                >
                  Close Summary
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
