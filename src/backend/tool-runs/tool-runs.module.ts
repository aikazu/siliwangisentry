import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ToolRun } from './entities/tool-run.entity';
// import { ToolRunsController } from './tool-runs.controller';
// import { ToolRunsService } from './tool-runs.service';

@Module({
  imports: [TypeOrmModule.forFeature([ToolRun])],
  // controllers: [ToolRunsController],
  // providers: [ToolRunsService],
  // exports: [ToolRunsService]
})
export class ToolRunsModule {} 