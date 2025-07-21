
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { runCommand } from '@/lib/tool-manager';
import { logInfo, logError } from '@/lib/logger';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import type { ScanSettings } from '@/types/scan';
import type { ChildProcess } from 'child_process';

const scanRequestSchema = z.object({
  target: z.string().min(1, 'Target is required'),
  scanId: z.string().uuid(),
});

const RESULTS_DIR = path.join(process.cwd(), 'results');
const SETTINGS_FILE = path.join(process.cwd(), 'settings.json');

// In-memory map to track active scan processes.
export const activeProcesses = new Map<string, ChildProcess[]>();

export async function writeScanLog(scanId: string, message: string) {
    // Re-route to central logger
    logInfo(`[SCAN][${scanId}] ${message}`);
}

function ensureResultDir(target: string, tool: string): string {
  const dirPath = path.join(RESULTS_DIR, tool, target);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  return dirPath;
}

async function runToolsAndSaveOutput(target: string, scanId: string) {
  const timestamp = Date.now();
  const processes: ChildProcess[] = [];
  activeProcesses.set(scanId, processes);

  const updateActiveProcesses = (proc: ChildProcess | undefined) => {
    if (proc) {
        processes.length = 0; 
        processes.push(proc);
        activeProcesses.set(scanId, processes);
    }
  };

  try {
    let settings: ScanSettings | null = null;
    if (fs.existsSync(SETTINGS_FILE)) {
      const settingsData = fs.readFileSync(SETTINGS_FILE, 'utf-8');
      settings = JSON.parse(settingsData) as ScanSettings;
    }

    if (!settings) {
        throw new Error('Scan settings not found (settings.json). Please configure settings first.');
    }

    const subfinderPath = path.join(process.cwd(), 'tools', 'subfinder' + (os.platform() === 'win32' ? '.exe' : ''));
    const httpxPath = path.join(process.cwd(), 'tools', 'httpx' + (os.platform() === 'win32' ? '.exe' : ''));
    const nucleiPath = path.join(process.cwd(), 'tools', 'nuclei' + (os.platform() === 'win32' ? '.exe' : ''));
    const nucleiTemplatesDir = path.join(process.cwd(), 'tools', 'nuclei-templates');
    
    // --- Step 1: Subfinder ---
    await writeScanLog(scanId, `Starting subdomain enumeration with subfinder...`);
    const subfinderArgs = ['-d', target, '-silent'];
    const subfinderProc = runCommand(subfinderPath, subfinderArgs);
    updateActiveProcesses(subfinderProc.child);
    const subdomains = await subfinderProc.promise;
    
    if (!subdomains.trim()) {
        await writeScanLog(scanId, '[DONE] Subfinder found no subdomains. Scan finished.');
        return;
    }
    const subdomainCount = subdomains.trim().split('\n').filter(Boolean).length;
    await writeScanLog(scanId, `Subfinder complete. Found ${subdomainCount} subdomains.`);

    // --- Step 2: httpx ---
    await writeScanLog(scanId, `Identifying live hosts with httpx...`);
    const httpxArgs = ['-silent', '-no-color'];
    const httpxProc = runCommand(httpxPath, httpxArgs, subdomains);
    updateActiveProcesses(httpxProc.child);
    const liveHosts = await httpxProc.promise;
    
    if (!liveHosts.trim()) {
      await writeScanLog(scanId, '[DONE] httpx found no live hosts. Scan finished.');
      return;
    }
    const liveHostsCount = liveHosts.trim().split('\n').filter(Boolean).length;
    await writeScanLog(scanId, `httpx complete. Found ${liveHostsCount} live hosts.`);
    
    // --- Step 3: Nuclei ---
    await writeScanLog(scanId, 'Starting vulnerability scan with nuclei...');
    const nucleiResultDir = ensureResultDir(target, 'nuclei');
    const nucleiFilePath = path.join(nucleiResultDir, `output-${timestamp}.json`);
    
    const nucleiArgs = ['-je', nucleiFilePath, '-silent', '-no-color'];
    if (settings.flags.rateLimit) nucleiArgs.push('-rl', String(settings.flags.rateLimit));
    if (settings.flags.retries) nucleiArgs.push('-retries', String(settings.flags.retries));
    if (settings.flags.timeout) nucleiArgs.push('-timeout', String(settings.flags.timeout));
    if (settings.flags.concurrency) nucleiArgs.push('-c', String(settings.flags.concurrency));
    if (settings.flags.bulkSize) nucleiArgs.push('-bs', String(settings.flags.bulkSize));
    if (settings.flags.headless) nucleiArgs.push('-headless');
    if (settings.flags.scanStrategy) nucleiArgs.push('-ss', settings.flags.scanStrategy);

    if (settings.flags.excludeInfo) {
        nucleiArgs.push('-es', 'info');
    }

    nucleiArgs.push('-t', nucleiTemplatesDir);
    const selectedTemplateTags = settings.templates
      .filter(t => t.enabled)
      .map(t => t.path.split(path.sep).pop()); 
    
    if (selectedTemplateTags.length > 0) {
        nucleiArgs.push('-itags', selectedTemplateTags.join(','));
    } else {
        await writeScanLog(scanId, '[WARN] No templates selected. Running with default nuclei templates (automatic selection).');
    }

    const nucleiProc = runCommand(nucleiPath, nucleiArgs, liveHosts);
    updateActiveProcesses(nucleiProc.child);
    
    await nucleiProc.promise;

    if (fs.existsSync(nucleiFilePath) && fs.statSync(nucleiFilePath).size > 0) {
      await writeScanLog(scanId, 'Nuclei scan complete. Vulnerabilities may have been found.');
    } else {
      await writeScanLog(scanId, 'Nuclei scan complete. No vulnerabilities found.');
       if (fs.existsSync(nucleiFilePath)) {
            try {
                fs.unlinkSync(nucleiFilePath);
                logInfo(`[SCAN][${scanId}] Deleted empty nuclei output file: ${nucleiFilePath}`);
            } catch (e) {
                logError(`[SCAN][${scanId}] Failed to delete empty nuclei output file: ${nucleiFilePath}`, e);
            }
        }
    }
    
    await writeScanLog(scanId, `[DONE] Scan for ${target} completed successfully.`);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error during tool execution';
    if (!errorMessage.includes('was intentionally killed')) {
      await writeScanLog(scanId, `[ERROR] ${errorMessage}`);
      logError(`[SCAN][${scanId}] Error during tool execution pipeline:`, error);
    }
  } finally {
      activeProcesses.delete(scanId);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = scanRequestSchema.safeParse(body);

    if (!validation.success) {
      logError('[API Scan Error] Invalid request body:', validation.error.format());
      return NextResponse.json({ error: validation.error.format() }, { status: 400 });
    }

    const { target, scanId } = validation.data;
    
    if (!fs.existsSync(RESULTS_DIR)) {
        fs.mkdirSync(RESULTS_DIR, { recursive: true });
    }
    
    await writeScanLog(scanId, "Initializing scan...");

    runToolsAndSaveOutput(target, scanId).catch(err => {
        logError(`[API] Background scan task for scanId ${scanId} encountered a critical failure.`, err);
        activeProcesses.delete(scanId);
    });

    return NextResponse.json({ message: `Scan for ${target} started successfully.` });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown server error occurred';
    logError('[API Scan Error]', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
