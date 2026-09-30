import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { DeviceStatus } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/audit.types';
@Injectable()
export class DevicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreateDeviceDto, actorUserId?: string, actorUserRole?: string) {
    const device = await this.prisma.device.create({
      data: {
        serialNumber: dto.serialNumber,
        simNumber: dto.simNumber,

        status: DeviceStatus.PENDING,
      },
    });

    await this.auditService.log({
      actorUserId,
      actorUserRole,
      action: AuditAction.DEVICE_CREATED,
      entityType: 'Device',
      entityId: device.id,
      metadata: {
        serialNumber: device.serialNumber,
        simNumber: device.simNumber,
      },
    });

    return device;
  }

  findAll() {
    return this.prisma.device.findMany({
      include: {
        rickshaw: true,
        provision: true,
      },
    });
  }

  async findOne(id: string) {
    const device = await this.prisma.device.findUnique({
      where: { id },
      include: {
        rickshaw: true,
        provision: true,
      },
    });

    if (!device) {
      throw new NotFoundException('Device not found.');
    }

    return device;
  }
  async update(id: string, dto: UpdateDeviceDto, actorUserId?: string, actorUserRole?: string) {
    const device = await this.prisma.device.update({
      where: { id },
      data: dto,
    });
    await this.auditService.log({
      actorUserId,
      actorUserRole,
      action: AuditAction.DEVICE_UPDATED,
      entityType: 'Device',
      entityId: device.id,
      metadata: {
        updatedFields: Object.keys(dto),
      },
    });
    return device;
  }

  async remove(id: string, actorUserId?: string, actorUserRole?: string) {
    const device = await this.prisma.device.findUnique({
      where: { id },
    });

    if (!device) {
      throw new NotFoundException('Device not found.');
    }

    await this.auditService.log({
      actorUserId,
      actorUserRole,
      action: AuditAction.DEVICE_DELETED,
      entityType: 'Device',
      entityId: device.id,
    });
    return device;
  }
}
