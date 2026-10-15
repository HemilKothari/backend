export class MediaAssetResponseDto {
  id: string;

  originalFileName: string;

  isHouseAd: boolean;

  active: boolean;

  storageKey: string;

  publicUrl: string;

  mimeType: string;

  checksum: string;

  fileSize: number;

  durationSeconds?: number;

  width?: number;

  height?: number;

  createdAt: Date;
}