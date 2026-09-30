import { Module } from '@nestjs/common';
import { DriverActivityService } from './driver-activity.service';
import { DriverActivityController } from './driver-activity.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { DriverActivityGeneratorService } from './driver-activity-generator.service';

@Module({
  imports: [PrismaModule],
  providers: [DriverActivityService, DriverActivityGeneratorService],
  controllers: [DriverActivityController],
  exports: [DriverActivityService, DriverActivityGeneratorService],
})
export class DriverActivityModule {}
