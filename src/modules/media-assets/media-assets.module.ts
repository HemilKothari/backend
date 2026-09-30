import { Module } from '@nestjs/common';
import { MediaAssetsService } from './media-assets.service';
import { MediaAssetsController } from './media-assets.controller';
import { MediaModule } from '../media/media.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [MediaModule, StorageModule],
  providers: [MediaAssetsService],
  controllers: [MediaAssetsController]
})
export class MediaAssetsModule {}
