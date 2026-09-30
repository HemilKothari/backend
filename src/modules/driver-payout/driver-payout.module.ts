import { Module } from '@nestjs/common';
import { DriverPayoutService } from './driver-payout.service';
import { DriverPayoutController } from './driver-payout.controller';
import { DriverActivityModule } from '../driver-activity/driver-activity.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule, DriverActivityModule],
  providers: [DriverPayoutService],
  controllers: [DriverPayoutController],
  exports: [DriverPayoutService],
})
export class DriverPayoutModule {}
