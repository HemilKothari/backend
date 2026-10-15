import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { MediaService } from '../media/media.service';
import { CreateMediaAssetDto } from './dto/create-media-asset.dto';
import { MediaAssetResponseDto } from './dto/media-asset-response.dto';
import { DeleteMediaAssetDto } from './dto/delete-media-asset.dto';
import {
  calculateFileHash,
  calculateFileHashFromPath,
} from 'src/common/utils/hash.util';
import { Prisma } from '@prisma/client';
import { MEDIA_VALIDATION } from 'src/common/constants/media.constant';
import type { MediaMetadata } from '../media/interfaces/media-metadata.interface';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/audit.types';
import { InitiateMediaUploadDto } from './dto/initiate-upload.dto';
import { STORAGE_PROVIDER } from '../storage/constants';
import type { StorageProvider } from '../storage/storage.interface';
import {
  createTempMediaPath,
  removeTempFile,
} from 'src/common/utils/temp-file.util';
import { extname } from 'path';
import { CompleteMediaUploadDto } from './dto/complete-media-upload.dto';

@Injectable()
export class MediaAssetsService {
  private readonly logger = new Logger(MediaAssetsService.name);
  constructor(
    private readonly prisma: PrismaService,

    private readonly mediaService: MediaService,

    private readonly auditService: AuditService,

    @Inject(STORAGE_PROVIDER)
    private readonly storage: StorageProvider,
  ) {}

  async initiateUpload(dto: InitiateMediaUploadDto, user: AuthenticatedUser) {
    let advertiserId: string | null = null;

    if (user.role === 'ADVERTISER') {
      if (!user.advertiserId) {
        throw new ForbiddenException(
          'User is not associated with an advertiser.',
        );
      }

      advertiserId = user.advertiserId;
    } else {
      advertiserId = dto.advertiserId ?? null;
    }

    this.validateUploadRequest(dto);

    const extension = this.getSafeExtension(dto.fileName);

    const storageKey = advertiserId
      ? `media/advertisers/${advertiserId}/${crypto.randomUUID()}${extension}`
      : `media/system/${crypto.randomUUID()}${extension}`;

    const uploadUrl = await this.storage.createPresignedUploadUrl(
      storageKey,
      600,
    );

    return {
      uploadUrl,
      storageKey,
      expiresIn: 600,
    };
  }

  private validateUploadRequest(dto: InitiateMediaUploadDto): void {
    if (!dto.fileName?.trim()) {
      throw new BadRequestException('File name is required.');
    }
  }

  private getSafeExtension(fileName: string): string {
    const extension = extname(fileName).toLowerCase();

    const allowedExtensions = new Set([
      '.jpg',
      '.jpeg',
      '.png',
      '.webp',
      '.mp4',
      '.webm',
      '.mov',
    ]);

    if (!allowedExtensions.has(extension)) {
      throw new BadRequestException('Unsupported media file type.');
    }

    return extension;
  }

  private validateStorageKey(
    storageKey: string,
    user: AuthenticatedUser,
  ): string | null {
    const uuid =
      '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}';

    const extension = '(jpg|jpeg|png|webp|mp4|webm|mov)';

    // Advertiser uploads
    if (user.role === 'ADVERTISER') {
      if (!user.advertiserId) {
        throw new ForbiddenException(
          'User is not associated with an advertiser.',
        );
      }

      const regex = new RegExp(
        `^media/advertisers/(${uuid})/(${uuid})\\.(${extension})$`,
      );

      const match = storageKey.match(regex);

      if (!match) {
        throw new BadRequestException('Invalid storage key.');
      }

      const storageAdvertiserId = match[1];

      if (storageAdvertiserId !== user.advertiserId) {
        throw new ForbiddenException(
          'Storage key does not belong to this advertiser.',
        );
      }

      return storageAdvertiserId;
    }

    // Staff can work with advertiser media
    const advertiserRegex = new RegExp(
      `^media/advertisers/(${uuid})/(${uuid})\\.(${extension})$`,
    );

    const advertiserMatch = storageKey.match(advertiserRegex);

    if (advertiserMatch) {
      return advertiserMatch[1];
    }

    // Staff can also create system media
    const systemRegex = new RegExp(`^media/system/(${uuid})\\.(${extension})$`);

    if (systemRegex.test(storageKey)) {
      return null;
    }

    throw new BadRequestException('Invalid storage key.');
  }

  async completeUpload(
    dto: CompleteMediaUploadDto,
    user: AuthenticatedUser,
  ): Promise<MediaAssetResponseDto> {
    const advertiserId = this.validateStorageKey(dto.storageKey, user);

    if (user.role === 'ADVERTISER' && !advertiserId) {
      throw new ForbiddenException(
        'User is not associated with an advertiser.',
      );
    }

    // 1. Verify storage key ownership
    if (
      advertiserId &&
      !dto.storageKey.startsWith(`media/advertisers/${advertiserId}/`)
    ) {
      throw new ForbiddenException(
        'You do not have access to this media object.',
      );
    }

    if (!advertiserId && !dto.storageKey.startsWith('media/system/')) {
      throw new ForbiddenException('Invalid system media storage key.');
    }

    // 2. Verify object exists and retrieve actual metadata
    const object = await this.storage.headObject(dto.storageKey);

    const actualFileSize = object.contentLength;

    if (!actualFileSize || actualFileSize <= 0) {
      throw new BadRequestException('Uploaded media object is empty.');
    }

    if (actualFileSize > MEDIA_VALIDATION.MAX_FILE_SIZE) {
      await this.storage.delete(dto.storageKey);

      throw new BadRequestException(
        'Media file exceeds the maximum allowed size.',
      );
    }

    const actualMimeType = object.contentType;

    if (!actualMimeType) {
      throw new BadRequestException('Uploaded media has no content type.');
    }

    // 4. Check if this object has already been registered
    const existingMedia = await this.prisma.mediaAsset.findFirst({
      where: {
        storageKey: dto.storageKey,
      },
    });

    if (existingMedia) {
      return this.toResponseDto(existingMedia);
    }

    // 5. Create temporary file
    const extension = extname(dto.storageKey).toLowerCase();

    const tempPath = await createTempMediaPath(extension);

    try {
      // 6. Stream R2 object to temporary file
      await this.storage.downloadToFile(dto.storageKey, tempPath);

      // 7. Extract actual media metadata
      const mediaMetadata = await this.mediaService.getMediaMetadata(
        tempPath,
        dto.imageDuration,
      );

      // 8. Validate media
      this.validateStoredMedia(actualMimeType, actualFileSize, mediaMetadata);

      // 9. Create MediaAsset
      const checksum = await calculateFileHashFromPath(tempPath);

      const existingMediaChecksum = await this.prisma.mediaAsset.findUnique({
        where: { checksum },
      });

      if (existingMediaChecksum) {
        // Same advertiser/system owner
        if (existingMediaChecksum.advertiserId === advertiserId) {
          await this.storage.delete(dto.storageKey);

          return this.toResponseDto(existingMediaChecksum);
        }

        // Same physical content, but owned by another advertiser.
        // Do not reveal that advertiser's media details.
        await this.storage.delete(dto.storageKey);

        throw new ConflictException(
          'A media file with the same content already exists.',
        );
      }

      const mediaAsset = await this.prisma.mediaAsset.create({
        data: {
          advertiserId,

          originalFileName: dto.originalFileName,

          storageKey: dto.storageKey,

          publicUrl: `${process.env.R2_PUBLIC_URL}/${dto.storageKey}`,

          mimeType: actualMimeType,

          checksum,

          fileSize: actualFileSize,

          durationSeconds: mediaMetadata.durationSeconds,

          width: mediaMetadata.width,

          height: mediaMetadata.height,

          orientation: mediaMetadata.orientation,
        },
      });

      // 10. Audit
      await this.auditService.log({
        actorUserId: user.id,
        actorUserRole: user.role,
        action: AuditAction.MEDIA_UPLOADED,
        entityType: 'MediaAsset',
        entityId: mediaAsset.id,
        metadata: {
          advertiserId: mediaAsset.advertiserId,

          originalFileName: mediaAsset.originalFileName,

          mimeType: mediaAsset.mimeType,

          fileSize: mediaAsset.fileSize,

          durationSeconds: mediaAsset.durationSeconds,

          width: mediaAsset.width,

          height: mediaAsset.height,
        },
      });

      return this.toResponseDto(mediaAsset);
    } finally {
      // Always remove temporary file
      await removeTempFile(tempPath);
    }
  }

  private toResponseDto(
    mediaAsset: Prisma.MediaAssetGetPayload<{}>,
  ): MediaAssetResponseDto {
    return {
      id: mediaAsset.id,
      originalFileName: mediaAsset.originalFileName,
      isHouseAd: mediaAsset.isHouseAd,
      active: mediaAsset.active,
      storageKey: mediaAsset.storageKey,
      publicUrl: mediaAsset.publicUrl,
      mimeType: mediaAsset.mimeType,
      checksum: mediaAsset.checksum,
      fileSize: mediaAsset.fileSize,
      durationSeconds: mediaAsset.durationSeconds ?? undefined,
      width: mediaAsset.width ?? undefined,
      height: mediaAsset.height ?? undefined,
      createdAt: mediaAsset.createdAt,
    };
  }

  async upload(
    file: Express.Multer.File,
    dto: CreateMediaAssetDto,
    user: AuthenticatedUser,
  ): Promise<MediaAssetResponseDto> {
    let advertiserId: string | null = null;

    if (user.role === 'ADVERTISER') {
      if (!user.advertiserId) {
        throw new ForbiddenException(
          'User is not associated with an advertiser.',
        );
      }

      advertiserId = user.advertiserId;
    }
    // 1. Validate upload
    if (!file) {
      throw new BadRequestException('Media file is required');
    }
    // 2. Calculate checksum
    const checksum = calculateFileHash(file.buffer);
    // 3. Check for existing media asset with the same checksum
    const existingMedia = await this.prisma.mediaAsset.findUnique({
      where: {
        checksum,
      },
    });
    if (existingMedia) {
      return {
        id: existingMedia.id,

        originalFileName: existingMedia.originalFileName,

        isHouseAd: existingMedia.isHouseAd,

        active: existingMedia.active,

        storageKey: existingMedia.storageKey,

        publicUrl: existingMedia.publicUrl,

        mimeType: existingMedia.mimeType,

        checksum: existingMedia.checksum,

        fileSize: existingMedia.fileSize,

        durationSeconds: existingMedia.durationSeconds ?? undefined,

        width: existingMedia.width ?? undefined,

        height: existingMedia.height ?? undefined,

        createdAt: existingMedia.createdAt,
      };
    }
    // 3. Store media
    const uploadResult = await this.storage.upload(file);
    this.logger.log(`Stored media: ${uploadResult.storageKey}`);
    // 4. Detect metadata
    const mediaMetadata = await this.mediaService.getMediaMetadata(
      uploadResult.filePath,
      dto.imageDuration,
    );
    // 5. Validate media
    this.validateMedia(file, mediaMetadata);

    // 5. Save MediaAsset
    const mediaAsset = await this.prisma.mediaAsset.create({
      data: {
        advertiserId,

        originalFileName: file.originalname,

        storageKey: uploadResult.storageKey,

        publicUrl: uploadResult.publicUrl,

        mimeType: file.mimetype,

        checksum,

        fileSize: file.size,

        durationSeconds: mediaMetadata.durationSeconds,

        width: mediaMetadata.width,

        height: mediaMetadata.height,

        orientation: mediaMetadata.orientation,
      },
    });

    // 6. Log audit
    await this.auditService.log({
      actorUserId: user.id,
      actorUserRole: user.role,
      action: AuditAction.MEDIA_UPLOADED,
      entityType: 'MediaAsset',
      entityId: mediaAsset.id,
      metadata: {
        advertiserId: mediaAsset.advertiserId,
        originalFileName: mediaAsset.originalFileName,
        mimeType: mediaAsset.mimeType,
        fileSize: mediaAsset.fileSize,
        durationSeconds: mediaAsset.durationSeconds,
        width: mediaAsset.width,
        height: mediaAsset.height,
        isHouseAd: mediaAsset.isHouseAd,
        active: mediaAsset.active,
      },
    });

    // 7. Return DTO
    return {
      id: mediaAsset.id,

      originalFileName: mediaAsset.originalFileName,

      isHouseAd: mediaAsset.isHouseAd,

      active: mediaAsset.active,

      storageKey: mediaAsset.storageKey,

      publicUrl: mediaAsset.publicUrl,

      mimeType: mediaAsset.mimeType,

      checksum: mediaAsset.checksum,

      fileSize: mediaAsset.fileSize,

      durationSeconds: mediaAsset.durationSeconds ?? undefined,

      width: mediaAsset.width ?? undefined,

      height: mediaAsset.height ?? undefined,

      createdAt: mediaAsset.createdAt,
    };
  }

  private validateMimeType(file: Express.Multer.File): void {
    const { mimetype } = file;

    if (mimetype.startsWith('image/')) {
      return;
    }

    const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];

    if (allowedVideoTypes.includes(mimetype)) {
      return;
    }

    throw new BadRequestException({
      message: 'Unsupported media type.',
      received: mimetype,
    });
  }

  private validateStoredMedia(
    mimeType: string,
    fileSize: number,
    mediaMetadata: MediaMetadata,
  ): void {
    // MIME TYPE
    const allowedMimeTypes = new Set([
      'image/jpeg',
      'image/png',
      'image/webp',
      'video/mp4',
      'video/webm',
      'video/quicktime',
    ]);

    if (!allowedMimeTypes.has(mimeType)) {
      throw new BadRequestException({
        message: 'Unsupported media type.',
        received: mimeType,
      });
    }

    // FILE SIZE
    if (fileSize > MEDIA_VALIDATION.MAX_FILE_SIZE) {
      throw new BadRequestException({
        message: 'File size exceeds maximum allowed limit.',
        maxSizeMB: MEDIA_VALIDATION.MAX_FILE_SIZE / (1024 * 1024),
      });
    }

    // ORIENTATION
    if (mediaMetadata.orientation !== MEDIA_VALIDATION.REQUIRED_ORIENTATION) {
      throw new BadRequestException({
        message: 'Only portrait media is supported.',
        expected: MEDIA_VALIDATION.REQUIRED_ORIENTATION,
        received: mediaMetadata.orientation,
      });
    }

    // ASPECT RATIO
    const aspectRatio = mediaMetadata.aspectRatio;

    if (
      aspectRatio &&
      (aspectRatio < MEDIA_VALIDATION.MIN_ASPECT_RATIO ||
        aspectRatio > MEDIA_VALIDATION.MAX_ASPECT_RATIO)
    ) {
      throw new BadRequestException({
        message: 'Only 9:16 portrait media is supported.',
        expected: '9:16',
        received: aspectRatio.toFixed(2),
      });
    }

    // DURATION
    if (
      mediaMetadata.durationSeconds < MEDIA_VALIDATION.MIN_DURATION_SECONDS ||
      mediaMetadata.durationSeconds > MEDIA_VALIDATION.MAX_DURATION_SECONDS
    ) {
      throw new BadRequestException({
        message: 'Media duration must be between 10 and 60 seconds.',
        received: mediaMetadata.durationSeconds,
        min: MEDIA_VALIDATION.MIN_DURATION_SECONDS,
        max: MEDIA_VALIDATION.MAX_DURATION_SECONDS,
      });
    }

    // RESOLUTION
    if (
      (mediaMetadata.width ?? 0) < MEDIA_VALIDATION.MIN_WIDTH ||
      (mediaMetadata.height ?? 0) < MEDIA_VALIDATION.MIN_HEIGHT
    ) {
      throw new BadRequestException({
        message: 'Resolution is too low.',
        minimum:
          `${MEDIA_VALIDATION.MIN_WIDTH} x ` + `${MEDIA_VALIDATION.MIN_HEIGHT}`,
        received: `${mediaMetadata.width} x ` + `${mediaMetadata.height}`,
      });
    }
  }

  private validateMedia(
    file: Express.Multer.File,
    mediaMetadata: MediaMetadata,
  ): void {
    // MIME TYPE
    this.validateMimeType(file);

    // FILE SIZE

    if (file.size > MEDIA_VALIDATION.MAX_FILE_SIZE) {
      throw new BadRequestException({
        message: 'File size exceeds maximum allowed limit.',
        maxSizeMB: MEDIA_VALIDATION.MAX_FILE_SIZE / (1024 * 1024),
      });
    }

    // ORIENTATION

    if (mediaMetadata.orientation !== MEDIA_VALIDATION.REQUIRED_ORIENTATION) {
      throw new BadRequestException({
        message: 'Only portrait media is supported.',
        expected: MEDIA_VALIDATION.REQUIRED_ORIENTATION,
        received: mediaMetadata.orientation,
      });
    }

    // ASPECT RATIO

    const aspectRatio = mediaMetadata.aspectRatio;

    if (
      aspectRatio &&
      (aspectRatio < MEDIA_VALIDATION.MIN_ASPECT_RATIO ||
        aspectRatio > MEDIA_VALIDATION.MAX_ASPECT_RATIO)
    ) {
      throw new BadRequestException({
        message: 'Only 9:16 portrait media is supported.',
        expected: '9:16',
        received: aspectRatio.toFixed(2),
      });
    }

    // DURATION

    if (
      mediaMetadata.durationSeconds < MEDIA_VALIDATION.MIN_DURATION_SECONDS ||
      mediaMetadata.durationSeconds > MEDIA_VALIDATION.MAX_DURATION_SECONDS
    ) {
      throw new BadRequestException({
        message: 'Media duration must be between 10 and 60 seconds.',
        received: mediaMetadata.durationSeconds,
        min: MEDIA_VALIDATION.MIN_DURATION_SECONDS,
        max: MEDIA_VALIDATION.MAX_DURATION_SECONDS,
      });
    }

    // RESOLUTION

    if (
      (mediaMetadata.width ?? 0) < MEDIA_VALIDATION.MIN_WIDTH ||
      (mediaMetadata.height ?? 0) < MEDIA_VALIDATION.MIN_HEIGHT
    ) {
      throw new BadRequestException({
        message: 'Resolution is too low.',
        minimum: `${MEDIA_VALIDATION.MIN_WIDTH} x ${MEDIA_VALIDATION.MIN_HEIGHT}`,
        received: `${mediaMetadata.width} x ${mediaMetadata.height}`,
      });
    }
  }

  async findAll(
    page: number,
    limit: number,
    type: 'image' | 'video' | undefined,
    user: AuthenticatedUser,
  ) {
    const skip = (page - 1) * limit;

    const where: Prisma.MediaAssetWhereInput = {};

    if (user.role === 'ADVERTISER') {
      where.advertiserId = user.advertiserId!;
    }

    if (type === 'image') {
      where.mimeType = {
        startsWith: 'image/',
      };
    }

    if (type === 'video') {
      where.mimeType = {
        startsWith: 'video/',
      };
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.mediaAsset.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),

      this.prisma.mediaAsset.count({
        where,
      }),
    ]);

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      items,
    };
  }

  async findOne(id: string, user: AuthenticatedUser) {
    const where =
      user.role === 'ADVERTISER'
        ? {
            id,
            advertiserId: user.advertiserId!,
          }
        : {
            id,
          };
    const media = await this.prisma.mediaAsset.findFirst({
      where,
    });

    if (!media) {
      throw new NotFoundException('Media asset not found');
    }

    return media;
  }

  async deactivate(id: string, user: AuthenticatedUser) {
    const media = await this.prisma.mediaAsset.findUnique({
      where: { id },
    });

    if (!media) {
      throw new NotFoundException('Media asset not found');
    }

    if (!media.active) {
      throw new ConflictException('Media asset is already inactive');
    }

    if (media.isHouseAd) {
      const activeHouseAdCount = await this.prisma.mediaAsset.count({
        where: {
          isHouseAd: true,
          active: true,
        },
      });

      if (activeHouseAdCount <= 1) {
        throw new ConflictException(
          'Cannot deactivate the last active house ad. Activate a replacement first.',
        );
      }
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.mediaAsset.update({
        where: { id },
        data: { active: false },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: user.id,
          actorUserRole: user.role,
          action: AuditAction.MEDIA_DEACTIVATED,
          entityType: 'MediaAsset',
          entityId: id,
          metadata: {
            reason: 'Media asset deactivated',
            originalFileName: media.originalFileName,
            advertiserId: media.advertiserId,
          },
        },
      });

      return result;
    });

    return {
      success: true,
      message: 'Media asset deactivated successfully',
      media: updated,
    };
  }

  async activate(id: string, user: AuthenticatedUser) {
    const media = await this.prisma.mediaAsset.findUnique({
      where: { id },
    });

    if (!media) {
      throw new NotFoundException('Media asset not found');
    }

    if (media.active) {
      throw new ConflictException('Media asset is already active');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.mediaAsset.update({
        where: { id },
        data: { active: true },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: user.id,
          actorUserRole: user.role,
          action: AuditAction.MEDIA_ACTIVATED,
          entityType: 'MediaAsset',
          entityId: id,
          metadata: {
            originalFileName: media.originalFileName,
            advertiserId: media.advertiserId,
          },
        },
      });

      return result;
    });

    return {
      success: true,
      message: 'Media asset activated successfully',
      media: updated,
    };
  }

  async remove(id: string, dto: DeleteMediaAssetDto, user: AuthenticatedUser) {
    const reason = dto.reason?.trim();

    if (!reason) {
      throw new BadRequestException('A deletion reason is required.');
    }

    const media = await this.prisma.mediaAsset.findUnique({
      where: { id },
      include: {
        campaigns: { select: { id: true, status: true } },
        playlistItems: {
          select: {
            id: true,
            playlist: {
              select: { id: true, status: true, deviceId: true },
            },
          },
        },
      },
    });

    if (!media) {
      throw new NotFoundException('Media asset not found');
    }

    if (media.isHouseAd && media.active) {
      const otherActiveHouseAds = await this.prisma.mediaAsset.count({
        where: {
          isHouseAd: true,
          active: true,
          id: { not: media.id },
        },
      });

      if (otherActiveHouseAds === 0) {
        throw new ConflictException(
          'Cannot delete the last active house ad. Configure another active house ad first.',
        );
      }
    }

    if (media.campaigns.length > 0) {
      throw new ConflictException(
        'Media asset is referenced by campaign(s). Resolve campaign references before deletion.',
      );
    }

    if (media.playlistItems.length > 0) {
      throw new ConflictException(
        'Media asset is referenced by playlists or playback history. Resolve playlist references before deletion.',
      );
    }

    // Persist the deletion, audit event, and cleanup job atomically.
    const cleanupJob = await this.prisma.$transaction(async (tx) => {
      const job = await tx.mediaStorageCleanup.create({
        data: {
          mediaId: media.id,
          storageKey: media.storageKey,
          requestedByUserId: user.id,
          reason,
        },
      });

      await tx.mediaAsset.delete({
        where: { id: media.id },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: user.id,
          actorUserRole: user.role,
          action: AuditAction.MEDIA_DELETED,
          entityType: 'MediaAsset',
          entityId: media.id,
          metadata: {
            reason,
            advertiserId: media.advertiserId,
            originalFileName: media.originalFileName,
            mimeType: media.mimeType,
            fileSize: media.fileSize,
            storageKey: media.storageKey,
            storageCleanupJobId: job.id,
            storageCleanupStatus: 'PENDING',
          },
        },
      });

      return job;
    });

    // The database deletion is committed already. Storage failures must not
    // make the API imply that the database transaction was rolled back.
    let cleanupSucceeded = false;

    try {
      const result = await this.processStorageCleanup(cleanupJob.id);
      cleanupSucceeded = result.success;
    } catch (error) {
      this.logger.error(
        `Storage cleanup job ${cleanupJob.id} could not be processed. It remains available for retry.`,
        error instanceof Error ? error.stack : undefined,
      );
    }

    return {
      success: true,
      message: cleanupSucceeded
        ? 'Media asset deleted successfully.'
        : 'Media asset deleted from the database. Storage cleanup is pending.',
      storageCleanup: cleanupSucceeded ? 'COMPLETED' : 'PENDING',
      cleanupJobId: cleanupJob.id,
    };
  }

  private async processStorageCleanup(jobId: string) {
    const job = await this.prisma.mediaStorageCleanup.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundException('Storage cleanup job not found.');
    }

    if (job.status === 'COMPLETED') {
      return { success: true };
    }

    // Handle the storage operation separately from database updates so a
    // database error is never misreported as an R2 deletion failure.
    try {
      await this.storage.delete(job.storageKey);
    } catch (error) {
      const safeError = 'R2 object deletion failed; retry required.';

      this.logger.error(
        `R2 deletion failed for cleanup job ${job.id}.`,
        error instanceof Error ? error.stack : undefined,
      );

      try {
        await this.prisma.mediaStorageCleanup.update({
          where: { id: job.id },
          data: {
            attempts: { increment: 1 },
            lastError: safeError,
          },
        });
      } catch (updateError) {
        this.logger.error(
          `Could not update failed cleanup job ${job.id}; it should be retried.`,
          updateError instanceof Error ? updateError.stack : undefined,
        );
      }

      try {
        await this.prisma.auditLog.create({
          data: {
            actorUserId: job.requestedByUserId,
            action: AuditAction.MEDIA_STORAGE_CLEANUP_FAILED,
            entityType: 'MediaStorageCleanup',
            entityId: job.id,
            success: false,
            metadata: {
              storageKey: job.storageKey,
              reason: job.reason,
              error: safeError,
            },
          },
        });
      } catch (auditError) {
        this.logger.error(
          `Could not write cleanup-failure audit event for job ${job.id}.`,
          auditError instanceof Error ? auditError.stack : undefined,
        );
      }

      return { success: false };
    }

    // R2 deletion succeeded. If this update fails, leave the job retryable.
    // Repeating an object deletion is safe.
    await this.prisma.mediaStorageCleanup.update({
      where: { id: job.id },
      data: {
        status: 'COMPLETED',
        attempts: { increment: 1 },
        lastError: null,
        completedAt: new Date(),
      },
    });

    return { success: true };
  }

  async retryPendingStorageCleanup() {
    const jobs = await this.prisma.mediaStorageCleanup.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
      take: 50,
      select: { id: true },
    });

    let completed = 0;
    let pending = 0;

    for (const job of jobs) {
      try {
        const result = await this.processStorageCleanup(job.id);

        if (result.success) {
          completed++;
        } else {
          pending++;
        }
      } catch (error) {
        // Keep processing the batch if one job encounters a database error.
        pending++;

        this.logger.error(
          `Could not retry cleanup job ${job.id}.`,
          error instanceof Error ? error.stack : undefined,
        );
      }
    }

    return {
      processed: jobs.length,
      completed,
      pending,
    };
  }
}
