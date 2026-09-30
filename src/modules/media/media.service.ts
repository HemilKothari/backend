import { Injectable, BadRequestException } from '@nestjs/common';
import ffmpeg from 'fluent-ffmpeg';
import ffprobe from 'ffprobe-static';
import sharp from 'sharp';
import type { MediaMetadata } from './interfaces/media-metadata.interface';
import { MediaOrientation } from '@prisma/client';

ffmpeg.setFfprobePath(ffprobe.path);

@Injectable()
export class MediaService {
  async getMediaMetadata(
    mediaPath: string,
    imageDuration?: number,
  ): Promise<MediaMetadata> {
    const extension = mediaPath.split('.').pop()?.toLowerCase();

    const imageExtensions = ['jpg', 'jpeg', 'png', 'webp'];

    if (extension && imageExtensions.includes(extension)) {
      if (!imageDuration) {
        throw new BadRequestException('Image duration required');
      }

      return this.getImageMetadata(mediaPath, imageDuration!);
    }

    return this.getVideoMetadata(mediaPath);
  }

  async getVideoMetadata(mediaPath: string): Promise<MediaMetadata> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(mediaPath, (err, metadata) => {
        if (err) {
          reject(err);
          return;
        }

        const videoStream = metadata.streams.find(
          (stream) => stream.codec_type === 'video',
        );

        const aspectRatio =
          metadata.width && metadata.height
            ? metadata.height / metadata.width
            : 0;

        resolve({
          durationSeconds: Math.ceil(metadata.format.duration ?? 10),

          width: videoStream?.width,

          height: videoStream?.height,

          orientation: this.getOrientation(
            videoStream?.width,
            videoStream?.height,
          ),

          aspectRatio,
        });
      });
    });
  }

  private async getImageMetadata(
    mediaPath: string,
    imageDuration: number,
  ): Promise<MediaMetadata> {
    const metadata = await sharp(mediaPath).metadata();

    const aspectRatio =
      metadata.width && metadata.height
        ? metadata.height / metadata.width
        : 0;

    return {
      durationSeconds: imageDuration,

      width: metadata.width,

      height: metadata.height,

      orientation: this.getOrientation(metadata.width, metadata.height),

      aspectRatio,
    };
  }

  private getOrientation(width?: number, height?: number): MediaOrientation {
    if (!width || !height) {
      return 'UNDEFINED';
    }

    if (width > height) {
      return 'LANDSCAPE';
    }

    if (height > width) {
      return 'PORTRAIT';
    }

    return 'SQUARE';
  }
}
