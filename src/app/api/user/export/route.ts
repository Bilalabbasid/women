import { NextRequest, NextResponse } from 'next/server';
import { accountsBlocked, userIdFrom } from '@/lib/account/guard';
import { accountService } from '@/lib/account/service';

export async function GET(req: NextRequest) {
  const blocked = accountsBlocked();
  if (blocked) return blocked;
  const userId = userIdFrom(req);
  if (!userId) {
    return NextResponse.json({ error: 'User ID is required.' }, { status: 400 });
  }

  const exportData = await accountService.exportUserData(userId);
  return NextResponse.json(exportData);
}

