import { Module } from '@nestjs/common';
import { DeviceProvisionService } from './device-provision.service';
import { DeviceProvisionController } from './device-provision.controller';

@Module({
  providers: [DeviceProvisionService],
  controllers: [DeviceProvisionController]
})
export class DeviceProvisionModule {}
