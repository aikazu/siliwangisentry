export class CreateScanDto {
  readonly workspace_id: string; // UUID
  readonly scan_name?: string;
  readonly scan_type: string; // Enum: RECON, VULN_SCAN, etc.
  readonly trigger_type: string; // Enum: MANUAL, SCHEDULED, API
  readonly parameters?: any; // JSONB - input parameters for the scan/workflow
  readonly user_id?: string; // UUID - if applicable
  readonly description?: string;
} 