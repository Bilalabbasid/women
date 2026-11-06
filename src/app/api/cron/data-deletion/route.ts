import { NextRequest, NextResponse } from 'next/server';
import { accountService } from '@/lib/account/service';

export async function GET(req: NextRequest) {
  return handleDeletion(req);
}

export async function POST(req: NextRequest) {
  return handleDeletion(req);
}

async function handleDeletion(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;

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
