import { Express } from 'express';

export interface UploadResult {
  storageKey: string;

  publicUrl: string;

  filePath: string;
}

export interface StorageProvider {
  upload(file: Express.Multer.File): Promise<UploadResult>;

  delete(storageKey: string): Promise<void>;

  exists?(storageKey: string): Promise<boolean>;

  createPresignedUploadUrl(key: string, expiresIn?: number): Promise<string>;

  createPresignedDownloadUrl(key: string, expiresIn?: number): Promise<string>;

  headObject(key: string): Promise<{
    contentLength?: number;
    contentType?: string;
    etag?: string;
  }>;

  downloadToFile(storageKey: string, destinationPath: string): Promise<void>;
}
