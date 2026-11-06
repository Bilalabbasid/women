'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AppHeader } from '@/components/app/app-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { RetentionDays } from '@/lib/account/types';

const RETENTION_OPTIONS: RetentionDays[] = [10, 20, 30, 90];

export default function AccountPage() {
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [consentGiven, setConsentGiven] = useState(false);
  const [retentionDays, setRetentionDays] = useState<RetentionDays>(30);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    try {
      const res = await fetch('/api/auth/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as { user?: { id: string; email: string }; error?: string };
      if (!res.ok || !data.user) {
        setStatusMsg(data.error ?? 'Could not sign in right now.');
        return;
      }
      setUserId(data.user.id);
      setStatusMsg(`Signed in as ${data.user.email}. Health logs remain on this device unless you give separate sync consent below.`);
    } catch {
      setStatusMsg('Account service is running in local-only mode.');
    }
  };

  const handleSaveConsent = async () => {
    if (!userId) return;
    setStatusMsg(null);
    try {
      if (consentGiven) {
        const res = await fetch('/api/user/consent/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            retentionDays,
            consentWordingsVersion: 'v1.0-gdpr9',
          }),
        });
        if (res.ok) {
          setStatusMsg(`Explicit health-data sync consent saved with ${retentionDays}-day automatic expiry.`);
        }
      } else {
        const res = await fetch('/api/user/consent/', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        });
        if (res.ok) {
          setStatusMsg('Consent withdrawn and any synced health records have been deleted.');
        }
      }
    } catch {
      setStatusMsg('Could not update consent right now.');
    }
  };

  const handleExport = async () => {
    if (!userId) return;
    try {
      const res = await fetch(`/api/user/export/?userId=${encodeURIComponent(userId)}`);
      if (!res.ok) return;
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `menoverdict-account-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setStatusMsg('Could not export synced data right now.');
    }
  };

  const handleDeleteAccount = async () => {
    if (!userId) return;
    setStatusMsg(null);
    try {
      const res = await fetch('/api/user/delete-account/', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        setUserId(null);
        setEmail('');
        setConsentGiven(false);
        setStatusMsg('Your account, consent records, and any synced health data have been permanently deleted.');
      }
    } catch {
      setStatusMsg('Could not delete account right now.');
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader
        title="Account & Sync Consent"
        subtitle="Optional cross-device sync with automatic retention expiry"
        showPrivacyBadge={false}
        showSettings={true}
      />

      <div className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-4 py-6">
        <Card className="space-y-3 bg-[#FAF6F0] p-5">
          <h2 className="font-serif text-xl font-semibold text-[#231F1D]">
            No account is needed to read or use tools
          </h2>
          <p className="text-sm text-[#554E48]">
            By default, every symptom entry and tool answer stays on your device in your browser. Creating an account
            holds only your email for login — it never uploads your health data unless you give separate, explicit
            special-category consent below.
          </p>
        </Card>

        {!userId ? (
          <Card className="space-y-4 bg-white p-5">
            <h2 className="font-serif text-xl font-semibold text-[#231F1D]">Sign in or create an account</h2>
            <form onSubmit={handleSignIn} className="space-y-3">
              <div>
                <label htmlFor="account-email" className="block text-sm font-semibold text-[#231F1D]">
                  Email address
                </label>
                <input
                  id="account-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="mt-1 min-h-[44px] w-full rounded-xl border border-[#D8CFC4] px-3"
                />
              </div>
              <Button type="submit">Continue</Button>
            </form>
          </Card>
        ) : (
          <Card className="space-y-4 bg-white p-5">
            <h2 className="font-serif text-xl font-semibold text-[#231F1D]">
              Separate consent for syncing health data
            </h2>
            <label className="flex cursor-pointer items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={consentGiven}
                onChange={(e) => setConsentGiven(e.target.checked)}
                className="mt-1 h-5 w-5 shrink-0"
              />
              <span>
                I explicitly consent to MenoVerdict storing my encrypted symptom and tool records so I can access them
                across devices. I understand I can withdraw this consent at any time and that records automatically
                expire after the retention period I choose below.
              </span>
            </label>

            <div>
              <label htmlFor="retention-select" className="block text-sm font-semibold text-[#231F1D]">
                Automatic deletion (retention window)
              </label>
              <select
                id="retention-select"
                value={retentionDays}
                onChange={(e) => setRetentionDays(Number(e.target.value) as RetentionDays)}
                className="mt-1 min-h-[44px] rounded-xl border border-[#D8CFC4] bg-white px-3"
              >
                {RETENTION_OPTIONS.map((days) => (
                  <option key={days} value={days}>
                    Delete synced records after {days} days
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <Button type="button" onClick={handleSaveConsent}>
                Save consent preference
              </Button>
              <Button type="button" variant="outline" onClick={handleExport}>
                Export synced data (JSON)
              </Button>
              <Button type="button" variant="danger" onClick={handleDeleteAccount}>
                Delete my account &amp; data
              </Button>
            </div>
          </Card>
        )}

        {statusMsg && (
          <p role="status" className="rounded-xl border border-[#D8CFC4] bg-white p-4 text-sm text-[#231F1D]">
            {statusMsg}
          </p>
        )}

        <p className="text-sm text-[#554E48]">
          To manage data stored only in this browser, visit the{' '}
          <Link href="/app/privacy/" className="font-semibold underline">
            On-Device Privacy Center
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

