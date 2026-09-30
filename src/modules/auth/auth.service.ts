import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import * as argon2 from 'argon2';

import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';

import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

import { UserRole } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/audit.types';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,

    private readonly jwtService: JwtService,

    private readonly auditService: AuditService,
  ) {}

  async register(
    dto: RegisterDto,
    context?: {
      ipAddress?: string;
      userAgent?: string;
    },
  ) {
    const existingUser = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (existingUser) {
      throw new ConflictException('An account with this email already exists.');
    }

    const passwordHash = await argon2.hash(dto.password);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        passwordHash,
        role: UserRole.VIEWER,
      },
    });

    await this.auditService.log({
      actorUserId: user.id,
      actorUserRole: user.role,
      action: AuditAction.AUTH_REGISTER,
      entityType: 'User',
      entityId: user.id,
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
    });

    return {
      message: 'Registration successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    };
  }

  async login(
    dto: LoginDto,
    context?: {
      ipAddress?: string;
      userAgent?: string;
    },
  ) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !user.active) {
      await this.auditService.log({
        action: AuditAction.AUTH_LOGIN_FAILED,
        entityType: 'User',
        success: false,
        ipAddress: context?.ipAddress,
        userAgent: context?.userAgent,
        metadata: {
          reason: 'Invalid credentials',
        },
      });

      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await argon2.verify(user.passwordHash, dto.password);

    if (!valid) {
      await this.auditService.log({
        actorUserId: user.id,
        actorUserRole: user.role,
        action: AuditAction.AUTH_LOGIN_FAILED,
        entityType: 'User',
        entityId: user.id,
        success: false,
        ipAddress: context?.ipAddress,
        userAgent: context?.userAgent,
        metadata: {
          reason: 'Invalid credentials',
        },
      });

      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: user.id,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
      },
    });

    await this.auditService.log({
      actorUserId: user.id,
      actorUserRole: user.role,
      action: AuditAction.AUTH_LOGIN_SUCCESS,
      entityType: 'User',
      entityId: user.id,
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        driverId: user.driverId,
        advertiserId: user.advertiserId,
      },
    };
  }
}
