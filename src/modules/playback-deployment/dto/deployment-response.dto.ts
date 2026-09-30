import { PlaybackManifestDto } from './playback-manifest.dto';

export class DeploymentResponseDto {
  playlistId: string;

  playlistVersion: string;

  manifestHash: string;

  generatedAt: Date;

  manifest: PlaybackManifestDto;
}