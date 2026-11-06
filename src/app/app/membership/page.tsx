'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AppHeader } from '@/components/app/app-header';
import { PRICING } from '@/lib/config/pricing';

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');

  const selectedTier =
    billingCycle === 'annual' ? PRICING.annual : PRICING.monthly;

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader
        title="Membership"
        subtitle="Transparent, privacy-aligned plans"
        showBack={true}
        backHref="/app/today/"
        showPrivacyBadge={true}
        showSettings={false}
      />

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2 max-w-md mx-auto">
          <Badge variant="primary">Privacy Is Not an Upsell</Badge>
          <h1 className="text-2xl sm:text-3xl font-serif font-semibold text-[#231F1D]">
            Support independent, private health tools
          </h1>
          <p className="text-xs sm:text-sm text-[#554E48] leading-relaxed">
            Free users enjoy full local-first privacy. We never sell records to subsidize our product.
          </p>
        </div>

        {/* Billing cycle toggle */}
        <div className="flex items-center justify-center">
          <div className="inline-flex items-center p-1 bg-white rounded-2xl border border-[#E5DED5] gap-1 shadow-xs">
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                billingCycle === 'annual'
                  ? 'bg-[#965342] text-white shadow-xs'
                  : 'text-[#68615C] hover:text-[#231F1D]'
              }`}
            >
              Annual ({PRICING.annual.savingsLabel})
            </button>
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                billingCycle === 'monthly'
                  ? 'bg-[#965342] text-white shadow-xs'
                  : 'text-[#68615C] hover:text-[#231F1D]'
              }`}
            >
              Monthly
            </button>
          </div>
        </div>

        {/* Pricing Card */}
        <Card className="bg-white border-2 border-[#965342] p-6 sm:p-7 space-y-6 relative overflow-hidden shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#965342]">
                Full Membership
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-3xl sm:text-4xl font-serif font-bold text-[#231F1D]">
                  {selectedTier.formattedAmount}
                </span>
                <span className="text-xs text-[#68615C]">{selectedTier.periodLabel}</span>
              </div>
              {billingCycle === 'annual' && (
                <p className="text-xs text-[#2C6E49] font-medium mt-0.5">
                  Equivalent to just {PRICING.annual.monthlyEquivalent}/month
                </p>
              )}
            </div>

            <Badge variant="primary" className="text-xs">
              Includes {PRICING.trial.label}
            </Badge>
          </div>

          <p className="text-xs text-[#554E48] leading-relaxed border-t border-[#F0EBE3] pt-3">
            {selectedTier.description}
          </p>

          {/* Features */}
          <div className="space-y-2.5">
            <p className="text-xs font-semibold text-[#231F1D]">What’s included:</p>
            <ul className="space-y-2 text-xs text-[#3E3834]">
              {PRICING.features.premium.map((feat, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#2C6E49] shrink-0 mt-0.5" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Trial CTA button */}
          <div className="space-y-2 pt-2">
            <Button
              variant="primary"
              size="lg"
              fullWidth
              className="gap-2 text-sm font-semibold"
              onClick={() => {
                alert('Stripe subscription integration will be connected in Phase 7.');
              }}
            >
              <Sparkles className="w-4 h-4" />
              <span>Start {PRICING.trial.label}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
            <p className="text-xs text-center text-[#5C554F]">
              Cancel anytime with one click in Settings • Zero penalties
            </p>
          </div>
        </Card>

        {/* Free Tier Guarantee */}
        <Card variant="muted" className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#2C6E49]" />
            <h3 className="font-serif font-semibold text-sm text-[#231F1D]">
              Our Free Plan Guarantee
            </h3>
          </div>
          <p className="text-xs text-[#554E48] leading-relaxed">
            Unlike other wellness trackers that harvest data from free users, MenoVerdict&apos;s free plan includes full local tracking, timeline access, and appointment summaries with zero advertisements based on your health history.
          </p>
          <ul className="space-y-1.5 text-xs text-[#68615C]">
            {PRICING.features.free.map((feat, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#577060]" />
                <span>{feat}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
