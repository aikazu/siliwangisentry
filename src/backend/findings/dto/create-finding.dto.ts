export class CreateFindingDto {
  readonly workspace_id: string; // UUID
  readonly asset_id?: string; // UUID, nullable
  readonly tool_run_id: string; // UUID
  readonly type: string; // Enum: VULNERABILITY, MISCONFIGURATION, etc.
  readonly title: string;
  readonly description?: string;
  readonly severity: string; // Enum: CRITICAL, HIGH, MEDIUM, LOW, INFORMATIONAL
  readonly confidence?: string; // Enum: HIGH, MEDIUM, LOW, CONFIRMED
  readonly cwe_id?: number;
  readonly cve_id?: string;
  readonly cvss_score?: number;
  readonly cvss_vector?: string;
  readonly remediation_guidance?: string;
  readonly evidence?: any; // JSONB
  readonly tags?: string[];
  readonly additional_properties?: any; // JSONB
  // status is usually set by system, first_seen, last_seen, reported_at too
} 