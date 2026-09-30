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

  async create(dto: CreateDeviceProvisionDto, actorUserId: string, actorUserRole: string) {
    const device = await this.prisma.device.findUnique({
      where: {
        id: dto.deviceId,
      },
      include: {
        provision: true,
      },
    });

    if (!device) {
      throw new NotFoundException('Device not found.');
    }

    if (device.provision) {
      throw new ConflictException('Device is already provisioned.');
    }

    const provisioningToken = generateProvisioningToken();

    const provisioningTokenHash = hashProvisioningToken(provisioningToken);

    const provisioningExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const provision = await this.prisma.deviceProvision.create({
      data: {
        deviceId: dto.deviceId,
        simNumber: dto.simNumber,
        hardwareSerial: dto.hardwareSerial,
        installerName: dto.installerName,
        notes: dto.notes,
        provisioningTokenHash,
        provisioningExpiresAt,
      },
    });

    const qrCode = await generateProvisioningQr(provisioningToken);

    await this.auditService.log({
      actorUserId,
      actorUserRole,
      action: AuditAction.DEVICE_PROVISIONING_CREATED,
      entityType: 'DeviceProvision',
      entityId: provision.id,
      metadata: {
        deviceId: provision.deviceId,
        expiresAt: provision.provisioningExpiresAt,
      },
    });

    return {
      success: true,
      provisionId: provision.id,
      provisioningToken,
      provisioningExpiresAt,
      qrCode,
    };
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

  async activate(id: string) {
    return this.prisma.$transaction(async (tx) => {
      const provision = await tx.deviceProvision.update({
        where: { id },
        data: {
          activatedAt: new Date(),
        },
      });

      await tx.device.update({
        where: {
          id: provision.deviceId,
        },
        data: {
          status: 'ONLINE',
        },
      });

      return provision;
    });
  }
}
