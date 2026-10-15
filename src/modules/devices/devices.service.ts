
import { Injectable, NotFoundException } from '@nestjs/common';
import { DeviceStatus, Prisma } from '@prisma/client';
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

const PROVISIONING_TOKEN_TTL_MS = 30 * 60 * 1000;

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
    // Generate everything that can fail before changing the database.
    const provisioningToken = generateProvisioningToken();
    const provisioningTokenHash = hashProvisioningToken(provisioningToken);
    const provisioningExpiresAt = new Date(
      Date.now() + PROVISIONING_TOKEN_TTL_MS,
    );
    const qrCode = await generateProvisioningQr(provisioningToken);

    const result = await this.prisma.$transaction(async (tx) => {
      // Reuse the newest device that has never been provisioned.
      const existingDevice = await tx.device.findFirst({
        where: {
          status: DeviceStatus.PENDING,
          provision: {
            is: {
              activatedAt: null,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          provision: true,
        },
      });

      if (existingDevice?.provision) {
        const currentProvision = existingDevice.provision;

        // Compare-and-swap protects against concurrent token rotations.
        const rotated = await tx.deviceProvision.updateMany({
          where: {
            id: currentProvision.id,
            activatedAt: null,
            provisioningTokenHash: currentProvision.provisioningTokenHash,
          },
          data: {
            provisioningTokenHash,
            provisioningExpiresAt,
          },
        });

        if (rotated.count !== 1) {
          throw new Error(
            'The device provisioning record changed. Please retry.',
          );
        }

        await tx.auditLog.create({
          data: {
            actorUserId,
            actorUserRole,
            action: AuditAction.DEVICE_PROVISIONING_CREATED,
            entityType: 'DeviceProvision',
            entityId: currentProvision.id,
            metadata: {
              deviceId: existingDevice.id,
              expiresAt: provisioningExpiresAt.toISOString(),
              regenerated: true,
              source: 'devices.create',
            },
          },
        });

        return {
          device: existingDevice,
          provisionId: currentProvision.id,
          reused: true,
        };
      }

      // A pending device without a provision record is also eligible.
      const pendingWithoutProvision = await tx.device.findFirst({
        where: {
          status: DeviceStatus.PENDING,
          provision: {
            is: null,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (pendingWithoutProvision) {
        const provision = await tx.deviceProvision.create({
          data: {
            deviceId: pendingWithoutProvision.id,
            provisioningTokenHash,
            provisioningExpiresAt,
          },
        });

        await tx.auditLog.create({
          data: {
            actorUserId,
            actorUserRole,
            action: AuditAction.DEVICE_PROVISIONING_CREATED,
            entityType: 'DeviceProvision',
            entityId: provision.id,
            metadata: {
              deviceId: pendingWithoutProvision.id,
              expiresAt: provisioningExpiresAt.toISOString(),
              regenerated: false,
              source: 'devices.create',
            },
          },
        });

        return {
          device: pendingWithoutProvision,
          provisionId: provision.id,
          reused: true,
        };
      }

      // No eligible device exists, so create a new one.
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

      return {
        device,
        provisionId: provision.id,
        reused: false,
      };
    });

    return {
      success: true,
      device: result.device,
      provisioning: {
        provisionId: result.provisionId,
        provisioningToken,
        provisioningExpiresAt,
        qrCode,
      },
      reused: result.reused,
    };
  }

  findAll() {
    return this.prisma.device.findMany({
      include: {
        rickshaw: true,
        provision: true,
      },
      orderBy: {
        createdAt: 'desc',
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
