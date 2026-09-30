import { HeartbeatDto } from './../player-runtime/dto/heartbeat.dto';
import { Injectable } from '@nestjs/common';
import { R2StorageService } from './r2-storage.service';

@Injectable()
export class StorageService {
  constructor(private readonly r2StorageService: R2StorageService) {}

  upload(key: string, body: Buffer, contentType: string) {
    return this.r2StorageService.upload(key, body, contentType);
  }

  exists(key: string) {
    return this.r2StorageService.exists(key);
  }

  delete(key: string) {
    return this.r2StorageService.delete(key);
  }

  getObject(key: string) {
    return this.r2StorageService.getObject(key);
  }

  async createPresignedUploadUrl(
    key: string,
    expiresIn = 600,
  ): Promise<string> {
    return this.r2StorageService.createPresignedUploadUrl(key, expiresIn);
  }

  async createPresignedDownloadUrl(
    key: string,
    expiresIn = 600,
  ): Promise<string> {
    return this.r2StorageService.createPresignedDownloadUrl(key, expiresIn);
  }

  async headObject(key: string) {
    return this.r2StorageService.headObject(key);
  }

  async downloadToFile(
    storageKey: string,
    destinationPath: string,
  ): Promise<void> {
    return this.r2StorageService.downloadToFile(storageKey, destinationPath);
  }
}
