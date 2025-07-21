import { NextResponse } from 'next/server';
import { ensureTools } from '@/lib/tool-manager';
import { logInfo, logError } from '@/lib/logger';

export async function POST() {
  try {
    logInfo('[API] Received request to prepare tools.');
    await ensureTools();
    logInfo('[API] All tools prepared successfully.');
    return NextResponse.json({ message: 'Tools prepared successfully' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown server error occurred';
    logError('[API] Error preparing tools:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
