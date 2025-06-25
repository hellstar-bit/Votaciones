// 📁 src/dashboard/dashboard.controller.ts
// ====================================================================
import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'MESA_VOTACION')
  async getStats() {
    return this.dashboardService.getDashboardStats();
  }

  @Get('election/:id/trends')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async getElectionTrends(@Param('id') id: string) {
    return this.dashboardService.getElectionTrends(+id);
  }

  @Get('election/:id/participation')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async getParticipation(@Param('id') id: string) {
    return this.dashboardService.getParticipationByLocation(+id);
  }
}
