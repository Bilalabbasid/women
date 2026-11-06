'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Flame,
  Moon,
  Clock,
  Check,
  Plus,
  Minus,
  CheckCircle2,
  HardDrive,
  Droplet,
  Coffee,
  Wine,
  Activity,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AppHeader } from '@/components/app/app-header';
import { STANDARD_SYMPTOMS } from '@/lib/config/symptoms';
import { LocalDataService } from '@/lib/db/service';
import { SeverityLevel, FlowLevel, LocalCustomSymptom } from '@/lib/db/schema';
import { evaluateUrgentTriggers } from '@/lib/safety/urgent-triggers';
import { UrgentGuidance } from '@/components/safety/urgent-guidance';
import { markToolUsed } from '@/lib/pwa/install-gate';

export default function CheckinPage() {
  const router = useRouter();

  // Primary state
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [overallFeeling, setOverallFeeling] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [journalText, setJournalText] = useState('');
  const [sleepHours, setSleepHours] = useState<number>(7);
  const [wokeAtNight, setWokeAtNight] = useState<boolean>(false);
  const [hotFlashCount, setHotFlashCount] = useState<number>(0);
  const [flow, setFlow] = useState<FlowLevel>('none');
  const [caffeine, setCaffeine] = useState(false);
  const [alcohol, setAlcohol] = useState(false);
  const [exercise, setExercise] = useState(false);

  // Progressive disclosure sections
  const [showMoreSymptoms, setShowMoreSymptoms] = useState(false);
  const [showLifestyle, setShowLifestyle] = useState(false);

  // Symptoms tracking
  const [selectedSymptoms, setSelectedSymptoms] = useState<{ [id: string]: number }>({});

  // Custom symptoms
  const [customSymptomsList, setCustomSymptomsList] = useState<LocalCustomSymptom[]>([]);
  const [showAddCustomModal, setShowAddCustomModal] = useState(false);
  const [newCustomName, setNewCustomName] = useState('');

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const feelings: Array<{ value: 1 | 2 | 3 | 4 | 5; label: string; desc: string }> = [
    { value: 1, label: 'Rough', desc: 'Very difficult' },
    { value: 2, label: 'Low', desc: 'Struggling' },
    { value: 3, label: 'Okay', desc: 'Manageable' },
    { value: 4, label: 'Good', desc: 'Steady' },
    { value: 5, label: 'Great', desc: 'Thriving' },
  ];

  const flows: Array<{ id: FlowLevel; label: string }> = [
    { id: 'none', label: 'None' },
    { id: 'spotting', label: 'Spotting' },
    { id: 'light', label: 'Light' },
    { id: 'medium', label: 'Medium' },
    { id: 'heavy', label: 'Heavy' },
  ];

  // Load existing check-in if editing
  useEffect(() => {
    async function loadData() {
      const custom = await LocalDataService.getCustomSymptoms();
      setCustomSymptomsList(custom);

      const existing = await LocalDataService.getCheckinByDate(selectedDate);
      if (existing) {
        setOverallFeeling(existing.overallFeeling);
        if (existing.notes) setJournalText(existing.notes);
        if (existing.sleepHours) setSleepHours(existing.sleepHours);
        if (typeof existing.wokeAtNight === 'boolean') setWokeAtNight(existing.wokeAtNight);
        if (typeof existing.hotFlashCount === 'number') setHotFlashCount(existing.hotFlashCount);
        if (existing.flow) setFlow(existing.flow);
        if (existing.lifestyle) {
          setCaffeine(!!existing.lifestyle.caffeine);
          setAlcohol(!!existing.lifestyle.alcohol);
          setExercise(!!existing.lifestyle.exercise);
        }

        const symMap: { [id: string]: number } = {};
        for (const s of existing.symptoms) {
          symMap[s.symptomId] = s.severity;
        }
        setSelectedSymptoms(symMap);
      }
    }
    loadData();
  }, [selectedDate]);

  const toggleSymptomSeverity = (id: string, severity: number) => {
    setSelectedSymptoms((prev) => {
      const copy = { ...prev };
      if (copy[id] === severity) {
        delete copy[id];
      } else {
        copy[id] = severity;
      }
      return copy;
    });
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
    setIsSaving(true);

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

    await LocalDataService.saveCheckin({
      date: selectedDate,
      overallFeeling,
      notes: journalText.trim() || undefined,
      sleepHours,
      wokeAtNight,
      hotFlashCount,
      flow,
      lifestyle: { caffeine, alcohol, exercise },
      symptoms: symptomEntries,
    });

    setIsSaving(false);
    setSavedSuccess(true);
    markToolUsed();

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

  // Pinned symptoms (top 6 standard symptoms) vs extended list
  const primarySymptoms = STANDARD_SYMPTOMS.slice(0, 6);
  const remainingSymptoms = STANDARD_SYMPTOMS.slice(6);

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader
        title="Daily Check-in"
        subtitle="Stored on this device"
        showBack={true}
        backHref="/app/today/"
        showPrivacyBadge={true}
        showSettings={false}
      />

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-5 space-y-6">
        {/* Saved confirmation toast */}
        {savedSuccess && (
          <div className="bg-[#EFF7F2] border border-[#CDE0D4] rounded-2xl p-4 flex items-center gap-3 text-sm text-[#2C6E49] animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-semibold">Check-in safely saved to your local device</p>
              <p className="text-xs text-[#3E5646]">Zero cloud transmission. Updating records...</p>
            </div>
          </div>
        )}

        {/* Date Selector */}
        <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-[#E5DED5]">
          <label htmlFor="checkin-date" className="text-xs font-semibold text-[#5C554F]">Logging for</label>
          <input
            id="checkin-date"
            type="date"
            value={selectedDate}
            max={todayStr}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-xs font-medium text-[#231F1D] bg-[#FAF8F5] px-3 py-1.5 rounded-xl border border-[#E5DED5] focus:outline-none focus:border-[#965342]"
          />
        </div>

        {/* Section 1: How are you feeling today? */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-serif font-semibold text-[#231F1D]">
              How are you feeling today?
            </label>
            <span className="text-xs text-[#68615C]">Overall baseline</span>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {feelings.map((f) => {
              const isSelected = overallFeeling === f.value;
              return (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setOverallFeeling(f.value)}
                  className={`py-2.5 px-1 rounded-2xl border text-center transition select-none active:scale-95 ${
                    isSelected
                      ? 'bg-[#965342] border-[#965342] text-white shadow-xs'
                      : 'bg-white border-[#E5DED5] text-[#554E48] hover:border-[#D0C7BC]'
                  }`}
                >
                  <p className="text-xs font-semibold">{f.label}</p>
                  <p className={`text-xs hidden sm:block ${isSelected ? 'text-white/80' : 'text-[#5C554F]'}`}>
                    {f.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Section 2: Vitals — Sleep & Hot Flashes */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Sleep Card */}
          <Card className="p-4 bg-white space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#231F1D] flex items-center gap-1.5">
                <Moon className="w-4 h-4 text-[#577060]" />
                Sleep Duration
              </span>
              <span className="text-xs font-bold text-[#965342]">{sleepHours} hrs</span>
            </div>

            <div className="flex items-center justify-between gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSleepHours((h) => Math.max(0, h - 0.5))}
                aria-label="Less sleep (half an hour)"
                className="w-10 h-10 p-0 rounded-xl"
              >
                <Minus className="w-4 h-4" />
              </Button>

              <span className="font-serif font-semibold text-lg text-[#231F1D]">
                {sleepHours}h
              </span>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSleepHours((h) => Math.min(14, h + 0.5))}
                aria-label="More sleep (half an hour)"
                className="w-10 h-10 p-0 rounded-xl"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <button
              type="button"
              onClick={() => setWokeAtNight(!wokeAtNight)}
              className={`w-full text-xs py-2 px-2.5 rounded-xl border flex items-center justify-center gap-1.5 transition ${
                wokeAtNight
                  ? 'bg-[#F7EFEA] border-[#E8D4C8] text-[#965342] font-semibold'
                  : 'bg-[#FAF8F5] border-[#E5DED5] text-[#68615C]'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{wokeAtNight ? 'Woke during night (2–4 AM)' : 'Slept through the night'}</span>
            </button>
          </Card>

          {/* Hot Flash Counter */}
          <Card className="p-4 bg-white space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#231F1D] flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-[#965342]" />
                Hot Flashes Today
              </span>
              <span className="text-xs font-bold text-[#965342]">{hotFlashCount} total</span>
            </div>

            <div className="flex items-center justify-between gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setHotFlashCount((c) => Math.max(0, c - 1))}
                aria-label="One fewer hot flash"
                className="w-10 h-10 p-0 rounded-xl"
              >
                <Minus className="w-4 h-4" />
              </Button>

              <span className="font-serif font-semibold text-lg text-[#231F1D]">
                {hotFlashCount}
              </span>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setHotFlashCount((c) => c + 1)}
                aria-label="One more hot flash"
                className="w-10 h-10 p-0 rounded-xl"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <p className="text-xs text-center text-[#5C554F] pt-1">
              Tap + anytime a flash or flush occurs.
            </p>
          </Card>
        </section>

        {/* Section 3: Cycle / Bleeding Observation */}
        <section className="space-y-2">
          <label className="text-sm font-serif font-semibold text-[#231F1D] flex items-center gap-1.5">
            <Droplet className="w-4 h-4 text-[#965342]" />
            Bleeding / Cycle Observation
          </label>
          <div className="grid grid-cols-5 gap-2">
            {flows.map((fl) => {
              const isSelected = flow === fl.id;
              return (
                <button
                  key={fl.id}
                  type="button"
                  onClick={() => setFlow(fl.id)}
                  className={`py-2 px-1 rounded-xl border text-xs font-medium transition text-center ${
                    isSelected
                      ? 'bg-[#965342] border-[#965342] text-white shadow-xs'
                      : 'bg-white border-[#E5DED5] text-[#554E48] hover:border-[#D0C7BC]'
                  }`}
                >
                  {fl.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* Section 4: Primary Symptoms Severity (1-5) */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-serif font-semibold text-[#231F1D]">
                Key Symptoms & Severity
              </h2>
              <p className="text-xs text-[#68615C]">1 = Mild • 5 = Severe • Tap again to deselect</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAddCustomModal(true)}
              className="text-xs gap-1 min-h-[44px] px-2.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Custom</span>
            </Button>
          </div>

          <div className="space-y-2.5">
            {/* Primary standard symptoms */}
            {primarySymptoms.map((symptom) => {
              const currentSeverity = selectedSymptoms[symptom.id] || 0;
              return (
                <Card key={symptom.id} className="p-3.5 bg-white">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-[#231F1D]">{symptom.name}</p>
                      <p className="text-xs text-[#5C554F]">{symptom.categoryLabel}</p>
                    </div>
                    {currentSeverity > 0 ? (
                      <Badge variant="primary" className="text-xs">
                        Level {currentSeverity}/5
                      </Badge>
                    ) : (
                      <span className="text-xs text-[#5C554F]">None</span>
                    )}
                  </div>

                  <div className="grid grid-cols-5 gap-1.5">
                    {[1, 2, 3, 4, 5].map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => toggleSymptomSeverity(symptom.id, lvl)}
                        className={`h-9 rounded-lg border text-xs font-semibold flex items-center justify-center transition active:scale-95 ${
                          currentSeverity === lvl
                            ? 'bg-[#965342] border-[#965342] text-white shadow-xs'
                            : 'bg-[#FAF8F5] border-[#E5DED5] text-[#68615C] hover:border-[#D0C7BC]'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </Card>
              );
            })}

            {/* Custom user symptoms */}
            {customSymptomsList.map((cs) => {
              const currentSeverity = selectedSymptoms[cs.id] || 0;
              return (
                <Card key={cs.id} className="p-3.5 bg-white border-l-4 border-l-[#577060]">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-[#231F1D]">{cs.name}</p>
                      <p className="text-xs text-[#577060]">Custom Symptom</p>
                    </div>
                    {currentSeverity > 0 ? (
                      <Badge variant="secondary" className="text-xs">
                        Level {currentSeverity}/5
                      </Badge>
                    ) : (
                      <span className="text-xs text-[#5C554F]">None</span>
                    )}
                  </div>

                  <div className="grid grid-cols-5 gap-1.5">
                    {[1, 2, 3, 4, 5].map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => toggleSymptomSeverity(cs.id, lvl)}
                        className={`h-9 rounded-lg border text-xs font-semibold flex items-center justify-center transition active:scale-95 ${
                          currentSeverity === lvl
                            ? 'bg-[#577060] border-[#577060] text-white shadow-xs'
                            : 'bg-[#FAF8F5] border-[#E5DED5] text-[#68615C] hover:border-[#D0C7BC]'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </Card>
              );
            })}

            {/* Progressive Disclosure: More symptoms */}
            {showMoreSymptoms &&
              remainingSymptoms.map((symptom) => {
                const currentSeverity = selectedSymptoms[symptom.id] || 0;
                return (
                  <Card key={symptom.id} className="p-3.5 bg-white">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-medium text-[#231F1D]">{symptom.name}</p>
                        <p className="text-xs text-[#5C554F]">{symptom.categoryLabel}</p>
                      </div>
                      {currentSeverity > 0 && (
                        <Badge variant="primary" className="text-xs">
                          Level {currentSeverity}/5
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-5 gap-1.5">
                      {[1, 2, 3, 4, 5].map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => toggleSymptomSeverity(symptom.id, lvl)}
                          className={`h-9 rounded-lg border text-xs font-semibold flex items-center justify-center transition active:scale-95 ${
                            currentSeverity === lvl
                              ? 'bg-[#965342] border-[#965342] text-white shadow-xs'
                              : 'bg-[#FAF8F5] border-[#E5DED5] text-[#68615C] hover:border-[#D0C7BC]'
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </Card>
                );
              })}

            <button
              type="button"
              onClick={() => setShowMoreSymptoms(!showMoreSymptoms)}
              className="w-full py-2.5 text-xs text-[#965342] font-semibold flex items-center justify-center gap-1.5 bg-[#FAF8F5] border border-[#E5DED5] rounded-xl hover:bg-[#F3EFEA] transition"
            >
              <span>{showMoreSymptoms ? 'Show Fewer Symptoms' : `Show All ${STANDARD_SYMPTOMS.length} Symptoms`}</span>
              {showMoreSymptoms ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </section>

        {/* Section 5: Optional Lifestyle Factors (Progressive Disclosure) */}
        <section className="space-y-2">
          <button
            type="button"
            onClick={() => setShowLifestyle(!showLifestyle)}
            className="w-full flex items-center justify-between text-xs text-[#68615C] font-semibold py-1 hover:text-[#231F1D]"
          >
            <span className="flex items-center gap-1.5">
              <Activity className="w-4 h-4" />
              Optional Lifestyle Observations
            </span>
            {showLifestyle ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showLifestyle && (
            <Card className="p-3.5 bg-white grid grid-cols-3 gap-2 animate-in fade-in">
              <button
                type="button"
                onClick={() => setCaffeine(!caffeine)}
                className={`p-2.5 rounded-xl border text-xs flex flex-col items-center gap-1 transition ${
                  caffeine ? 'bg-[#F7EFEA] border-[#965342] text-[#965342] font-semibold' : 'border-[#E5DED5] text-[#68615C]'
                }`}
              >
                <Coffee className="w-4 h-4" />
                <span>Caffeine</span>
              </button>

              <button
                type="button"
                onClick={() => setAlcohol(!alcohol)}
                className={`p-2.5 rounded-xl border text-xs flex flex-col items-center gap-1 transition ${
                  alcohol ? 'bg-[#F7EFEA] border-[#965342] text-[#965342] font-semibold' : 'border-[#E5DED5] text-[#68615C]'
                }`}
              >
                <Wine className="w-4 h-4" />
                <span>Alcohol</span>
              </button>

              <button
                type="button"
                onClick={() => setExercise(!exercise)}
                className={`p-2.5 rounded-xl border text-xs flex flex-col items-center gap-1 transition ${
                  exercise ? 'bg-[#EDF3EF] border-[#577060] text-[#577060] font-semibold' : 'border-[#E5DED5] text-[#68615C]'
                }`}
              >
                <Activity className="w-4 h-4" />
                <span>Exercise</span>
              </button>
            </Card>
          )}
        </section>

        {/* Section 6: Talk or Type Free-Form Journal Notes */}
        <section className="space-y-2">
          <label htmlFor="journal-input" className="text-sm font-serif font-semibold text-[#231F1D]">
            Personal Notes & Observations
          </label>
          <Card className="p-3 bg-white">
            <textarea
              id="journal-input"
              rows={3}
              value={journalText}
              onChange={(e) => setJournalText(e.target.value)}
              placeholder="e.g. Morning was calm, headache started around 2 PM..."
              className="w-full text-sm text-[#231F1D] placeholder:text-[#6B645E] bg-transparent resize-none border-none focus:outline-none leading-relaxed"
            />
          </Card>
        </section>

        {/* Urgent guidance: shown live, before saving, from the clinician-reviewed trigger file */}
        <UrgentGuidance
          triggers={evaluateUrgentTriggers({
            flow,
            symptomIds: Object.keys(selectedSymptoms),
            notes: journalText,
          })}
        />

        {/* Bottom Save Action */}
        <div className="pt-2 pb-8 space-y-3">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={handleSave}
            disabled={isSaving || savedSuccess}
            className="gap-2 text-base font-semibold"
          >
            <Check className="w-5 h-5 stroke-[2.5]" />
            <span>{isSaving ? 'Saving...' : 'Save to This Device'}</span>
          </Button>

          <p className="text-center text-xs text-[#5C554F] flex items-center justify-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-[#2C6E49]" />
            Stored on this device • Zero cloud transmission
          </p>
        </div>
      </div>

      {/* Add Custom Symptom Modal */}
      {showAddCustomModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-[#E5DED5] space-y-4">
            <h3 className="font-serif font-bold text-lg text-[#231F1D]">
              Add Custom Symptom
            </h3>
            <p className="text-xs text-[#68615C]">
              Create a custom symptom specific to your experience. It will be saved locally on this device.
            </p>

            <form onSubmit={handleCreateCustomSymptom} className="space-y-4 pt-1">
              <input
                type="text"
                value={newCustomName}
                onChange={(e) => setNewCustomName(e.target.value)}
                placeholder="e.g. Tingling in fingers, Heart flutters..."
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E5DED5] focus:outline-none focus:border-[#965342]"
                autoFocus
              />

              <div className="flex gap-2">
                <Button type="submit" variant="primary" fullWidth size="sm">
                  Add Symptom
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  fullWidth
                  size="sm"
                  onClick={() => setShowAddCustomModal(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
