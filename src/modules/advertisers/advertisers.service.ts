import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

import { CreateAdvertiserDto } from './dto/create-advertiser.dto';
import { UpdateAdvertiserDto } from './dto/update-advertiser.dto';

import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { UserRole } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/audit.types';

@Injectable()
export class AdvertisersService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  /**
   * Internal/admin creation of an advertiser.
   *
   * This does NOT change the role of the logged-in user.
   */
  async create(data: CreateAdvertiserDto, user: AuthenticatedUser) {
    if (
      user.role !== UserRole.SUPER_ADMIN &&
      user.role !== UserRole.ADMIN &&
      user.role !== UserRole.OPERATIONS
    ) {
      throw new ForbiddenException(
        'You do not have permission to create advertisers.',
      );
    }

    const advertiser = await this.prisma.advertiser.create({
      data,
    });

    await this.auditService.log({
      actorUserId: user.id,
      actorUserRole: user.role,
      action: AuditAction.ADVERTISER_CREATED,
      entityType: 'Advertiser',
      entityId: advertiser.id,
      metadata: {
        companyName: advertiser.companyName,
        contactName: advertiser.contactName,
      },
    });

    return advertiser;
  }

  /**
   * Self-registration:
   *
   * VIEWER
   *   ↓
   * ADVERTISER + advertiserId
   *
   * The advertiser creation and user update happen
   * inside one database transaction.
   */
  async register(data: CreateAdvertiserDto, user: AuthenticatedUser) {
    if (user.role !== UserRole.VIEWER) {
      throw new ForbiddenException(
        'Only viewer users can register as advertisers.',
      );
    }

    if (user.advertiserId) {
      throw new ConflictException(
        'User is already associated with an advertiser.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const advertiser = await tx.advertiser.create({
        data: {
          companyName: data.companyName,
          contactName: data.contactName,
        },
      });

      await tx.user.update({
        where: {
          id: user.id,
        },
        data: {
          role: UserRole.ADVERTISER,
          advertiserId: advertiser.id,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: user.id,
          action: AuditAction.ADVERTISER_REGISTERED,
          entityType: 'Advertiser',
          entityId: advertiser.id,
          success: true,
          metadata: {
            companyName: advertiser.companyName,
            contactName: advertiser.contactName,
          },
        },
      });

      return advertiser;
    });
  }

  /**
   * List advertisers.
   *
   * Internal/platform operation only.
   */
  async findAll(user: AuthenticatedUser) {
    if (
      user.role !== UserRole.SUPER_ADMIN &&
      user.role !== UserRole.ADMIN &&
      user.role !== UserRole.OPERATIONS
    ) {
      throw new ForbiddenException(
        'You do not have permission to list advertisers.',
      );
    }

    return this.prisma.advertiser.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Get one advertiser.
   *
   * Advertisers may only access their own advertiser record.
   */
  async findOne(id: string, user: AuthenticatedUser) {
    if (user.role === UserRole.ADVERTISER) {
      if (!user.advertiserId) {
        throw new ForbiddenException(
          'User is not associated with an advertiser.',
        );
      }

      if (id !== user.advertiserId) {
        throw new NotFoundException('Advertiser not found');
      }
    } else if (
      user.role !== UserRole.SUPER_ADMIN &&
      user.role !== UserRole.ADMIN &&
      user.role !== UserRole.OPERATIONS
    ) {
      throw new ForbiddenException(
        'You do not have permission to view this advertiser.',
      );
    }

    const advertiser = await this.prisma.advertiser.findUnique({
      where: { id },
    });

    if (!advertiser) {
      throw new NotFoundException('Advertiser not found');
    }

    return advertiser;
  }

  /**
   * Update advertiser.
   *
   * Advertisers may only update their own advertiser record.
   */
  async update(id: string, data: UpdateAdvertiserDto, user: AuthenticatedUser) {
    if (user.role === UserRole.ADVERTISER) {
      if (!user.advertiserId) {
        throw new ForbiddenException(
          'User is not associated with an advertiser.',
        );
      }

      if (id !== user.advertiserId) {
        throw new NotFoundException('Advertiser not found');
      }
    } else if (
      user.role !== UserRole.SUPER_ADMIN &&
      user.role !== UserRole.ADMIN &&
      user.role !== UserRole.OPERATIONS
    ) {
      throw new ForbiddenException(
        'You do not have permission to update this advertiser.',
      );
    }

    const advertiser = await this.prisma.advertiser.findUnique({
      where: { id },
    });

    if (!advertiser) {
      throw new NotFoundException('Advertiser not found');
    }

    const updatedAdvertiser = await this.prisma.advertiser.update({
      where: { id },
      data,
    });

    await this.auditService.log({
      actorUserId: user.id,
      actorUserRole: user.role,
      action: AuditAction.ADVERTISER_UPDATED,
      entityType: 'Advertiser',
      entityId: updatedAdvertiser.id,
      metadata: {
        updatedFields: Object.keys(data),
      },
    });

    return updatedAdvertiser;
  }

  /**
   * Delete advertiser.
   *
   * Restricted to SUPER_ADMIN and ADMIN.
   */
  async remove(id: string, user: AuthenticatedUser) {
    if (user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'You do not have permission to delete advertisers.',
      );
    }

    const advertiser = await this.prisma.advertiser.findUnique({
      where: { id },
    });

    if (!advertiser) {
      throw new NotFoundException('Advertiser not found');
    }

    const deletedAdvertiser = await this.prisma.advertiser.delete({
      where: { id },
    });

    await this.auditService.log({
      actorUserId: user.id,
      actorUserRole: user.role,
      action: AuditAction.ADVERTISER_DELETED,
      entityType: 'Advertiser',
      entityId: deletedAdvertiser.id,
    });

    return deletedAdvertiser;
  }
}
