import { NextRequest, NextResponse } from 'next/server';
import { accountsBlocked, userIdFrom } from '@/lib/account/guard';
import { accountService } from '@/lib/account/service';

export async function POST(req: NextRequest) {
  const blocked = accountsBlocked();
  if (blocked) return blocked;

  try {
    const body = await req.json();
    const { email } = body;
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email address is required.' }, { status: 400 });
    }

    const user = await accountService.createOrGetUser(email.trim().toLowerCase());
    return NextResponse.json({
      status: 'authenticated',
      user: { id: user.id, email: user.email },
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

