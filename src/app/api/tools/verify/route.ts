
import { NextResponse } from 'next/server';
import { verifyTools } from '@/lib/tool-manager';
import { logInfo, logError } from '@/lib/logger';

export async function POST() {
  try {
    logInfo('[API] Received request to verify tools.');
    const verificationStatus = await verifyTools();
    
    const allOk = Object.values(verificationStatus).every(status => status === 'OK');
    
    if (allOk) {
      logInfo('[API] All tools verified successfully.');
    } else {
      logInfo('[API] Tool verification completed with issues.', verificationStatus);
    }
    
    return NextResponse.json({ status: verificationStatus });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown server error occurred';
    logError('[API] Error verifying tools:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
