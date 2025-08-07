// backend/src/dashboard/dashboard.controller.ts - Versión actualizada
import { Controller, Get, Param, UseGuards, ParseIntPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  // ✅ Estadísticas generales del dashboard
  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'DASHBOARD', 'MESA_VOTACION')
  async getStats() {
    return this.dashboardService.getDashboardStats();
  }

  // ✅ NUEVO: Obtener todas las elecciones con estadísticas en tiempo real
  @Get('real-time/elections')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'DASHBOARD')
  async getRealTimeElections() {
    return this.dashboardService.getRealTimeElections();
  }

  // ✅ NUEVO: Obtener estadísticas globales en tiempo real
  @Get('real-time/global-stats')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'DASHBOARD')
  async getGlobalStats() {
    return this.dashboardService.getGlobalRealTimeStats();
  }

  // ✅ NUEVO: Obtener lista de votantes de una elección (sin mostrar voto)
  @Get('election/:id/voters')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'DASHBOARD')
  async getElectionVoters(@Param('id', ParseIntPipe) id: number) {
    return this.dashboardService.getElectionVoters(id);
  }

  // ✅ NUEVO: Obtener tendencias por hora de una elección
  @Get('election/:id/hourly-trends')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'DASHBOARD')
  async getElectionHourlyTrends(@Param('id', ParseIntPipe) id: number) {
    return this.dashboardService.getElectionHourlyTrends(id);
  }

  // ✅ NUEVO: Obtener participación por ubicación
  @Get('election/:id/participation-by-location')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'DASHBOARD')
  async getParticipationByLocation(@Param('id', ParseIntPipe) id: number) {
    return this.dashboardService.getParticipationByLocation(id);
  }

  // ✅ NUEVO: Obtener resultados finales (solo elecciones finalizadas)
  @Get('election/:id/final-results')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'DASHBOARD')
  async getFinalResults(@Param('id', ParseIntPipe) id: number) {
    return this.dashboardService.getFinalResults(id);
  }

  // ✅ Mantener endpoints heredados para compatibilidad
  @Get('election/:id/trends')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'DASHBOARD')
  async getElectionTrends(@Param('id', ParseIntPipe) id: number) {
    return this.dashboardService.getElectionTrends(id);
  }

  @Get('election/:id/participation')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'DASHBOARD')
  async getParticipation(@Param('id', ParseIntPipe) id: number) {
    return this.dashboardService.getParticipationByLocation(id);
  }
}