import { PartialType } from '@nestjs/swagger';
import { CreateToolRunDto } from './create-tool-run.dto';

export class UpdateToolRunDto extends PartialType(CreateToolRunDto) {
  readonly status?: string; // Enum: PENDING, RUNNING, COMPLETED, FAILED, TIMED_OUT
  readonly log_path?: string;
  readonly end_time?: Date;
} 