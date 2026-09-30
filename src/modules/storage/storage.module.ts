import { Global, Module } from '@nestjs/common';

import { StorageService } from './storage.service';
import { R2StorageService } from './r2-storage.service';
import { STORAGE_PROVIDER } from './constants';

@Global()
@Module({
  providers: [
    StorageService,
    R2StorageService,
    {
      provide: STORAGE_PROVIDER,
      useExisting: StorageService,
    },
  ],
  exports: [
    StorageService,
    R2StorageService,
    STORAGE_PROVIDER,
  ],
})
export class StorageModule {}