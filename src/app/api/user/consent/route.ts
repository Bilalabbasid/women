import { NextRequest, NextResponse } from 'next/server';
import { accountsBlocked, userIdFrom } from '@/lib/account/guard';
import { accountService } from '@/lib/account/service';
import type { RetentionDays } from '@/lib/account/types';

export async function GET(req: NextRequest) {
  const blocked = accountsBlocked();
  if (blocked) return blocked;
  const userId = userIdFrom(req);
  if (!userId) {
    return NextResponse.json({ error: 'User ID is required.' }, { status: 400 });
  }

  const consent = await accountService.getSyncConsent(userId);
  return NextResponse.json({ consent });
}

export async function POST(req: NextRequest) {
  const blocked = accountsBlocked();
  if (blocked) return blocked;
  try {
    const body = await req.json();
    const { userId, retentionDays, consentVersion, withdraw } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required.' }, { status: 400 });
    }

    if (withdraw) {
      await accountService.withdrawSyncConsent(userId);
      return NextResponse.json({ status: 'withdrawn' });
    }

    const validRetention = [10, 20, 30, 90];
    if (!validRetention.includes(retentionDays)) {
      return NextResponse.json(
        { error: 'Retention must be one of: 10, 20, 30, or 90 days.' },
        { status: 400 }
      );
    }

    const consent = await accountService.recordSyncConsent(
      userId,
      retentionDays as RetentionDays,
      consentVersion || 'v1.0'
    );

    return NextResponse.json({ status: 'recorded', consent });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

