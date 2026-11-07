/** @vitest-environment node */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRateLimiter, notificationEmail, parseSubmission } from '@/lib/forms/subscribe';

const ok = { form: 'newsletter', email: 'reader@example.com', consent: true, website: '', elapsedMs: 5000 };

describe('parseSubmission', () => {
  it('accepts a valid newsletter signup', () => {
    expect(parseSubmission(ok)).toEqual({ kind: 'ok', submission: { form: 'newsletter', email: 'reader@example.com', consent: true, message: undefined } });
  });
  it('flags a filled honeypot as a bot', () => {
    expect(parseSubmission({ ...ok, website: 'http://spam.test' })).toEqual({ kind: 'bot' });
  });
  it('rejects submissions faster than 3 seconds', () => {
    expect(parseSubmission({ ...ok, elapsedMs: 2999 }).kind).toBe('invalid');
  });
  it('rejects bad emails, missing consent and unknown forms', () => {
    expect(parseSubmission({ ...ok, email: 'not-an-email' }).kind).toBe('invalid');
    expect(parseSubmission({ ...ok, consent: false }).kind).toBe('invalid');
    expect(parseSubmission({ ...ok, form: 'waitlist' }).kind).toBe('invalid');
  });
  it('refuses any extra field, such as tracker data', () => {
    expect(parseSubmission({ ...ok, symptoms: ['hot flashes'] }).kind).toBe('invalid');
  });
  it('requires a message for the contact form and allows no consent there', () => {
    expect(parseSubmission({ ...ok, form: 'contact', consent: false }).kind).toBe('invalid');
    expect(parseSubmission({ ...ok, form: 'contact', consent: false, message: 'Hello' }).kind).toBe('ok');
  });
});

describe('notificationEmail', () => {
  it('has the agreed subject and fields', () => {
    const { subject, text } = notificationEmail(
      { form: 'contact', email: 'a@b.test', consent: false, message: 'Hi' },
      new Date('2026-11-07T12:00:00Z'),
    );
    expect(subject).toBe('New contact signup — MenoVerdict');
    expect(text).toBe('Email: a@b.test\nForm: contact\nConsent to launch emails: no\nSubmitted: 2026-11-07T12:00:00.000Z\n\nMessage:\nHi');
  });
  it('leaves the message out of newsletter emails', () => {
    expect(notificationEmail({ form: 'newsletter', email: 'a@b.test', consent: true }).text).not.toMatch(/Message/);
  });
});

describe('rate limit', () => {
  it('allows 5 per 10 minutes per key', () => {
    const allow = createRateLimiter();
    const t = 1_000_000;
    for (let i = 0; i < 5; i++) expect(allow('k', t)).toBe(true);
    expect(allow('k', t)).toBe(false);
    expect(allow('other', t)).toBe(true);
    expect(allow('k', t + 10 * 60 * 1000)).toBe(true);
  });
});

describe('POST /api/subscribe', () => {
  const env = { ...process.env };
  const req = (body: unknown, ip = '203.0.113.1') =>
    new Request('https://site.test/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ip },
      body: JSON.stringify(body),
    });

  beforeEach(() => {
    vi.resetModules();
    process.env.RESEND_API_KEY = 're_test';
    process.env.FORMS_NOTIFY_TO = 'owner@site.test';
    process.env.FORMS_NOTIFY_FROM = 'forms@site.test';
  });
  afterEach(() => {
    process.env = { ...env };
    vi.unstubAllGlobals();
  });

  it('emails the owner through Resend with only the submitted fields', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const { POST } = await import('@/app/api/subscribe/route');
    const res = await POST(req(ok));
    expect(res.status).toBe(200);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.resend.com/emails');
    const sent = JSON.parse(init.body);
    expect(sent).toMatchObject({ from: 'forms@site.test', to: ['owner@site.test'], subject: 'New newsletter signup — MenoVerdict' });
    expect(sent.text).not.toMatch(/203\.0\.113\.1/);
  });

  it('sends nothing for a bot, but answers OK', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { POST } = await import('@/app/api/subscribe/route');
    expect((await POST(req({ ...ok, website: 'x' }))).status).toBe(200);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('fails with the contact address when Resend is not configured', async () => {
    delete process.env.RESEND_API_KEY;
    const { POST } = await import('@/app/api/subscribe/route');
    const res = await POST(req(ok));
    expect(res.status).toBe(503);
    expect((await res.json()).error).toBe('Something went wrong — email us at contact@menoverdict.com');
  });

  it('limits each address to 5 submissions per 10 minutes', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async () => new Response('{}', { status: 200 })));
    const { POST } = await import('@/app/api/subscribe/route');
    const codes = [];
    for (let i = 0; i < 6; i++) codes.push((await POST(req(ok, '198.51.100.7'))).status);
    expect(codes).toEqual([200, 200, 200, 200, 200, 429]);
  });
});
