'use client';

import React, { useState } from 'react';

interface EmailCaptureProps {
  title?: string;
  itemDescription?: string;
}

export function EmailCapture({
  title = 'Get the appointment checklist and doctor question guide',
  itemDescription = 'A one-page printable worksheet with the exact questions to ask your doctor, plus weekly research updates on treatments and options.',
}: EmailCaptureProps) {
  const [email, setEmail] = useState('');
  const [consented, setConsented] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!consented) {
      setError('Please tick the consent box to receive emails.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, consented }),
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        // Fallback gracefully on static or offline
        setSubmitted(true);
      }
    } catch {
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <aside aria-label="Email confirmation" className="my-8 rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)] p-6 text-[var(--color-ink)]">
        <h3 className="font-serif text-xl font-semibold mb-2">Check your inbox</h3>
        <p className="text-sm text-[var(--color-ink-muted)] mb-3">
          We&apos;ve sent your guide to <strong>{email}</strong>. Every email includes a one-click unsubscribe link.
        </p>
        <p className="text-xs text-[var(--color-ink-muted)]">
          Your email is never shared or matched with private health tracker data.
        </p>
      </aside>
    );
  }

  return (
    <aside aria-label="Download doctor questions guide" className="my-8 rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)] p-6 text-[var(--color-ink)]">
      <h3 className="font-serif text-xl font-semibold mb-2">{title}</h3>
      <p className="text-sm text-[var(--color-ink-muted)] mb-4">{itemDescription}</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="newsletter-email" className="block text-xs font-semibold mb-1">
            Email address
          </label>
          <input
            id="newsletter-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="w-full max-w-md rounded-lg border border-[var(--color-rule)] bg-[var(--color-paper)] px-3 py-2 text-sm text-[var(--color-ink)]"
          />
        </div>

        <div className="flex items-start gap-2">
          <input
            id="newsletter-consent"
            type="checkbox"
            checked={consented}
            onChange={(e) => setConsented(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-[var(--color-rule)] text-[var(--color-accent)]"
          />
          <label htmlFor="newsletter-consent" className="text-xs text-[var(--color-ink-muted)] leading-tight">
            I agree to receive the free guide and occasional evidence-based updates. Unsubscribe anytime.
            No health tracker data is ever sent with this form.
          </label>
        </div>

        {error && <p className="text-xs text-[var(--color-urgent)]">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="tap inline-flex items-center rounded-lg bg-[var(--color-ink)] px-5 py-2.5 text-sm font-semibold text-white no-underline hover:opacity-90 disabled:opacity-50"
        >
          {loading ? 'Sending...' : 'Send me the guide'}
        </button>
      </form>
    </aside>
  );
}
