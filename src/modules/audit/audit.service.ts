import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAuditLogInput } from './audit.types';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(input: CreateAuditLogInput) {
    return this.prisma.auditLog.create({
      data: {
        actorUserId: input.actorUserId,
        actorDeviceId: input.actorDeviceId,
        actorUserRole: input.actorUserRole,

        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,

        success: input.success ?? true,

        ipAddress: input.ipAddress,
        userAgent: input.userAgent,

        metadata: input.metadata,
      },
    });
  }
}