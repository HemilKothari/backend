import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DeviceAuthGuard
  implements CanActivate
{
  constructor(
    private prisma: PrismaService,
  ) {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request =
      context.switchToHttp().getRequest();

    const deviceCode =
      request.headers['device-code'];

    const apiKey =
      request.headers['api-key'];

    if (!deviceCode || !apiKey) {
      throw new UnauthorizedException(
        'Missing device credentials',
      );
    }

    const device =
      await this.prisma.device.findFirst({
        where: {
          deviceCode,
          apiKey,
        },
      });

    if (!device) {
      throw new UnauthorizedException(
        'Invalid device credentials',
      );
    }

    request.device = device;

    return true;
  }
}