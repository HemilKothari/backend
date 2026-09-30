import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AdvertisersModule } from './modules/advertisers/advertisers.module';
import { CampaignsModule } from './modules/campaigns/campaigns.module';
import { DevicesModule } from './modules/devices/devices.module';
import { PlaylistsModule } from './modules/playlists/playlists.module';
import { TelemetryModule } from './modules/telemetry/telemetry.module';
import { DriversModule } from './modules/drivers/drivers.module';
import { ReportsModule } from './modules/reports/reports.module';
import { RickshawModule } from './modules/rickshaws/rickshaws.module';
import { DeviceProvisionModule } from './modules/device-provision/device-provision.module';
import { PlaybackDeploymentModule } from './modules/playback-deployment/playback-deployment.module';
import { AssignmentsModule } from './modules/assignments/assignments.module';
import { ScheduleModule } from '@nestjs/schedule';
import { DriverDocumentsModule } from './modules/driver-documents/driver-documents.module';
import { DriverActivityModule } from './modules/driver-activity/driver-activity.module';
import { DriverPayoutModule } from './modules/driver-payout/driver-payout.module';
import { SchedulerModule } from './jobs/scheduler.module';
import { MediaAssetsModule } from './modules/media-assets/media-assets.module';
import { PlayerRuntimeModule } from './modules/player-runtime/player-runtime.module';
import { AuthModule } from './modules/auth/auth.module';
import { AuditModule } from './modules/audit/audit.module';
import { StorageModule } from './modules/storage/storage.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000,
        limit: 100,
      },

      {
        name: 'auth',
        ttl: 60000,
        limit: 10,
      },

      {
        name: 'provision',
        ttl: 60000,
        limit: 10,
      },

      {
        name: 'player',
        ttl: 60000,
        limit: 300,
      },
    ]),
    PrismaModule,
    AdvertisersModule,
    CampaignsModule,
    DevicesModule,
    PlaylistsModule,
    TelemetryModule,
    DriversModule,
    ReportsModule,
    RickshawModule,
    DeviceProvisionModule,
    PlaybackDeploymentModule,
    AssignmentsModule,
    ScheduleModule.forRoot(),
    SchedulerModule,
    DriverDocumentsModule,
    DriverActivityModule,
    DriverPayoutModule,
    MediaAssetsModule,
    PlayerRuntimeModule,
    AuthModule,
    AuditModule,
    StorageModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
