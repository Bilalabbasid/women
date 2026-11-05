import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Calendar,
  Pill,
  Stethoscope,
  ArrowRight,
  CheckCircle2,
  Lock,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { APP_CONFIG } from '@/lib/config/constants';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Top Navigation */}
      <header className="border-b border-[#EBE3D8] bg-[#FAF8F5]/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#965342] flex items-center justify-center shadow-xs">
              <span className="text-white font-serif font-bold text-base">M</span>
            </div>
            <span className="font-serif font-semibold text-lg text-[#231F1D] tracking-tight">
              MenoWell
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <Link href="/privacy-center">
              <Button variant="ghost" size="sm" className="hidden sm:inline-flex text-xs">
                Privacy Policy
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="ghost" size="sm" className="hidden sm:inline-flex text-xs">
                Pricing
              </Button>
            </Link>
            <Link href="/onboarding">
              <Button variant="primary" size="sm" className="text-xs px-4">
                Start Privately
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-4 pt-12 pb-16 max-w-3xl mx-auto text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#EDF3EF] text-[#2C6E49] border border-[#CFDFD5] mb-6">
          <ShieldCheck className="w-3.5 h-3.5 text-[#2C6E49]" />
          <span>Local-First Health Companion • No Account Required</span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-semibold text-[#231F1D] tracking-tight leading-[1.15] mb-5">
          Your body isn’t our <br className="hidden sm:inline" />
          <span className="text-[#965342] italic">business model.</span>
        </h1>

        <p className="text-base sm:text-lg text-[#554E48] leading-relaxed max-w-xl mx-auto mb-8 font-normal">
          A calm, private companion for navigating perimenopause and midlife health changes.
          Track symptoms, remember treatments, and walk into doctor appointments prepared.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-md mx-auto mb-10">
          <Link href="/onboarding" className="w-full sm:w-auto">
            <Button size="lg" variant="primary" fullWidth className="gap-2 text-base px-7">
              <span>Start Privately</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button size="lg" variant="outline" fullWidth className="text-base px-6">
              Open Demo Journal
            </Button>
          </Link>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs text-[#68615C]">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#2C6E49]" />
            Saved directly to your device
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#2C6E49]" />
            Zero health data sold or tracked
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#2C6E49]" />
            Works completely offline
          </span>
        </div>
      </section>

      {/* Core Flow: Talk -> Track -> Understand -> Prepare */}
      <section className="px-4 py-12 bg-white border-y border-[#EBE3D8]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <Badge variant="primary" className="mb-2">The Flow</Badge>
            <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-[#231F1D]">
              Designed to reduce mental burden
            </h2>
            <p className="text-sm text-[#68615C] mt-1.5">
              Midlife health shouldn&apos;t require filling out 50 clinical checkboxes every evening.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card variant="muted" className="p-5">
              <div className="w-9 h-9 rounded-xl bg-[#F7EFEA] text-[#965342] flex items-center justify-center mb-3">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-semibold text-base text-[#231F1D] mb-1">
                1. Talk or Type Quickly
              </h3>
              <p className="text-xs text-[#68615C] leading-relaxed">
                Log in 30 seconds: <em>&quot;Woke at 3 AM hot, headache this morning, patch changed yesterday.&quot;</em> Quick, natural, effortless.
              </p>
            </Card>

            <Card variant="muted" className="p-5">
              <div className="w-9 h-9 rounded-xl bg-[#EDF3EF] text-[#2C6E49] flex items-center justify-center mb-3">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-semibold text-base text-[#231F1D] mb-1">
                2. See Longitudinal Patterns
              </h3>
              <p className="text-xs text-[#68615C] leading-relaxed">
                Review 30, 60, or 90 days. See how sleep quality aligns with hot flash spikes or cycle shifts over time.
              </p>
            </Card>

            <Card variant="muted" className="p-5">
              <div className="w-9 h-9 rounded-xl bg-[#F7EFEA] text-[#965342] flex items-center justify-center mb-3">
                <Pill className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-semibold text-base text-[#231F1D] mb-1">
                3. Treatment & HRT Companion
              </h3>
              <p className="text-xs text-[#68615C] leading-relaxed">
                Remember patch change days, progesterone schedules, and supplements without mental clutter or reminders lost in alerts.
              </p>
            </Card>

            <Card variant="muted" className="p-5">
              <div className="w-9 h-9 rounded-xl bg-[#EFF5F0] text-[#3E6B89] flex items-center justify-center mb-3">
                <Stethoscope className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-semibold text-base text-[#231F1D] mb-1">
                4. Doctor Mode Dossier
              </h3>
              <p className="text-xs text-[#68615C] leading-relaxed">
                Turn weeks of scattered notes into a clean, respectful 1-page clinician summary with your exact questions organized.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Privacy Guarantee Section */}
      <section className="px-4 py-14 max-w-3xl mx-auto">
        <div className="bg-[#FAF6F0] rounded-3xl p-6 sm:p-8 border border-[#E5DCD0]">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <div className="w-12 h-12 rounded-2xl bg-[#965342] text-white flex items-center justify-center shrink-0">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-serif font-semibold text-[#231F1D] mb-2">
                True privacy. Not marketing jargon.
              </h2>
              <p className="text-sm text-[#554E48] leading-relaxed mb-4">
                Most health apps monetize your intimate records through data brokers or advertising SDKs. MenoWell operates differently:
              </p>
              <ul className="space-y-2 text-xs sm:text-sm text-[#3E3834] mb-6">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#965342]" />
                  <span><strong>Device-First Storage:</strong> Your health records live in your browser&apos;s IndexedDB.</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#965342]" />
                  <span><strong>Zero Health Advertising:</strong> We never transmit your symptoms or HRT to ad platforms.</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#965342]" />
                  <span><strong>No Forced Signups:</strong> Start logging today without providing an email address.</span>
                </li>
              </ul>

              <Link href="/privacy-center">
                <Button variant="outline" size="sm" className="text-xs">
                  Inspect the Privacy Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-[#EBE3D8] bg-[#F7F4EE] px-4 py-8 text-xs text-[#68615C]">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <p className="font-serif font-semibold text-sm text-[#231F1D]">
              MenoWell
            </p>
            <div className="flex items-center gap-4">
              <Link href="/privacy-center" className="hover:text-[#231F1D] underline">
                Privacy Center
              </Link>
              <Link href="/pricing" className="hover:text-[#231F1D] underline">
                Pricing
              </Link>
              <Link href="/settings" className="hover:text-[#231F1D] underline">
                Settings
              </Link>
            </div>
          </div>

          <p className="text-[11px] text-[#7A736E] leading-relaxed pt-2 border-t border-[#E6DFD5]">
            {APP_CONFIG.medicalDisclaimer}
          </p>
        </div>
      </footer>
    </div>
  );
}
