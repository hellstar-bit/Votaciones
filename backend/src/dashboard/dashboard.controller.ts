// 📁 backend/src/dashboard/dashboard.controller.ts - ACTUALIZADO
import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  // ✅ ACTUALIZADO: Permitir acceso a rol DASHBOARD
  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'DASHBOARD', 'MESA_VOTACION')
  async getStats() {
    return this.dashboardService.getDashboardStats();
  }

  // ✅ ACTUALIZADO: Permitir acceso a rol DASHBOARD
  @Get('election/:id/trends')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'DASHBOARD')
  async getElectionTrends(@Param('id') id: string) {
    return this.dashboardService.getElectionTrends(+id);
  }

  // ✅ ACTUALIZADO: Permitir acceso a rol DASHBOARD
  @Get('election/:id/participation')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'DASHBOARD')
  async getParticipation(@Param('id') id: string) {
    return this.dashboardService.getParticipationByLocation(+id);
  }

  // ✅ NUEVO: Endpoint específico para el dashboard en tiempo real
  @Get('real-time/elections')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'DASHBOARD')
  async getRealTimeElections() {
    return this.dashboardService.getRealTimeElections();
  }

  // ✅ NUEVO: Endpoint para estadísticas globales en tiempo real
  @Get('real-time/global-stats')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'DASHBOARD')
  async getGlobalStats() {
    return this.dashboardService.getGlobalRealTimeStats();
  }
}