import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateDeviceProvisionDto } from './dto/create-device-provision.dto';
import {
  generateProvisioningToken,
  hashProvisioningToken,
} from 'src/common/utils/provisioning-token.util';
import { generateProvisioningQr } from 'src/common/utils/qr.util';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/audit.types';

@Injectable()
export class DeviceProvisionService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(
    dto: CreateDeviceProvisionDto,
    actorUserId: string,
    actorUserRole: string,
  ) {
    const device = await this.prisma.device.findUnique({
      where: { id: dto.deviceId },
      include: { provision: true },
    });

    if (!device) {
      throw new NotFoundException('Device not found.');
    }

    if (device.provision?.activatedAt) {
      throw new ConflictException(
        'This device has already been activated and cannot be reprovisioned using this endpoint.',
      );
    }

    const now = new Date();
    const existing = device.provision;

    const provisioningToken = generateProvisioningToken();
    const provisioningTokenHash = hashProvisioningToken(provisioningToken);
    const provisioningExpiresAt = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes

    // Generate the QR before changing the database.
    const qrCode = await generateProvisioningQr(provisioningToken);

    return this.prisma.$transaction(async (tx) => {
      const current = await tx.deviceProvision.findUnique({
        where: { deviceId: dto.deviceId },
      });

      let provision;

      if (current) {
        if (current.activatedAt) {
          throw new ConflictException(
            'This device has already been activated.',
          );
        }

        const currentNow = new Date();

        const updated = await tx.deviceProvision.updateMany({
          where: {
            id: current.id,
            activatedAt: null,
            OR: [
              { provisioningTokenHash: null },
              { provisioningExpiresAt: { lte: currentNow } },
            ],
          },
          data: {
            provisioningTokenHash,
            provisioningExpiresAt,
            ...(dto.installerName !== undefined && {
              installerName: dto.installerName,
            }),
            ...(dto.notes !== undefined && {
              notes: dto.notes,
            }),
          },
        });

        if (updated.count !== 1) {
          throw new ConflictException(
            'The provisioning record changed. Please retry.',
          );
        }

        provision = await tx.deviceProvision.findUniqueOrThrow({
          where: { id: current.id },
        });
      } else {
        provision = await tx.deviceProvision.create({
          data: {
            deviceId: dto.deviceId,
            provisioningTokenHash,
            provisioningExpiresAt,
            installerName: dto.installerName,
            notes: dto.notes,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          actorUserId,
          actorUserRole,
          action: AuditAction.DEVICE_PROVISIONING_CREATED,
          entityType: 'DeviceProvision',
          entityId: provision.id,
          metadata: {
            deviceId: provision.deviceId,
            expiresAt: provisioningExpiresAt.toISOString(),
            regenerated: Boolean(current),
          },
        },
      });

      return {
        success: true,
        provisionId: provision.id,
        provisioningToken,
        provisioningExpiresAt,
        qrCode,
      };
    });
  }

  findAll() {
    return this.prisma.deviceProvision.findMany({
      include: {
        device: true,
      },
    });
  }

  findOne(id: string) {
    return this.prisma.deviceProvision.findUnique({
      where: { id },

      include: {
        device: true,
      },
    });
  }
}
