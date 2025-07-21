import { NextResponse } from 'next/server';
import { getToolPath } from '@/lib/tool-manager';
import * as fs from 'fs';
import { logError } from '@/lib/logger';

export async function GET() {
  try {
    const tools = ['subfinder', 'httpx', 'nuclei'];
    const areToolsReady = tools.every(tool => {
        const toolPath = getToolPath(tool as any);
        return fs.existsSync(toolPath);
    });
    
    return NextResponse.json({ ready: areToolsReady });
  } catch (error) {
    logError('[API] Error checking tool status:', error);
    return NextResponse.json({ ready: false, error: 'Failed to check tool status' }, { status: 500 });
  }
}
