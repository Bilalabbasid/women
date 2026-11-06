import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EmailCapture } from '@/components/site/email-capture';

async function fillAndSubmit(email = 'reader@example.com') {
  fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: email } });
  fireEvent.click(screen.getByLabelText(/i agree to receive/i));
  fireEvent.click(screen.getByRole('button', { name: /send me the guide/i }));
}

describe('EmailCapture', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('never claims a guide was sent when the server rejects the request', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Explicit consent is required to subscribe.' }),
    }) as unknown as typeof fetch;

    render(<EmailCapture />);
    await fillAndSubmit();

    await waitFor(() => expect(screen.getByText(/explicit consent is required/i)).toBeInTheDocument());
    expect(screen.queryByText(/we've sent your guide/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/you're on the list/i)).not.toBeInTheDocument();
  });

  it('never claims a guide was sent when the request fails entirely (network/offline)', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('network down')) as unknown as typeof fetch;

    render(<EmailCapture />);
    await fillAndSubmit();

    await waitFor(() => expect(screen.getByText(/could not reach the server/i)).toBeInTheDocument());
    expect(screen.queryByText(/we've sent your guide/i)).not.toBeInTheDocument();
  });

  it('says the signup is queued, not that a guide was sent, when no email provider is configured', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'accepted', providerConfigured: false }),
    }) as unknown as typeof fetch;

    render(<EmailCapture />);
    await fillAndSubmit();

    await waitFor(() => expect(screen.getByText(/you're on the list/i)).toBeInTheDocument());
    expect(screen.getByText(/nothing has been sent/i)).toBeInTheDocument();
    expect(screen.queryByText(/we've sent your guide/i)).not.toBeInTheDocument();
  });

  it('only claims a guide was sent once a real provider actually confirms it', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'subscribed', providerConfigured: true }),
    }) as unknown as typeof fetch;

    render(<EmailCapture />);
    await fillAndSubmit();

    await waitFor(() => expect(screen.getByText(/we've sent your guide/i)).toBeInTheDocument());
  });
});
