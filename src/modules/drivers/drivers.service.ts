import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';

import { UserRole } from '@prisma/client';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/audit.types';

@Injectable()
export class DriversService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(dto: CreateDriverDto, user: AuthenticatedUser) {
    if (
      user.role !== UserRole.SUPER_ADMIN &&
      user.role !== UserRole.ADMIN &&
      user.role !== UserRole.OPERATIONS
    ) {
      throw new ForbiddenException(
        'You do not have permission to create drivers.',
      );
    }

    const driver = await this.prisma.driver.create({
      data: {
        ...dto,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        licenceExpiry: dto.licenceExpiry
          ? new Date(dto.licenceExpiry)
          : undefined,
      },
    });

    await this.auditService.log({
      actorUserId: user.id,
      actorUserRole: user.role,
      action: AuditAction.DRIVER_CREATED,
      entityType: 'Driver',
      entityId: driver.id,
    });

    return driver;
  }

  async register(dto: CreateDriverDto, user: AuthenticatedUser) {
    if (user.role !== UserRole.VIEWER) {
      throw new ForbiddenException(
        'Only viewer users can register as drivers.',
      );
    }

    if (user.driverId) {
      throw new ConflictException('User is already associated with a driver.');
    }

    return this.prisma.$transaction(async (tx) => {
      const driver = await tx.driver.create({
        data: {
          ...dto,
          dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
          licenceExpiry: dto.licenceExpiry
            ? new Date(dto.licenceExpiry)
            : undefined,
        },
      });

      await tx.user.update({
        where: {
          id: user.id,
        },
        data: {
          role: UserRole.DRIVER,
          driverId: driver.id,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: user.id,
          actorUserRole: user.role,
          action: AuditAction.DRIVER_REGISTERED,
          entityType: 'Driver',
          entityId: driver.id,
          success: true,
        },
      });

      return driver;
    });
  }

  async findAll(user: AuthenticatedUser) {
    if (
      user.role !== UserRole.SUPER_ADMIN &&
      user.role !== UserRole.ADMIN &&
      user.role !== UserRole.OPERATIONS
    ) {
      throw new ForbiddenException(
        'You do not have permission to list drivers.',
      );
    }

    return this.prisma.driver.findMany({
      include: {
        documents: true,
        rickshaws: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string, user: AuthenticatedUser) {
    if (user.role === UserRole.DRIVER) {
      if (!user.driverId) {
        throw new ForbiddenException('User is not associated with a driver.');
      }

      if (id !== user.driverId) {
        throw new NotFoundException('Driver not found');
      }
    } else if (
      user.role !== UserRole.SUPER_ADMIN &&
      user.role !== UserRole.ADMIN &&
      user.role !== UserRole.OPERATIONS
    ) {
      throw new ForbiddenException(
        'You do not have permission to view this driver.',
      );
    }

    const driver = await this.prisma.driver.findUnique({
      where: { id },
      include: {
        documents: true,
        rickshaws: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    return driver;
  }

  async update(id: string, dto: UpdateDriverDto, user: AuthenticatedUser) {
    if (user.role === UserRole.DRIVER) {
      if (!user.driverId) {
        throw new ForbiddenException('User is not associated with a driver.');
      }

      if (id !== user.driverId) {
        throw new NotFoundException('Driver not found');
      }
    } else if (
      user.role !== UserRole.SUPER_ADMIN &&
      user.role !== UserRole.ADMIN &&
      user.role !== UserRole.OPERATIONS
    ) {
      throw new ForbiddenException(
        'You do not have permission to update this driver.',
      );
    }

    const driver = await this.prisma.driver.findUnique({
      where: { id },
    });

    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    const updatedDriver = await this.prisma.driver.update({
      where: { id },
      data: {
        ...dto,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        licenceExpiry: dto.licenceExpiry
          ? new Date(dto.licenceExpiry)
          : undefined,
      },
    });

    await this.auditService.log({
      actorUserId: user.id,
      actorUserRole: user.role,
      action: AuditAction.DRIVER_UPDATED,
      entityType: 'Driver',
      entityId: updatedDriver.id,
      metadata: {
        updatedFields: Object.keys(dto),
      },
    });

    return updatedDriver;
  }

  async remove(id: string, user: AuthenticatedUser) {
    if (user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'You do not have permission to delete drivers.',
      );
    }

    const driver = await this.prisma.driver.findUnique({
      where: { id },
    });

    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    const deletedDriver = await this.prisma.driver.delete({
      where: { id },
    });

    await this.auditService.log({
      actorUserId: user.id,
      actorUserRole: user.role,
      action: AuditAction.DRIVER_DELETED,
      entityType: 'Driver',
      entityId: deletedDriver.id,
    });

    return deletedDriver; 
  }
}
