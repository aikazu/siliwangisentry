
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { activeProcesses } from '../route';
import { logError, logInfo } from '@/lib/logger';

const cancelRequestSchema = z.object({
  scanId: z.string().uuid('Invalid Scan ID'),
});

// A local log function to avoid circular dependencies or module type conflicts
function writeScanLog(scanId: string, message: string) {
    logInfo(`[SCAN-CANCEL][${scanId}] ${message}`);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = cancelRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.format() }, { status: 400 });
    }

    const { scanId } = validation.data;
    const processesToKill = activeProcesses.get(scanId);

    if (processesToKill && processesToKill.length > 0) {
      logInfo(`[API Scan Cancel] Found ${processesToKill.length} active process(es) for scanId ${scanId}. Attempting to kill.`);
      processesToKill.forEach(proc => {
        if (proc && typeof proc.kill === 'function' && !proc.killed) {
           proc.kill('SIGTERM'); // Send termination signal
        }
      });
      activeProcesses.delete(scanId); // Remove from tracking
      writeScanLog(scanId, '[CANCELLED] Scan cancelled by user.');
      return NextResponse.json({ message: 'Scan cancellation requested successfully.' });
    } else {
      logInfo(`[API Scan Cancel] No active process found for scanId ${scanId}. It may have already completed or failed.`);
      // Even if no process is found, log cancellation to stop the UI polling.
      writeScanLog(scanId, '[CANCELLED] Scan cancelled by user.');
      return NextResponse.json({ message: 'Scan already completed or no active process found.' }, { status: 404 });
    }
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown server error occurred';
    logError('[API Scan Cancel Error]', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
