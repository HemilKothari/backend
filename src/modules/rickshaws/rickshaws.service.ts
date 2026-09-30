import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';

import { CreateRickshawDto } from './dto/create-rickshaw.dto';
import { UpdateRickshawDto } from './dto/update-rickshaw.dto';

import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/audit.types';

@Injectable()
export class RickshawsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreateRickshawDto, user: AuthenticatedUser) {
    const driver = await this.prisma.driver.findUnique({
      where: {
        id: dto.driverId,
      },
    });

    if (!driver) {
      throw new NotFoundException('Driver not found.');
    }

    if (!driver.active) {
      throw new ForbiddenException(
        'Cannot assign a Rickshaw to an inactive driver.',
      );
    }

    const rickshaw = await this.prisma.rickshaw.create({
      data: {
        registrationNumber: dto.registrationNumber,
        ownerName: dto.ownerName,
        ownerPhone: dto.ownerPhone,
        vehicleType: dto.vehicleType,

        insuranceExpiry: dto.insuranceExpiry
          ? new Date(dto.insuranceExpiry)
          : undefined,

        pucExpiry: dto.pucExpiry ? new Date(dto.pucExpiry) : undefined,

        permitExpiry: dto.permitExpiry ? new Date(dto.permitExpiry) : undefined,

        driver: {
          connect: {
            id: dto.driverId,
          },
        },
      },
    });

    await this.auditService.log({
      actorUserId: user.id,
      actorUserRole: user.role,

      action: AuditAction.RICKSHAW_CREATED,
      entityType: 'Rickshaw',
      entityId: rickshaw.id,

      metadata: {
        driverId: rickshaw.driverId,
        registrationNumber: rickshaw.registrationNumber,
        vehicleType: rickshaw.vehicleType,
      },
    });

    return rickshaw;
  }

  async findAll() {
    return this.prisma.rickshaw.findMany({
      include: {
        driver: true,
        device: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string, user: AuthenticatedUser) {
    if (user.role === 'DRIVER') {
      if (!user.driverId) {
        throw new ForbiddenException(
          'Driver account is not linked to a driver profile.',
        );
      }

      const rickshaw = await this.prisma.rickshaw.findFirst({
        where: {
          id,
          driverId: user.driverId,
        },
        include: {
          driver: true,
          device: true,
        },
      });

      if (!rickshaw) {
        throw new NotFoundException('Rickshaw not found.');
      }

      return rickshaw;
    }

    const rickshaw = await this.prisma.rickshaw.findUnique({
      where: { id },
      include: {
        driver: true,
        device: true,
      },
    });

    if (!rickshaw) {
      throw new NotFoundException('Rickshaw not found.');
    }

    return rickshaw;
  }

  async update(id: string, dto: UpdateRickshawDto, user: AuthenticatedUser) {
    const existing = await this.prisma.rickshaw.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Rickshaw not found.');
    }

    const updatedRickshaw = await this.prisma.rickshaw.update({
      where: { id },
      data: {
        registrationNumber: dto.registrationNumber,
        ownerName: dto.ownerName,
        ownerPhone: dto.ownerPhone,
        vehicleType: dto.vehicleType,

        insuranceExpiry: dto.insuranceExpiry
          ? new Date(dto.insuranceExpiry)
          : undefined,

        pucExpiry: dto.pucExpiry ? new Date(dto.pucExpiry) : undefined,

        permitExpiry: dto.permitExpiry ? new Date(dto.permitExpiry) : undefined,
      },
    });

    await this.auditService.log({
      actorUserId: user.id,
      actorUserRole: user.role,

      action: AuditAction.RICKSHAW_UPDATED,
      entityType: 'Rickshaw',
      entityId: updatedRickshaw.id,

      metadata: {
        driverId: updatedRickshaw.driverId,
        updatedFields: Object.keys(dto),
      },
    });

    return updatedRickshaw;
  }

  async remove(id: string, user: AuthenticatedUser) {
    const existing = await this.prisma.rickshaw.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Rickshaw not found.');
    }

    const deletedRickshaw = await this.prisma.rickshaw.delete({
      where: { id },
    });

    await this.auditService.log({
      actorUserId: user.id,
      actorUserRole: user.role,

      action: AuditAction.RICKSHAW_DELETED,
      entityType: 'Rickshaw',
      entityId: deletedRickshaw.id,

      metadata: {
        driverId: deletedRickshaw.driverId,
        registrationNumber: deletedRickshaw.registrationNumber,
      },
    });

    return deletedRickshaw;
  }
}
