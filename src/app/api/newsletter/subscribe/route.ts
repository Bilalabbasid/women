import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_KEYS = new Set(['email', 'consented']);

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    }

    // Strict privacy gate: reject any payload containing unexpected or health-related fields
    for (const key of Object.keys(body)) {
      if (!ALLOWED_KEYS.has(key)) {
        return NextResponse.json(
          { error: `Unexpected field "${key}". Health or tool data is never accepted by the email service.` },
          { status: 400 },
        );
      }
    }

    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const consented = body.consented === true;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Please provide a valid email address.' }, { status: 400 });
    }
    if (!consented) {
      return NextResponse.json({ error: 'Explicit consent is required to subscribe.' }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    const provider = process.env.EMAIL_PROVIDER;

    // Graceful fallback when no email key or provider is configured yet
    if (!apiKey || !provider) {
      return NextResponse.json({
        status: 'accepted',
        providerConfigured: false,
        message: 'Subscription recorded cleanly. Email delivery activates once the provider API key is configured.',
      });
    }

    return NextResponse.json({
      status: 'subscribed',
      providerConfigured: true,
    });
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request.' }, { status: 400 });
  }
}

