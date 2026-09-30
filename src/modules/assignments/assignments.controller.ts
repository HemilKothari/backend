import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AssignmentsService } from './assignments.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserRole } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('assignments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OPERATIONS)
export class AssignmentsController {
  constructor(
    private readonly assignmentsService: AssignmentsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('inventory')
  getInventory() {
    return this.assignmentsService.getFleetInventory();
  }

  @Get(':campaignId')
  getAssignments(
    @Param('campaignId')
    campaignId: string,
  ) {
    return this.prisma.campaignAssignment.findMany({
      where: {
        campaignId,
      },

      include: {
        device: true,
      },
    });
  }
}
