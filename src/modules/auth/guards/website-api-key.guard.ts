import {
  CanActivate,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { timingSafeEqual } from 'crypto';

@Injectable()
export class WebsiteApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const expectedKey = process.env.WEBSITE_API_KEY;

    if (!expectedKey) {
      throw new InternalServerErrorException(
        'Website API key is not configured.',
      );
    }

    const request = context.switchToHttp().getRequest();

    const providedKey = request.headers['x-website-key'];

    if (typeof providedKey !== 'string') {
      throw new UnauthorizedException();
    }

    const expectedBuffer = Buffer.from(expectedKey);
    const providedBuffer = Buffer.from(providedKey);

    if (
      expectedBuffer.length !== providedBuffer.length ||
      !timingSafeEqual(expectedBuffer, providedBuffer)
    ) {
      throw new UnauthorizedException();
    }

    return true;
  }
}