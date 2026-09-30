import { Module } from '@nestjs/common';
import { TelemetryService } from './telemetry.service';
import { TelemetryController } from './telemetry.controller';
import { DriverActivityModule } from '../driver-activity/driver-activity.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule, DriverActivityModule],
  providers: [TelemetryService],
  controllers: [TelemetryController]
})
export class TelemetryModule {}
