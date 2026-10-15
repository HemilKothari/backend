import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';

import { MediaAssetsService } from './media-assets.service';

import { CreateMediaAssetDto } from './dto/create-media-asset.dto';
import { ApiOperation, ApiQuery } from '@nestjs/swagger';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { InitiateMediaUploadDto } from './dto/initiate-upload.dto';
import { CompleteMediaUploadDto } from './dto/complete-media-upload.dto';
import { DeleteMediaAssetDto } from './dto/delete-media-asset.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.OPERATIONS,
  UserRole.ADVERTISER,
)
@Controller('media-assets')
export class MediaAssetsController {
  constructor(private readonly mediaAssetsService: MediaAssetsService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateMediaAssetDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.mediaAssetsService.upload(file, dto, user);
  }

  @Post('upload/initiate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.OPERATIONS,
    UserRole.ADVERTISER,
  )
  async initiateUpload(
    @Body() dto: InitiateMediaUploadDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.mediaAssetsService.initiateUpload(dto, user);
  }

  @Post('upload/complete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.OPERATIONS,
    UserRole.ADVERTISER,
  )
  async completeUpload(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CompleteMediaUploadDto,
  ) {
    return this.mediaAssetsService.completeUpload(dto, user);
  }

  @Post('storage-cleanup/retry')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  retryPendingStorageCleanup() {
    return this.mediaAssetsService.retryPendingStorageCleanup();
  }

  @Get()
  @ApiOperation({ summary: 'Get all media assets' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 20,
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['image', 'video'],
    description: 'Filter by media type',
  })
  findAll(
    @Query() pagination: PaginationQueryDto,
    @Query('type') type: 'image' | 'video' | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.mediaAssetsService.findAll(
      pagination.page,
      pagination.limit,
      type,
      user,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.mediaAssetsService.findOne(id, user);
  }

  @Patch(':id/deactivate')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OPERATIONS)
  deactivate(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.mediaAssetsService.deactivate(id, user);
  }

  @Patch(':id/activate')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OPERATIONS)
  activate(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.mediaAssetsService.activate(id, user);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  remove(
    @Param('id') id: string,
    @Body() dto: DeleteMediaAssetDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.mediaAssetsService.remove(id, dto, user);
  }
}
