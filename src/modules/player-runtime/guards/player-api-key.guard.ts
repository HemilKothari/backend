import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PlayerApiKeyGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const authorization = request.header('Authorization');

    if (!authorization?.startsWith('ApiKey ')) {
      throw new UnauthorizedException(
        'Missing or invalid Authorization header.',
      );
    }

    const apiKey = authorization.substring(7).trim();

    if (!apiKey) {
      throw new UnauthorizedException('Missing API Key.');
    }

    const device = await this.prisma.device.findUnique({
      where: {
        apiKey,
      },
    });

    if (!device) {
      throw new UnauthorizedException('Invalid API Key.');
    }

    switch (device.status) {
      case 'ONLINE':
      case 'OFFLINE':
        break;

      case 'PENDING':
        throw new ForbiddenException(
          'Device provisioning is pending.',
        );

      case 'MAINTENANCE':
        throw new ForbiddenException(
          'Device is under maintenance.',
        );

      case 'DECOMMISSIONED':
        throw new ForbiddenException(
          'Device has been decommissioned.',
        );

      default:
        throw new ForbiddenException(
          'Device is not allowed to connect.',
        );
    }

    request.device = {
      id: device.id,
      deviceCode: device.deviceCode,
      status: device.status
    };

    return true;
  }
}