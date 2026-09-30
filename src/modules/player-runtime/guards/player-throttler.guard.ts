import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class PlayerThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(
    req: Record<string, any>,
  ): Promise<string> {
    if (req.device?.id) {
      return `player:${req.device.id}`;
    }

    return req.ip;
  }
}