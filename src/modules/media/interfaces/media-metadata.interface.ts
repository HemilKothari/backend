import { MediaOrientation } from '@prisma/client';

export interface MediaMetadata {
  durationSeconds: number;

  width?: number;

  height?: number;

  orientation: MediaOrientation;

  aspectRatio?: number;
}