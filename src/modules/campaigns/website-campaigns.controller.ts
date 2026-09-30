import {
  Controller,
  Get,
  UseGuards,
} from '@nestjs/common';

import { CampaignsService } from './campaigns.service';
import { WebsiteApiKeyGuard } from '../auth/guards/website-api-key.guard';

@Controller('internal/website/campaigns')
@UseGuards(WebsiteApiKeyGuard)
export class WebsiteCampaignsController {
  constructor(
    private readonly campaignsService: CampaignsService,
  ) {}

  @Get('active')
  getActiveCampaigns() {
    return this.campaignsService.getPublicActiveCampaigns();
  }
}