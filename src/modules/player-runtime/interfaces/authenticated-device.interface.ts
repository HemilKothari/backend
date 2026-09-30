import { DeviceStatus } from '@prisma/client';

export interface AuthenticatedDevice {
  id: string;

  deviceCode: string;

  status: DeviceStatus;
}