import { NextRequest, NextResponse } from 'next/server';
import { accountService } from '@/lib/account/service';

export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id') || req.nextUrl.searchParams.get('userId');
  if (!userId) {
    return NextResponse.json({ error: 'User ID is required.' }, { status: 400 });
  }

  const exportData = await accountService.exportUserData(userId);
  return NextResponse.json(exportData);
}
