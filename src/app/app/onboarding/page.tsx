'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Check,
  ArrowRight,
  HardDrive,
  ChevronLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { STANDARD_SYMPTOMS } from '@/lib/config/symptoms';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  // Nothing pre-selected: only symptoms she picks are pinned (DECISIONS.md D-006).
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);

  const toggleSymptom = (id: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleFinish = () => {
    try {
      localStorage.setItem('menowell_onboarding_completed', 'true');
      // Add to any symptoms she already pinned (e.g. from the symptoms checklist); never replace them.
      const existing: unknown = JSON.parse(localStorage.getItem('menowell_pinned_symptoms') ?? '[]');
      const kept = Array.isArray(existing) ? existing.filter((x): x is string => typeof x === 'string') : [];
      localStorage.setItem('menowell_pinned_symptoms', JSON.stringify([...new Set([...kept, ...selectedSymptoms])]));
    } catch {
      // Storage blocked: the tracker still works, pins just aren't remembered.
    }
    router.push('/app/today/');
  };

  return (
    <div className="min-h-screen bg-[#F7F6F2] flex flex-col justify-between max-w-xl mx-auto px-4 py-6">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-6">
        {step > 1 ? (
          <button
            onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
            className="flex items-center gap-1 text-xs text-[#68615C] hover:text-[#231F1D] p-1"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        ) : (
          <div className="w-12" />
        )}

        <div className="flex items-center gap-1.5">
          <div className={`h-1.5 rounded-full transition-all ${step >= 1 ? 'w-6 bg-[#1F5A4C]' : 'w-2 bg-[#E5DED5]'}`} />
          <div className={`h-1.5 rounded-full transition-all ${step >= 2 ? 'w-6 bg-[#1F5A4C]' : 'w-2 bg-[#E5DED5]'}`} />
          <div className={`h-1.5 rounded-full transition-all ${step >= 3 ? 'w-6 bg-[#1F5A4C]' : 'w-2 bg-[#E5DED5]'}`} />
        </div>

        <button
          onClick={handleFinish}
          className="text-xs text-[#68615C] hover:text-[#231F1D] underline font-medium"
        >
          Skip to App
        </button>
      </div>

      {/* Step 1: Storage Mode Choice */}
      {step === 1 && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div>
            <Badge variant="primary" className="mb-2">Step 1 of 3 • Privacy First</Badge>
            <h1 className="text-2xl sm:text-3xl font-serif font-semibold text-[#231F1D] mb-2">
              Where your health records live
            </h1>
            <p className="text-sm text-[#554E48] leading-relaxed">
              Your health journal belongs to you alone. Here is exactly where it is kept.
            </p>
          </div>

          <div className="space-y-3">
            <div className="rounded-2xl border-2 border-[#1F5A4C] bg-[#FDF9F7] p-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-[#1F5A4C] text-white">
                  <HardDrive className="w-5 h-5" />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-sm text-[#231F1D]">In this browser, on this device</p>
                    <Badge variant="success">No account</Badge>
                  </div>
                  <p className="text-xs text-[#554E48] leading-relaxed">
                    Everything you log is saved in this browser&apos;s own storage. Nothing is uploaded, and nothing is
                    deleted automatically. It stays until you delete it.
                  </p>
                  <p className="text-xs text-[#5C554F] bg-[#EEF1EF] p-2 rounded-lg leading-relaxed">
                    It isn&apos;t synced to other devices or browsers, and clearing your browsing data or using private
                    browsing can remove it. You can download a backup and restore it any time from Settings → Manage
                    storage.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Pinned Symptoms */}
      {step === 2 && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div>
            <Badge variant="secondary" className="mb-2">Step 2 of 3 • Custom Experience</Badge>
            <h1 className="text-2xl sm:text-3xl font-serif font-semibold text-[#231F1D] mb-2">
              What would you like to keep handy?
            </h1>
            <p className="text-sm text-[#554E48] leading-relaxed">
              Select symptoms you frequently notice or wish to observe. You can always add custom symptoms or adjust these later.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[50vh] overflow-y-auto pr-1">
            {STANDARD_SYMPTOMS.map((symptom) => {
              const isSelected = selectedSymptoms.includes(symptom.id);
              return (
                <button
                  key={symptom.id}
                  onClick={() => toggleSymptom(symptom.id)}
                  type="button"
                  className={`flex items-center justify-between p-3.5 rounded-xl border text-left text-xs transition-all ${
                    isSelected
                      ? 'border-[#1F5A4C] bg-[#E6EFEB] text-[#231F1D] font-medium'
                      : 'border-[#E5DED5] bg-white text-[#554E48] hover:border-[#D0C7BC]'
                  }`}
                >
                  <div>
                    <p className="font-medium text-sm">{symptom.name}</p>
                    <p className="text-xs text-[#68615C] mt-0.5">{symptom.categoryLabel}</p>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                      isSelected
                        ? 'bg-[#1F5A4C] border-[#1F5A4C] text-white'
                        : 'border-[#D9D1C7]'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 3: Gentle Completion */}
      {step === 3 && (
        <div className="space-y-6 animate-in fade-in duration-200 text-center py-4">
          <div className="w-16 h-16 rounded-2xl bg-[#EDF3EF] text-[#2C6E49] flex items-center justify-center mx-auto shadow-xs">
            <ShieldCheck className="w-8 h-8" />
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-serif font-semibold text-[#231F1D] mb-2">
              Your journal is ready
            </h1>
            <p className="text-sm text-[#554E48] leading-relaxed max-w-sm mx-auto">
              Everything you log stays private on this device. You can track symptoms in seconds, review longitudinal trends, and prepare concise reports for your clinician.
            </p>
          </div>

          <Card variant="muted" className="text-left text-xs space-y-2 max-w-sm mx-auto p-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5DED5]">
              <span className="text-[#68615C]">Stored:</span>
              <span className="font-semibold text-[#231F1D]">This browser, this device</span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-[#E5DED5]">
              <span className="text-[#68615C]">Selected Symptoms:</span>
              <span className="font-semibold text-[#231F1D]">{selectedSymptoms.length} pinned</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#68615C]">Account Required:</span>
              <span className="font-semibold text-[#2C6E49]">None</span>
            </div>
          </Card>
        </div>
      )}

      {/* Bottom Actions */}
      <div className="pt-6 border-t border-[#E5DED5] flex items-center justify-between gap-3">
        {step < 3 ? (
          <Button
            variant="primary"
            fullWidth
            onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3)}
            className="gap-2 text-sm"
          >
            <span>Continue</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            variant="primary"
            fullWidth
            onClick={handleFinish}
            className="gap-2 text-sm"
          >
            <span>Open My Journal</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
