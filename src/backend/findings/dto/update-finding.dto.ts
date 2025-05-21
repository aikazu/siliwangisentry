import { PartialType } from '@nestjs/swagger';
import { CreateFindingDto } from './create-finding.dto';

export class UpdateFindingDto extends PartialType(CreateFindingDto) {
  readonly status?: string; // Enum: OPEN, CLOSED, ACCEPTED_RISK, FALSE_POSITIVE, REMEDIATED
  // Other fields from CreateFindingDto can be updated.
  // Timestamps like last_seen will be updated by the service.
} 