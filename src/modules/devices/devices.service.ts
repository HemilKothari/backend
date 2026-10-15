import { Injectable, NotFoundException } from '@nestjs/common';
import { DeviceStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/audit.types';
import {
  generateProvisioningToken,
  hashProvisioningToken,
} from 'src/common/utils/provisioning-token.util';
import { generateProvisioningQr } from 'src/common/utils/qr.util';

@Injectable()
export class DevicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(
    _dto: CreateDeviceDto,
    actorUserId?: string,
    actorUserRole?: string,
  ) {
    const provisioningToken = generateProvisioningToken();
    const provisioningTokenHash = hashProvisioningToken(provisioningToken);

    const provisioningExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Generate the QR before writing to the database.
    // If QR generation fails, no device or provision record is created.
    const qrCode = await generateProvisioningQr(provisioningToken);

    const created = await this.prisma.$transaction(async (tx) => {
      const device = await tx.device.create({
        data: {
          status: DeviceStatus.PENDING,
        },
      });

      const provision = await tx.deviceProvision.create({
        data: {
          deviceId: device.id,
          provisioningTokenHash,
          provisioningExpiresAt,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId,
          actorUserRole,
          action: AuditAction.DEVICE_CREATED,
          entityType: 'Device',
          entityId: device.id,
          metadata: {
            status: device.status,
            provisioningExpiresAt: provisioningExpiresAt.toISOString(),
          },
        },
      });

      return { device, provision };
    });

    return {
      success: true,
      device: created.device,
      provisioning: {
        provisionId: created.provision.id,
        provisioningToken,
        provisioningExpiresAt,
        qrCode,
      },
    };
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

  async update(
    id: string,
    dto: UpdateDeviceDto,
    actorUserId?: string,
    actorUserRole?: string,
  ) {
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
