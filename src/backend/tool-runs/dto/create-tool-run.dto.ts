export class CreateToolRunDto {
  readonly workspace_id: string; // UUID
  readonly scan_id: string; // UUID
  readonly tool_name: string;
  readonly tool_version?: string;
  readonly docker_image?: string;
  readonly command_line?: string;
  readonly parameters?: any; // JSONB
  readonly configuration?: any; // JSONB
  // status, start_time, end_time, log_path are typically managed by system/orchestrator
} 