import { PartialType } from '@nestjs/swagger';
import { CreateAssetDto } from './create-asset.dto';

export class UpdateAssetDto extends PartialType(CreateAssetDto) {
  // last_seen could be updated implicitly by the service
} 