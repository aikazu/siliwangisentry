import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Finding } from './entities/finding.entity';
// import { FindingsController } from './findings.controller';
// import { FindingsService } from './findings.service';

@Module({
  imports: [TypeOrmModule.forFeature([Finding])],
  // controllers: [FindingsController],
  // providers: [FindingsService],
  // exports: [FindingsService]
})
export class FindingsModule {} 