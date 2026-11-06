import { NextRequest, NextResponse } from 'next/server';
import { accountService } from '@/lib/account/service';

export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id') || req.nextUrl.searchParams.get('userId');
  if (!userId) {
    return NextResponse.json({ error: 'User ID is required.' }, { status: 400 });
  }

  const records = await accountService.getUserHealthData(userId);
  return NextResponse.json({ records });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, payload } = body;

    if (!userId || !payload) {
      return NextResponse.json({ error: 'User ID and payload are required.' }, { status: 400 });
    }

    const record = await accountService.syncHealthData(userId, typeof payload === 'string' ? payload : JSON.stringify(payload));
    return NextResponse.json({ status: 'saved', record });
  } catch (err) {
    const msg = (err as Error).message;
    const isConsentErr = msg.includes('Explicit consent is required');
    return NextResponse.json({ error: msg }, { status: isConsentErr ? 403 : 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const userId = req.headers.get('x-user-id') || req.nextUrl.searchParams.get('userId');
  if (!userId) {
    return NextResponse.json({ error: 'User ID is required.' }, { status: 400 });
  }

  const deleted = await accountService.deleteAllHealthData(userId);
  return NextResponse.json({ status: 'deleted', deletedCount: deleted });
}
