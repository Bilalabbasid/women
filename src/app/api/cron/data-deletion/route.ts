import { NextRequest, NextResponse } from 'next/server';
import { accountService } from '@/lib/account/service';
import { getSiteEnv } from '@/lib/site/config';

export async function GET(req: NextRequest) {
  return handleDeletion(req);
}

export async function POST(req: NextRequest) {
  return handleDeletion(req);
}

async function handleDeletion(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;

  // In production the job must be authenticated: without a secret it fails closed.
  if (!cronSecret && getSiteEnv() === 'production') {
    return NextResponse.json({ error: 'CRON_SECRET is not configured.' }, { status: 401 });
  }

  if (cronSecret) {
    const authHeader = req.headers.get('authorization');
    const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const urlSecret = req.nextUrl.searchParams.get('secret');

    if (bearer !== cronSecret && urlSecret !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized: invalid or missing cron secret' }, { status: 401 });
    }
  }

  const deletedCount = await accountService.runScheduledDataDeletion(new Date());

  return NextResponse.json({
    status: 'success',
    deletedRecords: deletedCount,
    executedAt: new Date().toISOString(),
  });
}

