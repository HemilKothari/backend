import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';

import { CreateDriverDocumentDto } from './dto/create-driver-document.dto';
import { VerifyDriverDocumentDto } from './dto/verify-driver-document.dto';
import { UpdateDriverDocumentDto } from './dto/update-driver-document.dto';

import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

import { UserRole, VerificationStatus } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/audit.types';

@Injectable()
export class DriverDocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  // =========================================================
  // DRIVER UPLOADS OWN DOCUMENT
  // =========================================================

  async createForDriver(dto: CreateDriverDocumentDto, user: AuthenticatedUser) {
    if (!user.driverId) {
      throw new ForbiddenException(
        'Driver account is not linked to a driver profile.',
      );
    }

    return this.createDocument(user.driverId, dto, user);
  }

  // =========================================================
  // STAFF UPLOADS DOCUMENT FOR DRIVER
  // =========================================================

  async createForDriverByStaff(
    driverId: string,
    dto: CreateDriverDocumentDto,
    user: AuthenticatedUser,
  ) {
    return this.createDocument(driverId, dto, user);
  }

  // =========================================================
  // COMMON DOCUMENT CREATION
  // =========================================================

  private async createDocument(
    driverId: string,
    dto: CreateDriverDocumentDto,
    user: AuthenticatedUser,
  ) {
    const driver = await this.prisma.driver.findUnique({
      where: {
        id: driverId,
      },
    });

    if (!driver) {
      throw new NotFoundException('Driver not found.');
    }

    const existing = await this.prisma.driverDocument.findUnique({
      where: {
        driverId_documentType: {
          driverId,
          documentType: dto.documentType,
        },
      },
    });

    if (existing) {
      throw new BadRequestException(`${dto.documentType} already uploaded.`);
    }

    const document = await this.prisma.driverDocument.create({
      data: {
        driverId,
        documentType: dto.documentType,
        fileUrl: dto.fileUrl,

        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
      },
    });

    await this.auditService.log({
      actorUserId: user.id,
      actorUserRole: user.role,

      action: AuditAction.DRIVER_DOCUMENT_CREATED,
      entityType: 'DriverDocument',
      entityId: document.id,

      metadata: {
        driverId,
        documentType: document.documentType,
      },
    });

    return document;
  }

  // =========================================================
  // FIND ALL
  // =========================================================

  async findAll() {
    return this.prisma.driverDocument.findMany({
      include: {
        driver: true,
      },

      orderBy: {
        uploadedAt: 'desc',
      },
    });
  }

  // =========================================================
  // FIND ONE
  // =========================================================

  async findOne(id: string, user: AuthenticatedUser) {
    const document = await this.prisma.driverDocument.findUnique({
      where: {
        id,
      },

      include: {
        driver: true,
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found.');
    }

    // Driver can only access their own documents
    if (user.role === UserRole.DRIVER) {
      if (document.driverId !== user.driverId) {
        throw new NotFoundException('Document not found.');
      }
    }

    return document;
  }

  // =========================================================
  // FIND BY DRIVER
  // =========================================================

  async findByDriver(driverId: string, user: AuthenticatedUser) {
    if (user.role === UserRole.DRIVER) {
      if (driverId !== user.driverId) {
        throw new NotFoundException('Driver not found.');
      }
    }

    const driver = await this.prisma.driver.findUnique({
      where: {
        id: driverId,
      },
    });

    if (!driver) {
      throw new NotFoundException('Driver not found.');
    }

    return this.prisma.driverDocument.findMany({
      where: {
        driverId,
      },

      orderBy: {
        uploadedAt: 'desc',
      },
    });
  }

  // =========================================================
  // VERIFY
  // =========================================================

  async verify(
    id: string,
    dto: VerifyDriverDocumentDto,
    user: AuthenticatedUser,
  ) {
    const document = await this.prisma.driverDocument.findUnique({
      where: {
        id,
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found.');
    }

    const isApproved = dto.verificationStatus === VerificationStatus.APPROVED;

    const isRejected = dto.verificationStatus === VerificationStatus.REJECTED;

    const updatedDocument = await this.prisma.driverDocument.update({
      where: {
        id,
      },

      data: {
        verificationStatus: dto.verificationStatus,

        verifiedAt: isApproved ? new Date() : null,

        verifiedBy: isApproved ? user.id : null,

        rejectionReason: isRejected ? dto.rejectionReason : null,
      },
    });

    await this.auditService.log({
      actorUserId: user.id,
      actorUserRole: user.role,

      action: AuditAction.DRIVER_DOCUMENT_VERIFIED,
      entityType: 'DriverDocument',
      entityId: updatedDocument.id,

      metadata: {
        driverId: updatedDocument.driverId,
        verificationStatus: updatedDocument.verificationStatus,
      },
    });

    return updatedDocument;
  }

  // =========================================================
  // UPDATE
  // =========================================================

  async update(
    id: string,
    dto: UpdateDriverDocumentDto,
    user: AuthenticatedUser,
  ) {
    const document = await this.prisma.driverDocument.findUnique({
      where: {
        id,
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found.');
    }

    // Driver can only update their own document
    if (user.role === UserRole.DRIVER) {
      if (document.driverId !== user.driverId) {
        throw new NotFoundException('Document not found.');
      }
    }

    const updatedDocument = await this.prisma.driverDocument.update({
      where: {
        id,
      },

      data: {
        fileUrl: dto.fileUrl ?? document.fileUrl,

        expiryDate:
          dto.expiryDate !== undefined
            ? new Date(dto.expiryDate)
            : document.expiryDate,

        verificationStatus: VerificationStatus.PENDING,

        verifiedAt: null,

        verifiedBy: null,

        rejectionReason: null,
      },
    });

    await this.auditService.log({
      actorUserId: user.id,
      actorUserRole: user.role,

      action: AuditAction.DRIVER_DOCUMENT_UPDATED,
      entityType: 'DriverDocument',
      entityId: updatedDocument.id,

      metadata: {
        driverId: updatedDocument.driverId,
        verificationReset: true,
      },
    });

    return updatedDocument;
  }

  // =========================================================
  // DELETE
  // =========================================================

  async remove(id: string, user: AuthenticatedUser) {
    const document = await this.prisma.driverDocument.findUnique({
      where: {
        id,
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found.');
    }

    await this.prisma.driverDocument.delete({
      where: {
        id,
      },
    });

    await this.auditService.log({
      actorUserId: user.id,
      actorUserRole: user.role,

      action: AuditAction.DRIVER_DOCUMENT_DELETED,
      entityType: 'DriverDocument',
      entityId: document.id,

      metadata: {
        driverId: document.driverId,
        documentType: document.documentType,
      },
    });

    return {
      success: true,
    };
  }
}
