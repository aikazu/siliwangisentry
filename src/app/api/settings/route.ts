
import { NextResponse } from 'next/server';
import { logInfo, logError } from '@/lib/logger';
import type { ScanSettings, ScanTemplate, EnabledScanTemplate } from '@/types/scan';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';

const SETTINGS_FILE = path.join(process.cwd(), 'settings.json');

const settingsSchema = z.object({
  flags: z.object({
    rateLimit: z.coerce.number().min(0).default(150),
    retries: z.coerce.number().int().min(0).default(1),
    timeout: z.coerce.number().int().min(5).default(10),
    concurrency: z.coerce.number().int().min(1).default(25),
    bulkSize: z.coerce.number().int().min(1).default(25),
    headless: z.boolean().default(false),
    scanStrategy: z.enum(['auto', 'host-spray', 'template-spray']).default('auto'),
    excludeInfo: z.boolean().default(false),
  }),
  templates: z.array(z.object({
    id: z.string(),
    name: z.string(),
    path: z.string(),
    description: z.string(),
    enabled: z.boolean(),
  })),
});

const defaultTemplates: Omit<ScanTemplate, 'id'>[] = [
    { name: 'CVEs', path: 'cves', description: 'Recent and critical CVEs.' },
    { name: 'Default Logins', path: 'default-logins', description: 'Test for default credentials.' },
    { name: 'Exposed Panels', path: 'exposed-panels', description: 'Find exposed admin panels.' },
    { name: 'Exposed Secrets', path: 'exposures', description: 'Look for exposed secrets and tokens.' },
    { name: 'File Disclosures', path: 'file', description: 'Identify sensitive file disclosures.' },
    { name: 'Misconfigurations', path: 'misconfiguration', description: 'Common security misconfigurations.' },
    { name: 'Takeovers', path: 'takeovers', description: 'Check for subdomain takeover vulnerabilities.' },
    { name: 'Vulnerabilities', path: 'vulnerabilities', description: 'Generic web vulnerabilities.' },
    { name: 'Technologies', path: 'technologies', description: 'Detect web technologies in use.' },
    { name: 'Headless', path: 'headless', description: 'Templates requiring headless browser.' },
    { name: 'Workflows', path: 'workflows', description: 'Multi-step vulnerability checks.' },
    { name: 'DNS', path: 'dns', description: 'Check for DNS misconfigurations.' },
];

function getAvailableTemplates(): ScanTemplate[] {
  return defaultTemplates.map((t, index) => ({ id: `${index}`, ...t }));
}

function getDefaultSettings(): ScanSettings {
  const availableTemplates = getAvailableTemplates();
  const enabledTemplates: EnabledScanTemplate[] = availableTemplates.map(t => ({
    ...t,
    enabled: ['CVEs', 'Vulnerabilities', 'Exposed Panels', 'Misconfigurations'].includes(t.name),
  }));

  return {
    flags: {
      rateLimit: 150,
      retries: 1,
      timeout: 10,
      concurrency: 25,
      bulkSize: 25,
      headless: false,
      scanStrategy: 'auto',
      excludeInfo: false,
    },
    templates: enabledTemplates,
  };
}

function ensureSettingsFile(): ScanSettings {
  if (!fs.existsSync(SETTINGS_FILE)) {
    logInfo('[API Settings] settings.json not found. Creating with default values.');
    const defaultSettings = getDefaultSettings();
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(defaultSettings, null, 2));
    return defaultSettings;
  } else {
    try {
      const fileContent = fs.readFileSync(SETTINGS_FILE, 'utf-8');
      const currentSettings = JSON.parse(fileContent);

      // Validate the loaded settings against the schema to add new default fields if they are missing
      const parsed = settingsSchema.safeParse(currentSettings);
      if (parsed.success) {
        // If validation is successful but some fields were defaulted, it means the file was outdated.
        // We should write the newly completed object back to the file.
        if (JSON.stringify(parsed.data) !== JSON.stringify(currentSettings)) {
            fs.writeFileSync(SETTINGS_FILE, JSON.stringify(parsed.data, null, 2));
        }
        return parsed.data;
      } else {
        logError('[API Settings] settings.json is invalid or outdated. Merging with defaults.', parsed.error);
        const defaultSettings = getDefaultSettings();
        const mergedSettings = {
            ...defaultSettings,
            ...currentSettings,
            flags: {
                ...defaultSettings.flags,
                ...currentSettings.flags,
            }
        }
        // Save the merged settings back
        fs.writeFileSync(SETTINGS_FILE, JSON.stringify(mergedSettings, null, 2));
        return mergedSettings;
      }
    } catch (error) {
      logError('[API Settings] Error parsing settings.json. Returning default settings.', error);
      const defaultSettings = getDefaultSettings();
      fs.writeFileSync(SETTINGS_FILE, JSON.stringify(defaultSettings, null, 2));
      return defaultSettings;
    }
  }
}

export async function GET() {
  try {
    const settings = ensureSettingsFile();
    return NextResponse.json({ settings });
  } catch (error) {
    logError('[API Settings GET]', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = settingsSchema.safeParse(body);

    if (!validation.success) {
      logError('[API Settings POST] Validation failed', validation.error.format());
      return NextResponse.json({ error: validation.error.format() }, { status: 400 });
    }

    const newSettings: ScanSettings = validation.data;
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(newSettings, null, 2));

    logInfo('[API Settings POST] Settings updated successfully.');
    return NextResponse.json({ message: 'Settings saved', settings: newSettings });

  } catch (error) {
    logError('[API Settings POST]', error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
