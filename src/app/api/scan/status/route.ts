
import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import { logError } from '@/lib/logger';

const LOG_FILE = path.join(process.cwd(), 'app.log');

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scanId = searchParams.get('scanId');

  if (!scanId) {
    return NextResponse.json({ error: 'scanId is required' }, { status: 400 });
  }

  if (!fs.existsSync(LOG_FILE)) {
    return NextResponse.json({ logs: [] });
  }

  try {
    const logContent = fs.readFileSync(LOG_FILE, 'utf-8');
    const allLines = logContent.split('\n');
    
    const logsForScan = allLines
      .filter(line => line.includes(`[SCAN][${scanId}]`))
      .map(line => 
          line.replace(/\[.*?\]\s/g, '') // Remove timestamps and levels like [INFO]
              .replace(`[SCAN][${scanId}]`, '')
              .trim()
      )
      .filter(Boolean); // Remove any empty lines

    return NextResponse.json({ logs: logsForScan });

  } catch (error) {
    logError('[API Scan Status] Error reading log file:', error);
    return NextResponse.json({ error: 'Failed to read scan status' }, { status: 500 });
  }
}
