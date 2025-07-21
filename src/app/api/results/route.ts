
import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import { logInfo, logError } from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';
import type { Vulnerability } from '@/types/scan';

const RESULTS_DIR = path.join(process.cwd(), 'results', 'nuclei');

export async function GET() {
  try {
    if (!fs.existsSync(RESULTS_DIR)) {
      logInfo('[API Results] Nuclei results directory does not exist. Returning empty array.');
      return NextResponse.json([]);
    }

    const allVulnerabilities: Vulnerability[] = [];
    const targetHosts = fs.readdirSync(RESULTS_DIR, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    for (const host of targetHosts) {
      const hostDir = path.join(RESULTS_DIR, host);
      const resultFiles = fs.readdirSync(hostDir)
        .filter(file => file.endsWith('.json'));

      for (const file of resultFiles) {
        const filePath = path.join(hostDir, file);
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const fileStats = fs.statSync(filePath);

        const lines = fileContent.trim().split('\n');
        for (const line of lines) {
          if (!line) continue;
          try {
            const data = JSON.parse(line);
            if (!data.info || !data.info.severity) {
              continue;
            }

            const severity = data.info.severity.charAt(0).toUpperCase() + data.info.severity.slice(1);

            allVulnerabilities.push({
              id: uuidv4(),
              vulnerability: data.info.name,
              severity: severity as Vulnerability['severity'],
              port: data['matched-port'] || data.port || 'N/A',
              service: data.protocol || 'http',
              host: data.host,
              target: host, // The main target domain
              lastSeen: fileStats.mtime.toISOString(), // Use file modification time
            });
          } catch (e) {
            logError(`[API Results] Failed to parse JSON line in ${filePath}: ${line}`, e);
          }
        }
      }
    }
    
    // Sort by lastSeen descending
    allVulnerabilities.sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime());

    return NextResponse.json(allVulnerabilities);

  } catch (error) {
    logError('[API Results] Error reading scan results:', error);
    return NextResponse.json({ error: 'Failed to read scan results' }, { status: 500 });
  }
}
