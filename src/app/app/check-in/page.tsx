'use client';

import React, { useState, useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/app/app-header';
import { AppPage, Icon, LevelPicker, Panel, QuickPick, Stepper, SymptomChips } from '@/components/app/kit';
import { STANDARD_SYMPTOMS } from '@/lib/config/symptoms';
import { LocalDataService } from '@/lib/db/service';
import { SeverityLevel, FlowLevel, LocalCustomSymptom } from '@/lib/db/schema';
import { evaluateUrgentTriggers } from '@/lib/safety/urgent-triggers';
import { UrgentGuidance } from '@/components/safety/urgent-guidance';
import { markToolUsed } from '@/lib/pwa/install-gate';
import { requestPersistentStorage } from '@/lib/pwa/persist-storage';
import { describeStorageError } from '@/lib/storage/errors';
import { useLocalToday } from '@/components/storage/use-tool-state';

const subscribeNoop = () => () => {};
/** ?date=YYYY-MM-DD opens that day's entry for editing (e.g. from the timeline). */
function readDateParam(): string {
  const d = new URLSearchParams(window.location.search).get('date') ?? '';
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : '';
}
function readPinned(): string {
  try {
    return window.localStorage.getItem('menowell_pinned_symptoms') ?? '[]';
  } catch {
    return '[]';
  }
}

const FEELINGS: Array<{ value: 1 | 2 | 3 | 4 | 5; label: string; desc: string }> = [
  { value: 1, label: 'Rough', desc: 'Very hard' },
  { value: 2, label: 'Low', desc: 'Struggling' },
  { value: 3, label: 'Okay', desc: 'Manageable' },
  { value: 4, label: 'Good', desc: 'Steady' },
  { value: 5, label: 'Great', desc: 'Thriving' },
];

const FLOWS: Array<{ value: FlowLevel; label: string }> = [
  { value: 'none', label: 'None' },
  { value: 'spotting', label: 'Spotting' },
  { value: 'light', label: 'Light' },
  { value: 'medium', label: 'Medium' },
  { value: 'heavy', label: 'Heavy' },
];

/** Sleep quick picks (hours). Half-hours stay possible with the fine adjust below. */
const SLEEP_PICKS = [
  { value: 4, label: '4 or less' },
  { value: 5, label: '5' },
  { value: 6, label: '6' },
  { value: 7, label: '7' },
  { value: 8, label: '8' },
  { value: 9, label: '9+' },
];

function longDay(date: string) {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

export default function CheckinPage() {
  const router = useRouter();

  // Her local date ('' during server render so hydration matches); an evening entry belongs to today, not UTC tomorrow.
  const todayStr = useLocalToday();
  const dateParam = useSyncExternalStore(subscribeNoop, readDateParam, () => '');
  const [pickedDate, setSelectedDate] = useState<string>('');
  const selectedDate = pickedDate || (dateParam && todayStr && dateParam <= todayStr ? dateParam : todayStr);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [overallFeeling, setOverallFeeling] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [journalText, setJournalText] = useState('');
  const [coversDays, setCoversDays] = useState<1 | 7>(1);
  const weekly = coversDays === 7;
  const [sleepHours, setSleepHours] = useState<number>(7);
  const [wokeAtNight, setWokeAtNight] = useState<boolean>(false);
  const [hotFlashCount, setHotFlashCount] = useState<number>(0);
  const [flow, setFlow] = useState<FlowLevel>('none');
  const [caffeine, setCaffeine] = useState(false);
  const [alcohol, setAlcohol] = useState(false);
  const [exercise, setExercise] = useState(false);

  const [showMoreSymptoms, setShowMoreSymptoms] = useState(false);
  const [showSleepAdjust, setShowSleepAdjust] = useState(false);

  // Symptoms tracking: id → strength 1-5
  const [selectedSymptoms, setSelectedSymptoms] = useState<{ [id: string]: number }>({});

  // Custom symptoms
  const [customSymptomsList, setCustomSymptomsList] = useState<LocalCustomSymptom[]>([]);
  const [showAddCustomModal, setShowAddCustomModal] = useState(false);
  const [newCustomName, setNewCustomName] = useState('');
  const customDialog = useRef<HTMLDialogElement>(null);

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load existing check-in if editing
  useEffect(() => {
    let alive = true;
    async function loadData() {
      if (!selectedDate) return;
      const custom = await LocalDataService.getCustomSymptoms();
      if (!alive) return;
      setCustomSymptomsList(custom);

      const existing = await LocalDataService.getCheckinByDate(selectedDate);
      if (!alive) return;
      setSavedSuccess(false);
      setSaveError(null);
      if (!existing) {
        // A day with no entry starts blank. Never carry the previously viewed day's answers into it.
        setOverallFeeling(3);
        setCoversDays(1);
        setJournalText('');
        setSleepHours(7);
        setWokeAtNight(false);
        setHotFlashCount(0);
        setFlow('none');
        setCaffeine(false);
        setAlcohol(false);
        setExercise(false);
        setSelectedSymptoms({});
        return;
      }
      {
        setOverallFeeling(existing.overallFeeling);
        setCoversDays(existing.coversDays === 7 ? 7 : 1);
        // Every field is set from this day's entry (or its default), so nothing from another day shows through.
        setJournalText(existing.notes ?? '');
        setSleepHours(typeof existing.sleepHours === 'number' ? existing.sleepHours : 7);
        setWokeAtNight(existing.wokeAtNight === true);
        setHotFlashCount(typeof existing.hotFlashCount === 'number' ? existing.hotFlashCount : 0);
        setFlow(existing.flow ?? 'none');
        setCaffeine(!!existing.lifestyle?.caffeine);
        setAlcohol(!!existing.lifestyle?.alcohol);
        setExercise(!!existing.lifestyle?.exercise);

        const symMap: { [id: string]: number } = {};
        for (const s of existing.symptoms) {
          symMap[s.symptomId] = s.severity;
        }
        setSelectedSymptoms(symMap);
      }
    }
    void loadData();
    return () => {
      alive = false;
    };
  }, [selectedDate]);

  // The add-your-own dialog opens as a real modal (focus trap, Esc to close).
  useEffect(() => {
    const d = customDialog.current;
    if (!d) return;
    if (showAddCustomModal && !d.open) d.showModal();
    if (!showAddCustomModal && d.open) d.close();
  }, [showAddCustomModal]);

  /** Tap a chip: add it at 3 (moderate), or remove it. */
  const toggleSymptom = (id: string) => {
    setSelectedSymptoms((prev) => {
      const copy = { ...prev };
      if (copy[id]) delete copy[id];
      else copy[id] = 3;
      return copy;
    });
  };
  const setSymptomStrength = (id: string, severity: number) => {
    setSelectedSymptoms((prev) => ({ ...prev, [id]: severity }));
  };

  const handleCreateCustomSymptom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomName.trim()) return;
    const added = await LocalDataService.addCustomSymptom(newCustomName.trim());
    setCustomSymptomsList((prev) => [...prev, added]);
    // Auto-select with moderate severity
    setSelectedSymptoms((prev) => ({ ...prev, [added.id]: 3 }));
    setNewCustomName('');
    setShowAddCustomModal(false);
  };

  const handleSave = async () => {
    if (!selectedDate) return;
    setIsSaving(true);
    setSaveError(null);

    const symptomEntries = Object.entries(selectedSymptoms).map(([id, sev]) => {
      const std = STANDARD_SYMPTOMS.find((s) => s.id === id);
      const cust = customSymptomsList.find((c) => c.id === id);
      return {
        symptomId: id,
        name: std ? std.name : cust ? cust.name : id,
        category: std ? std.category : 'custom',
        severity: sev as SeverityLevel,
      };
    });

    try {
      await LocalDataService.saveCheckin({
        date: selectedDate,
        overallFeeling,
        notes: journalText.trim() || undefined,
        coversDays,
        sleepHours,
        // Night waking is a per-night answer, recorded on daily entries only.
        wokeAtNight: weekly ? undefined : wokeAtNight,
        hotFlashCount,
        flow,
        lifestyle: { caffeine, alcohol, exercise },
        symptoms: symptomEntries,
      });
    } catch (err) {
      setIsSaving(false);
      setSaveError(describeStorageError(err));
      return;
    }

    setIsSaving(false);
    setSavedSuccess(true);
    markToolUsed();
    // Ask the browser to keep her journal rather than clear it under storage pressure.
    void requestPersistentStorage();

    // Keep her on this screen if urgent guidance is showing, so it is not lost.
    const urgent = evaluateUrgentTriggers({
      flow,
      symptomIds: Object.keys(selectedSymptoms),
      notes: journalText,
    });
    if (urgent.length === 0) {
      setTimeout(() => {
        router.push('/app/today/');
      }, 1000);
    }
  };

  // Symptoms she pinned (onboarding or the symptoms checklist) come first; otherwise the first six.
  const pinnedRaw = useSyncExternalStore(subscribeNoop, readPinned, () => '[]');
  const pinnedIds = useMemo<string[]>(() => {
    try {
      const v = JSON.parse(pinnedRaw);
      return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
    } catch {
      return [];
    }
  }, [pinnedRaw]);
  const pinned = STANDARD_SYMPTOMS.filter((s) => pinnedIds.includes(s.id));
  const primarySymptoms = pinned.length > 0 ? pinned : STANDARD_SYMPTOMS.slice(0, 6);
  const remainingSymptoms = STANDARD_SYMPTOMS.filter((s) => !primarySymptoms.includes(s));
  // A symptom already chosen stays visible even when the full list is folded away.
  const shownSymptoms = [
    ...primarySymptoms,
    ...remainingSymptoms.filter((s) => showMoreSymptoms || selectedSymptoms[s.id]),
  ];
  const chosenCount = Object.keys(selectedSymptoms).length;

  const urgentTriggers = evaluateUrgentTriggers({
    flow,
    symptomIds: Object.keys(selectedSymptoms),
    notes: journalText,
  });

  const isToday = selectedDate === todayStr;
  const extrasOn = [caffeine && 'caffeine', alcohol && 'alcohol', exercise && 'exercise'].filter(Boolean).length;

  return (
    <>
      <AppHeader
        title={isToday || !selectedDate ? 'Log today' : 'Edit a day'}
        subtitle={selectedDate ? longDay(selectedDate) : undefined}
        showBack
        backHref="/app/today/"
        showSettings={false}
      />

      <AppPage>
        {saveError && (
          <div role="alert" className="error-state">
            <strong>That didn’t save.</strong>
            <span>{saveError}</span>
          </div>
        )}

        {/* When and how long */}
        <div className="panel panel-quiet gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label htmlFor="checkin-date" className="label">
              Logging for
            </label>
            <input
              id="checkin-date"
              type="date"
              value={selectedDate}
              max={todayStr || undefined}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="input w-auto min-w-[11rem]"
            />
          </div>
          <QuickPick
            label="This entry covers"
            options={[
              { value: 1 as const, label: 'This day' },
              { value: 7 as const, label: 'The past 7 days' },
            ]}
            value={coversDays}
            onChange={setCoversDays}
          />
          {weekly && (
            <p className="hint">
              A weekly entry sums up the 7 days ending on the date above. Give your average sleep a night and the total
              hot flashes for the week.
            </p>
          )}
        </div>

        <Panel title={weekly ? 'How was your week overall?' : 'How are you feeling?'}>
          <LevelPicker label="Overall, from rough to great" levels={FEELINGS} value={overallFeeling} onChange={setOverallFeeling} />
        </Panel>

        <Panel
          title={weekly ? 'Hot flashes this week' : 'Hot flashes today'}
          hint={weekly ? 'Your best guess is fine.' : 'Tap + each time one happens, or add them up now.'}
        >
          <Stepper
            label={weekly ? 'Hot flashes this week' : 'Hot flashes today'}
            value={hotFlashCount}
            onChange={setHotFlashCount}
            unit={hotFlashCount === 1 ? 'hot flash' : 'hot flashes'}
            decreaseLabel="One fewer hot flash"
            increaseLabel="One more hot flash"
          />
        </Panel>

        <Panel
          title={weekly ? 'Sleep (average a night)' : 'Sleep last night'}
          hint={`${sleepHours} ${sleepHours === 1 ? 'hour' : 'hours'}`}
          action={
            <button type="button" className="btn btn-quiet btn-sm" aria-expanded={showSleepAdjust} onClick={() => setShowSleepAdjust((v) => !v)}>
              {showSleepAdjust ? 'Done' : 'Adjust'}
            </button>
          }
        >
          <QuickPick
            label="Hours of sleep"
            options={SLEEP_PICKS}
            columns={3}
            value={SLEEP_PICKS.some((p) => p.value === sleepHours) ? sleepHours : null}
            onChange={setSleepHours}
          />
          {showSleepAdjust && (
            <Stepper
              label="Hours of sleep"
              value={sleepHours}
              onChange={setSleepHours}
              min={0}
              max={14}
              step={0.5}
              unit="hours"
              decreaseLabel="Half an hour less"
              increaseLabel="Half an hour more"
            />
          )}
          {!weekly && (
            <QuickPick
              label="Did you wake in the night?"
              options={[
                { value: 'through' as const, label: 'Slept through' },
                { value: 'woke' as const, label: 'Woke in the night' },
              ]}
              value={wokeAtNight ? 'woke' : 'through'}
              onChange={(v) => setWokeAtNight(v === 'woke')}
            />
          )}
        </Panel>

        <Panel title="Bleeding or spotting">
          <QuickPick label="Bleeding or spotting" options={FLOWS} columns={3} value={flow} onChange={setFlow} />
        </Panel>

        <Panel
          title="Symptoms"
          hint={chosenCount ? `${chosenCount} chosen. Tap one again to remove it.` : 'Tap any you’ve had. Then say how strong.'}
        >
          <SymptomChips
            items={[
              ...shownSymptoms.map((s) => ({ id: s.id, name: s.name })),
              ...customSymptomsList.map((c) => ({ id: c.id, name: c.name, note: 'yours' })),
            ]}
            selected={selectedSymptoms}
            onToggle={toggleSymptom}
            onStrength={setSymptomStrength}
          />
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {remainingSymptoms.length > 0 && (
              <button type="button" className="btn btn-quiet btn-sm" aria-expanded={showMoreSymptoms} onClick={() => setShowMoreSymptoms(!showMoreSymptoms)}>
                {showMoreSymptoms ? 'Show fewer' : `Show all ${STANDARD_SYMPTOMS.length} symptoms`}
              </button>
            )}
            <button type="button" className="btn btn-quiet btn-sm" onClick={() => setShowAddCustomModal(true)}>
              <Icon.Plus width={18} height={18} />
              Add your own
            </button>
          </div>
        </Panel>

        <div className="accordion">
          <details open={extrasOn > 0 || undefined}>
            <summary>
              <span>
                Anything else today? <span className="font-normal text-[var(--ink-muted)]">(optional)</span>
              </span>
            </summary>
            <div className="accordion-body">
              <div className="chip-row" role="group" aria-label="Things that can affect symptoms">
                <button type="button" className="chip" aria-pressed={caffeine} onClick={() => setCaffeine(!caffeine)}>
                  Caffeine
                </button>
                <button type="button" className="chip" aria-pressed={alcohol} onClick={() => setAlcohol(!alcohol)}>
                  Alcohol
                </button>
                <button type="button" className="chip" aria-pressed={exercise} onClick={() => setExercise(!exercise)}>
                  Exercise
                </button>
              </div>
            </div>
          </details>
        </div>

        <div className="field">
          <label htmlFor="journal-input" className="label">
            Note <span className="font-normal text-[var(--ink-muted)]">(optional)</span>
          </label>
          <textarea
            id="journal-input"
            rows={3}
            value={journalText}
            onChange={(e) => setJournalText(e.target.value)}
            placeholder="Anything you want to remember for your doctor"
            className="textarea"
          />
        </div>

        {/* Urgent guidance: shown live, before saving, from the clinician-reviewed trigger file */}
        <UrgentGuidance triggers={urgentTriggers} />

        {/* Save: sticky, so it stays in reach above the bottom navigation on phones */}
        <div className="save-bar no-print">
          {savedSuccess ? (
            <p className="saved-note" role="status">
              <Icon.Check width={22} height={22} />
              Saved on this device.{urgentTriggers.length === 0 ? ' Taking you back to Today…' : ''}
            </p>
          ) : (
            <button type="button" className="btn btn-primary btn-lg btn-block" onClick={handleSave} disabled={isSaving} aria-busy={isSaving || undefined}>
              <Icon.Check width={22} height={22} />
              {weekly ? 'Save this week' : isToday ? 'Save today' : 'Save this day'}
            </button>
          )}
          <p className="flex items-center justify-center gap-1.5 text-center text-[0.95rem] text-[var(--ink-muted)]">
            <Icon.Lock width={15} height={15} />
            Saved only in this browser. Nothing is uploaded.
          </p>
        </div>
      </AppPage>

      {/* Add your own symptom */}
      <dialog
        ref={customDialog}
        className="sheet"
        aria-labelledby="custom-title"
        onClose={() => setShowAddCustomModal(false)}
        onClick={(e) => {
          if (e.target === customDialog.current) setShowAddCustomModal(false);
        }}
      >
        <div className="sheet-grip" aria-hidden="true" />
        <div className="sheet-head">
          <h2 id="custom-title" className="sheet-title">
            Add your own symptom
          </h2>
          <button type="button" className="icon-btn" aria-label="Close" onClick={() => setShowAddCustomModal(false)}>
            <Icon.Close width={22} height={22} />
          </button>
        </div>
        <form onSubmit={handleCreateCustomSymptom} className="sheet-body grid gap-4">
          <div className="field">
            <label htmlFor="custom-name" className="label">
              What do you call it?
            </label>
            <input
              id="custom-name"
              type="text"
              value={newCustomName}
              onChange={(e) => setNewCustomName(e.target.value)}
              placeholder="e.g. Tingling fingers"
              className="input"
            />
            <span className="hint">It’s saved on this device and added to your list.</span>
          </div>
          <div className="flex gap-3">
            <button type="submit" className="btn btn-primary flex-1" disabled={!newCustomName.trim()}>
              Add symptom
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => setShowAddCustomModal(false)}>
              Cancel
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
