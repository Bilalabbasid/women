/**
 * The site's only outgoing data: an email address (and, for the contact form, a
 * message) someone typed into a form, sent to the site owner's inbox via Resend.
 * Nothing is stored or logged. Health data is never accepted.
 */
export const FORM_TYPES = ['newsletter', 'contact'] as const;
export type FormType = (typeof FORM_TYPES)[number];

export const FORM_ERROR = 'Something went wrong — email us at contact@menoverdict.com';
export const CONSENT_TEXT =
  'I agree MenoVerdict can email me about new tools and launches. Unsubscribe any time by replying.';
export const NEWSLETTER_TITLE = 'Get notified when we launch new tools';

/** Submissions faster than this after the form appeared are treated as automated. */
export const MIN_FILL_MS = 3000;
export const RATE_LIMIT = { max: 5, windowMs: 10 * 60 * 1000 };
export const MAX_MESSAGE_LENGTH = 5000;

const ALLOWED_KEYS = new Set(['form', 'email', 'consent', 'message', 'website', 'elapsedMs']);
const EMAIL_RE = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]{2,}$/;

export interface Submission {
  form: FormType;
  email: string;
  consent: boolean;
  message?: string;
}

export type ParseResult =
  | { kind: 'ok'; submission: Submission }
  /** Honeypot filled: answer as if it worked, send nothing. */
  | { kind: 'bot' }
  | { kind: 'invalid' };

export function parseSubmission(body: unknown): ParseResult {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { kind: 'invalid' };
  const b = body as Record<string, unknown>;
  // Only the known fields: anything else (such as tool or tracker data) is refused outright.
  if (Object.keys(b).some((k) => !ALLOWED_KEYS.has(k))) return { kind: 'invalid' };
  if (typeof b.website === 'string' && b.website.trim() !== '') return { kind: 'bot' };
  if (typeof b.elapsedMs !== 'number' || !Number.isFinite(b.elapsedMs) || b.elapsedMs < MIN_FILL_MS) return { kind: 'invalid' };

  const form = FORM_TYPES.find((f) => f === b.form);
  if (!form) return { kind: 'invalid' };
  const email = typeof b.email === 'string' ? b.email.trim() : '';
  if (email.length > 254 || !EMAIL_RE.test(email)) return { kind: 'invalid' };
  const consent = b.consent === true;
  // A newsletter signup without consent has nothing to sign up for.
  if (form === 'newsletter' && !consent) return { kind: 'invalid' };

  let message: string | undefined;
  if (form === 'contact') {
    message = typeof b.message === 'string' ? b.message.trim() : '';
    if (!message || message.length > MAX_MESSAGE_LENGTH) return { kind: 'invalid' };
  }
  return { kind: 'ok', submission: { form, email, consent, message } };
}

export function notificationEmail(s: Submission, now: Date = new Date()): { subject: string; text: string } {
  const lines = [
    `Email: ${s.email}`,
    `Form: ${s.form}`,
    `Consent to launch emails: ${s.consent ? 'yes' : 'no'}`,
    `Submitted: ${now.toISOString()}`,
  ];
  if (s.form === 'contact' && s.message) lines.push('', 'Message:', s.message);
  return { subject: `New ${s.form} signup — MenoVerdict`, text: lines.join('\n') };
}

/**
 * Fixed-window counter per key, held in memory only (it resets when the server
 * restarts and differs between server instances). Keys are hashed by the caller.
 */
export function createRateLimiter({ max, windowMs } = RATE_LIMIT) {
  const hits = new Map<string, { count: number; resetAt: number }>();
  return function allow(key: string, now = Date.now()): boolean {
    for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
    const entry = hits.get(key);
    if (!entry) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return true;
    }
    entry.count += 1;
    return entry.count <= max;
  };
}
