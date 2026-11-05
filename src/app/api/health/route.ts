import { NextResponse } from 'next/server';
import { APP_CONFIG } from '@/lib/config/constants';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    app: APP_CONFIG.name,
    version: APP_CONFIG.version,
    timestamp: new Date().toISOString(),
    privacy: 'local-first',
  });
}
