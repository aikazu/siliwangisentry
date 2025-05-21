import { PartialType } from '@nestjs/swagger';
import { CreateScanDto } from './create-scan.dto';

export class UpdateScanDto extends PartialType(CreateScanDto) {
  readonly status?: string; // Enum: PENDING, RUNNING, COMPLETED, FAILED, CANCELLED
  // start_time and end_time are typically managed by the system
} 