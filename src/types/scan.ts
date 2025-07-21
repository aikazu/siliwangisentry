
export type VulnerabilityResult = {
  vulnerability: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'Info' | 'Unknown';
  port: number | string;
  service: string;
  host: string;
  target: string;
};

export type Vulnerability = VulnerabilityResult & {
  id: string;
  lastSeen: string;
};

export type ScanTemplate = {
  id: string;
  name: string;
  path: string;
  description: string;
};

export type EnabledScanTemplate = ScanTemplate & {
  enabled: boolean;
};

export type ScanSettings = {
  flags: {
    rateLimit: number;
    retries: number;
    timeout: number;
    concurrency: number;
    bulkSize: number;
    headless: boolean;
    scanStrategy: 'auto' | 'host-spray' | 'template-spray';
    excludeInfo: boolean;
  };
  templates: EnabledScanTemplate[];
};

export type ScannedTarget = {
    name: string;
    totalVulnerabilities: number;
    severityCounts: Record<Vulnerability['severity'], number>;
    highestSeverity: Vulnerability['severity'];
    lastSeen: string;
}
