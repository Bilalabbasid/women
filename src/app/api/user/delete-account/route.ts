import { NextRequest, NextResponse } from 'next/server';
import { accountsBlocked, userIdFrom } from '@/lib/account/guard';
import { accountService } from '@/lib/account/service';

export async function POST(req: NextRequest) {
  const blocked = accountsBlocked();
  if (blocked) return blocked;
  try {
    const body = await req.json();
    const { userId } = body;
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required.' }, { status: 400 });
    }

    await accountService.deleteAccount(userId);
    return NextResponse.json({ status: 'account_deleted' });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

