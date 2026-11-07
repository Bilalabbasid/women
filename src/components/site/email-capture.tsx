'use client';

import React, { useEffect, useRef, useState } from 'react';
import { CONSENT_TEXT, FORM_ERROR, NEWSLETTER_TITLE, type FormType } from '@/lib/forms/subscribe';

const boxClass = 'my-8 rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)] p-6 text-[var(--color-ink)]';
const inputClass =
  'w-full max-w-md rounded-lg border border-[var(--color-rule)] bg-[var(--color-paper)] px-3 py-2 text-[var(--color-ink)]';
const buttonClass =
  'tap inline-flex items-center rounded-lg bg-[var(--color-ink)] px-5 py-2.5 font-semibold text-white no-underline hover:opacity-90 disabled:opacity-50';

/**
 * Shared submit logic for the two forms. Sends only what the person typed; the
 * honeypot and the time since the form appeared are the anti-spam checks.
 */
function useFormSubmit(form: FormType) {
  const shownAt = useRef<number>(0);
  useEffect(() => {
    shownAt.current = performance.now();
  }, []);
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  async function submit(fields: { email: string; consent: boolean; message?: string; website: string }) {
    setState('sending');
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ form, ...fields, elapsedMs: Math.round(performance.now() - shownAt.current) }),
      });
      setState(res.ok ? 'sent' : 'error');
    } catch {
      setState('error');
    }
  }
  return { state, submit };
}

/** Off-screen field people never see; automated scripts tend to fill it in. */
function Honeypot({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' }}>
      <label>
        Website
        <input type="text" name="website" tabIndex={-1} autoComplete="off" value={value} onChange={(e) => onChange(e.target.value)} />
      </label>
    </div>
  );
}

function ConsentBox({ id, checked, onChange }: { id: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start gap-2">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 rounded border-[var(--color-rule)] text-[var(--color-accent)]"
      />
      <label htmlFor={id} className="text-sm leading-snug text-[var(--color-ink-muted)]">
        {CONSENT_TEXT}
      </label>
    </div>
  );
}

function FormError() {
  return (
    <p role="alert" className="text-sm text-[var(--color-urgent)]">
      {FORM_ERROR.split('contact@menoverdict.com')[0]}
      <a href="mailto:contact@menoverdict.com" className="font-semibold underline">
        contact@menoverdict.com
      </a>
    </p>
  );
}

/** Newsletter signup: one per page. Nothing is offered in exchange, and no download is gated behind it. */
export function EmailCapture({
  title = NEWSLETTER_TITLE,
  itemDescription = 'One short email when a new free tool or guide goes live. No health information is ever asked for or sent.',
}: {
  title?: string;
  itemDescription?: string;
}) {
  const { state, submit } = useFormSubmit('newsletter');
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState('');

  if (state === 'sent') {
    return (
      <aside aria-label="Signup received" className={boxClass}>
        <h2 className="mb-2 font-serif text-xl font-semibold">Thanks, you&apos;re on the list</h2>
        <p className="text-[var(--color-ink-muted)]">
          We&apos;ll email <strong>{email}</strong> when we launch new tools. To stop, reply to any email and say so.
        </p>
      </aside>
    );
  }

  return (
    <aside aria-labelledby="newsletter-title" className={boxClass}>
      <h2 id="newsletter-title" className="mb-2 font-serif text-xl font-semibold">
        {title}
      </h2>
      <p className="mb-4 text-[var(--color-ink-muted)]">{itemDescription}</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit({ email, consent, website });
        }}
        className="relative space-y-4"
      >
        <div>
          <label htmlFor="newsletter-email" className="mb-1 block text-sm font-semibold">
            Email address
          </label>
          <input
            id="newsletter-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={inputClass}
          />
        </div>
        <ConsentBox id="newsletter-consent" checked={consent} onChange={setConsent} />
        <Honeypot value={website} onChange={setWebsite} />
        {state === 'error' && <FormError />}
        <button type="submit" disabled={state === 'sending' || !consent} className={buttonClass}>
          {state === 'sending' ? 'Sending…' : 'Notify me'}
        </button>
      </form>
    </aside>
  );
}

/** Contact form on /contact/: goes to the same inbox as writing to contact@menoverdict.com. */
export function ContactForm() {
  const { state, submit } = useFormSubmit('contact');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState('');

  if (state === 'sent') {
    return (
      <aside aria-label="Message sent" className={boxClass}>
        <h2 className="mb-2 font-serif text-xl font-semibold">Message sent</h2>
        <p className="text-[var(--color-ink-muted)]">Thanks. We&apos;ll reply to {email}.</p>
      </aside>
    );
  }

  return (
    <aside aria-labelledby="contact-form-title" className={boxClass}>
      <h2 id="contact-form-title" className="mb-2 font-serif text-xl font-semibold">
        Send us a message
      </h2>
      <p className="mb-4 text-[var(--color-ink-muted)]">
        Please don&apos;t include details about your health: we can&apos;t give personal medical advice.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit({ email, consent, message, website });
        }}
        className="relative space-y-4"
      >
        <div>
          <label htmlFor="contact-email" className="mb-1 block text-sm font-semibold">
            Your email address
          </label>
          <input
            id="contact-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="contact-message" className="mb-1 block text-sm font-semibold">
            Message
          </label>
          <textarea
            id="contact-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            maxLength={5000}
            rows={6}
            className={`${inputClass} max-w-xl`}
          />
        </div>
        <ConsentBox id="contact-consent" checked={consent} onChange={setConsent} />
        <Honeypot value={website} onChange={setWebsite} />
        {state === 'error' && <FormError />}
        <button type="submit" disabled={state === 'sending'} className={buttonClass}>
          {state === 'sending' ? 'Sending…' : 'Send message'}
        </button>
      </form>
    </aside>
  );
}
