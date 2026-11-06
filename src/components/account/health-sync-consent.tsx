'use client';

import React, { useState } from 'react';
import type { RetentionDays } from '@/lib/account/types';
import { SITE } from '@/lib/site/config';

interface HealthSyncConsentProps {
  userId: string;
  onConsentRecorded?: () => void;
  onDeclined?: () => void;
}

export function HealthSyncConsent({ userId, onConsentRecorded, onDeclined }: HealthSyncConsentProps) {
  const [retentionDays, setRetentionDays] = useState<RetentionDays | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!retentionDays) {
      setError('Please choose a data retention period. No option is selected by default.');
      return;
    }
    if (!agreed) {
      setError('Please tick the consent box to confirm you wish to sync your health data.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/user/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          retentionDays,
          consentVersion: 'v1.0-gdpr9',
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to record consent');
      }

      onConsentRecorded?.();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)] p-6 sm:p-8 max-w-2xl mx-auto space-y-6">
      <header className="space-y-2 border-b border-[var(--color-rule)] pb-4">
        <h2 className="font-serif text-2xl font-semibold text-[var(--color-ink)]">
          Health Data Storage &amp; Sync Consent
        </h2>
        <p className="text-sm text-[var(--color-ink-muted)]">
          This is separate from standard website terms. Your choice here does not affect your access to articles or
          on-device tracking tools.
        </p>
      </header>

      {/* 1. Exactly which data is stored and why */}
      <section className="space-y-2 text-sm text-[var(--color-ink)]">
        <h3 className="font-semibold text-base">1. Which data will be stored, and why?</h3>
        <p>
          If you consent, the symptoms, severity levels, notes, and cycle details you enter into the tracker will be
          encrypted and stored on our secure database server so you can access your history across devices.
        </p>
      </section>

      {/* 2. Keeping on device is the alternative */}
      <section className="space-y-2 text-sm text-[var(--color-ink)]">
        <h3 className="font-semibold text-base">2. Keeping data on your device is always free</h3>
        <p>
          You do not need to sync to use {SITE.name}. The symptom tracker, checklist, doctor reports, and all articles
          work fully on your device without sending any health details to our servers.
        </p>
      </section>

      {/* 3. Who processes it and where */}
      <section className="space-y-2 text-sm text-[var(--color-ink)]">
        <h3 className="font-semibold text-base">3. Processing and location</h3>
        <p>
          Data is processed by {SITE.legalEntity || SITE.name} using encrypted EU/UK compliant server infrastructure.
          Health data is never shared with advertisers, data brokers, or AI models without separate explicit choice.
        </p>
      </section>

      <form onSubmit={handleSubmit} className="space-y-6 pt-2">
        {/* 4. Required retention choice (NO preselected option) */}
        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold text-[var(--color-ink)]">
            4. Required retention period (Select one — no option is preselected):
          </legend>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {([10, 20, 30, 90] as const).map((days) => (
              <label
                key={days}
                className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border p-3 text-center transition-colors ${
                  retentionDays === days
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)] font-bold text-[var(--color-ink)]'
                    : 'border-[var(--color-rule)] bg-[var(--color-paper)] text-[var(--color-ink-muted)] hover:bg-[var(--color-paper-raised)]'
                }`}
              >
                <input
                  type="radio"
                  name="retention"
                  value={days}
                  checked={retentionDays === days}
                  onChange={() => setRetentionDays(days)}
                  className="sr-only"
                />
                <span className="text-lg">{days} days</span>
                <span className="text-xs">Auto-deleted after</span>
              </label>
            ))}
          </div>
          <p className="text-xs text-[var(--color-ink-muted)]">
            An automated deletion job runs daily to permanently remove records once they reach your chosen retention age.
          </p>
        </fieldset>

        {/* 5. How to change mind, export, or delete */}
        <section className="rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper)] p-4 text-xs text-[var(--color-ink-muted)] space-y-1">
          <p className="font-semibold text-[var(--color-ink)]">5. Your rights and controls:</p>
          <p>
            You can view your synced data, export it to JSON, change your retention window, withdraw your consent,
            or delete all records at any time from your account settings. Withdrawing consent instantly deletes all
            stored health data from our servers.
          </p>
        </section>

        {/* Consent box: unticked by default, cannot be bundled */}
        <div className="flex items-start gap-3">
          <input
            id="sync-consent-checkbox"
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-[var(--color-rule)] text-[var(--color-accent)]"
          />
          <label htmlFor="sync-consent-checkbox" className="text-xs text-[var(--color-ink)] leading-normal">
            <strong>Explicit Consent:</strong> I freely consent to {SITE.name} storing my sensitive health and symptom
            entries on secure servers for the retention period selected above. I understand I can withdraw this consent
            at any time without penalty.
          </label>
        </div>

        {error && <p className="text-xs font-semibold text-[var(--color-urgent)]">{error}</p>}

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="tap rounded-xl bg-[var(--color-accent)] px-6 py-2.5 text-sm font-semibold text-white no-underline hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? 'Recording consent...' : 'Confirm and enable server sync'}
          </button>
          <button
            type="button"
            onClick={onDeclined}
            className="tap rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper)] px-5 py-2.5 text-sm font-medium text-[var(--color-ink)] hover:bg-[var(--color-paper-raised)]"
          >
            Decline (keep data on device only)
          </button>
        </div>
      </form>
    </div>
  );
}
