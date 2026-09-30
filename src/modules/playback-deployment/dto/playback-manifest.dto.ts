export class PlaybackManifestDto {
  deviceId: string;

  playlistId: string;

  version: string;

  generatedAt: Date;

  items: PlaybackManifestItemDto[];
}

export class PlaybackManifestItemDto {
  playlistItemId: string;

  position: number;

  campaignId: string | null;

  mediaAssetId: string | null;

  mimeType: string | null;

  mediaUrl: string | null;

  checksum: string | null;

  durationSeconds: number;

  type: string;
}