export class CreateAssetDto {
  readonly workspace_id: string; // UUID
  readonly type: string; // Enum: DOMAIN, IP_ADDRESS, URL, etc.
  readonly value: string;
  readonly tags?: string[];
  readonly source?: string;
  readonly attributes?: any; // JSONB
} 