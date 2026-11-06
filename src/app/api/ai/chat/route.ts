import { NextResponse } from 'next/server';
import { SITE } from '@/lib/site/config';

/**
 * Server-only AI assistant endpoint.
 *
 * Rules (Prompt 2 & Audit Section H):
 * - Keep API keys on the server only (process.env.GEMINI_API_KEY or process.env.AI_API_KEY).
 * - While FEATURE_AI_PROMOTION=false or when no API key is configured, return a
 *   calm "not available yet" message and never crash.
 * - Never diagnose, prescribe, or give medication doses.
 */
export async function POST() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY || '';

  if (!SITE.features.aiPromotion || !apiKey) {
    return NextResponse.json(
      {
        available: false,
        message:
          'The AI assistant is not available yet. You can search our evidence-graded articles and use all on-device tools without an account.',
      },
      { status: 200 },
    );
  }

  return NextResponse.json(
    {
      available: false,
      message:
        'The AI assistant is currently disabled until clinical safety review is complete.',
    },
    { status: 200 },
  );
}

