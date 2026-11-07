import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ContactForm, EmailCapture } from '@/components/site/email-capture';
import { CONSENT_TEXT } from '@/lib/forms/subscribe';

describe('EmailCapture', () => {
  const originalFetch = global.fetch;
  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('starts with consent unticked and the button disabled until it is ticked', () => {
    render(<EmailCapture />);
    const box = screen.getByLabelText(CONSENT_TEXT) as HTMLInputElement;
    expect(box.checked).toBe(false);
    expect(screen.getByRole('button', { name: /notify me/i })).toBeDisabled();
    fireEvent.click(box);
    expect(screen.getByRole('button', { name: /notify me/i })).toBeEnabled();
  });

  it('sends only the form type, email, consent, honeypot and timing to /api/subscribe', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    global.fetch = fetchMock as unknown as typeof fetch;
    render(<EmailCapture />);
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'reader@example.com' } });
    fireEvent.click(screen.getByLabelText(CONSENT_TEXT));
    fireEvent.click(screen.getByRole('button', { name: /notify me/i }));
    await waitFor(() => expect(screen.getByText(/you're on the list/i)).toBeInTheDocument());
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/subscribe');
    expect(Object.keys(JSON.parse(init.body)).sort()).toEqual(['consent', 'elapsedMs', 'email', 'form', 'website']);
  });

  it('shows the contact address when sending fails', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false }) as unknown as typeof fetch;
    render(<EmailCapture />);
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'reader@example.com' } });
    fireEvent.click(screen.getByLabelText(CONSENT_TEXT));
    fireEvent.click(screen.getByRole('button', { name: /notify me/i }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong — email us at contact@menoverdict.com'));
    expect(screen.queryByText(/you're on the list/i)).not.toBeInTheDocument();
  });

  it('treats a network failure as an error, never as success', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('offline')) as unknown as typeof fetch;
    render(<EmailCapture />);
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'reader@example.com' } });
    fireEvent.click(screen.getByLabelText(CONSENT_TEXT));
    fireEvent.click(screen.getByRole('button', { name: /notify me/i }));
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
  });
});

describe('ContactForm', () => {
  const originalFetch = global.fetch;
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('sends the message with consent off by default', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    global.fetch = fetchMock as unknown as typeof fetch;
    render(<ContactForm />);
    fireEvent.change(screen.getByLabelText(/your email address/i), { target: { value: 'reader@example.com' } });
    fireEvent.change(screen.getByLabelText(/^message$/i), { target: { value: 'A broken link on the hot flashes page.' } });
    fireEvent.click(screen.getByRole('button', { name: /send message/i }));
    await waitFor(() => expect(screen.getByText(/message sent/i)).toBeInTheDocument());
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body).toMatchObject({ form: 'contact', consent: false, message: 'A broken link on the hot flashes page.' });
  });
});
