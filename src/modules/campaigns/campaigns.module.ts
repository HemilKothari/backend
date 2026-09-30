import { Module } from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { CampaignsController } from './campaigns.controller';
import { PlaylistsModule } from '../playlists/playlists.module';
import { AssignmentsModule } from '../assignments/assignments.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { MediaModule } from '../media/media.module';
import { ReportsModule } from '../reports/reports.module';
import { WebsiteCampaignsController } from './website-campaigns.controller';

@Module({
  imports: [
    PrismaModule,
    AssignmentsModule,
    PlaylistsModule,
    MediaModule,
    ReportsModule
  ],
  providers: [CampaignsService],
  controllers: [CampaignsController, WebsiteCampaignsController],
  exports: [CampaignsService],
})
export class CampaignsModule {}
