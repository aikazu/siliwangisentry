import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScanMetadata } from './entities/scan-metadata.entity';
// import { ScansController } from './scans.controller';
// import { ScansService } from './scans.service';

@Module({
  imports: [TypeOrmModule.forFeature([ScanMetadata])],
  // controllers: [ScansController],
  // providers: [ScansService],
  // exports: [ScansService]
})
export class ScansModule {} 