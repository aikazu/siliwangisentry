import { PartialType } from '@nestjs/swagger'; // Or from '@nestjs/mapped-types' if swagger is not used for this
import { CreateWorkspaceDto } from './create-workspace.dto';

export class UpdateWorkspaceDto extends PartialType(CreateWorkspaceDto) {} 