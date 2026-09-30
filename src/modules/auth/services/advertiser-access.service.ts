import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../../prisma/prisma.service';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

@Injectable()
export class AdvertiserAccessService {
  constructor(private readonly prisma: PrismaService) {}

  private getAdvertiserId(user: AuthenticatedUser): string {
    if (user.role !== 'ADVERTISER') {
      throw new ForbiddenException(
        'Advertiser access is required.',
      );
    }

    if (!user.advertiserId) {
      throw new ForbiddenException(
        'User is not associated with an advertiser.',
      );
    }

    return user.advertiserId;
  }

  async getOwnedCampaign(
    campaignId: string,
    user: AuthenticatedUser,
  ) {
    const advertiserId = this.getAdvertiserId(user);

    const campaign = await this.prisma.campaign.findFirst({
      where: {
        id: campaignId,
        advertiserId,
      },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    return campaign;
  }

  async getOwnedMediaAsset(
    mediaAssetId: string,
    user: AuthenticatedUser,
  ) {
    const advertiserId = this.getAdvertiserId(user);

    const mediaAsset = await this.prisma.mediaAsset.findFirst({
      where: {
        id: mediaAssetId,
        advertiserId,
      },
    });

    if (!mediaAsset) {
      throw new NotFoundException('Media asset not found');
    }

    return mediaAsset;
  }
}