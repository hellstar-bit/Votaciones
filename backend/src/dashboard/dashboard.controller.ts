// 📁 backend/src/dashboard/dashboard.controller.ts - VERSIÓN COMPLETA CON DEBUG
import { Controller, Get, Post, Param, UseGuards, ParseIntPipe } from '@nestjs/common';
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

  // ✅ Obtener todas las elecciones con estadísticas en tiempo real
  @Get('real-time/elections')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'DASHBOARD')
  async getRealTimeElections() {
    return this.dashboardService.getRealTimeElections();
  }

  // ✅ Obtener estadísticas globales en tiempo real
  @Get('real-time/global-stats')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'DASHBOARD')
  async getGlobalStats() {
    return this.dashboardService.getGlobalRealTimeStats();
  }

  // ✅ Obtener lista de votantes de una elección (sin mostrar voto)
  @Get('election/:id/voters')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'DASHBOARD')
  async getElectionVoters(@Param('id', ParseIntPipe) id: number) {
    return this.dashboardService.getElectionVoters(id);
  }

  // ✅ Obtener tendencias por hora de una elección
  @Get('election/:id/hourly-trends')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'DASHBOARD')
  async getElectionHourlyTrends(@Param('id', ParseIntPipe) id: number) {
    return this.dashboardService.getElectionHourlyTrends(id);
  }

  // ✅ Obtener participación por ubicación
  @Get('election/:id/participation-by-location')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'DASHBOARD')
  async getParticipationByLocation(@Param('id', ParseIntPipe) id: number) {
    return this.dashboardService.getParticipationByLocation(id);
  }

  // ✅ Obtener resultados finales (solo elecciones finalizadas)
  @Get('election/:id/final-results')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'DASHBOARD')
  async getFinalResults(@Param('id', ParseIntPipe) id: number) {
    return this.dashboardService.getFinalResults(id);
  }

  // ✅ NUEVO: Obtener estadísticas específicas de una elección
  @Get('election/:id/stats')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'DASHBOARD')
  async getElectionStats(@Param('id', ParseIntPipe) id: number) {
    return this.dashboardService.getElectionSpecificStats(id);
  }

  // ✅ NUEVO: Debug - Verificar datos de una elección (solo para desarrollo/admin)
  @Get('debug/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN') // Solo para administradores
  async debugElection(@Param('id', ParseIntPipe) id: number) {
    return this.dashboardService.debugElectionData(id);
  }

  // ✅ NUEVO: Sincronizar contadores de una elección
  @Post('sync/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN') // Solo para administradores
  async syncElectionCounters(@Param('id', ParseIntPipe) id: number) {
    return this.dashboardService.syncElectionCounters(id);
  }

  // ✅ NUEVO: Obtener métricas de rendimiento del sistema
  @Get('performance')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'DASHBOARD')
  async getPerformanceMetrics() {
    return this.dashboardService.getPerformanceMetrics();
  }

  // ✅ NUEVO: Endpoint para debug global (verificar todas las elecciones)
  @Get('debug/all')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async debugAllElections() {
    try {
      const elections = await this.dashboardService.getRealTimeElections();
      const debugResults = await Promise.all(
        elections.map(async (election) => {
          try {
            const debug = await this.dashboardService.debugElectionData(election.id);
            return {
              election_id: election.id,
              election_title: election.titulo,
              debug_result: debug
            };
          } catch (error) {
            return {
              election_id: election.id,
              election_title: election.titulo,
              error: error.message
            };
          }
        })
      );

      return {
        message: 'Debug completado para todas las elecciones',
        total_elections: elections.length,
        results: debugResults
      };
    } catch (error) {
      return {
        error: 'Error ejecutando debug global',
        details: error.message
      };
    }
  }

  // ✅ NUEVO: Sincronizar contadores de todas las elecciones activas
  @Post('sync/all')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async syncAllElectionCounters() {
    try {
      const elections = await this.dashboardService.getRealTimeElections();
      const activeElections = elections.filter(e => e.estado === 'activa');
      
      const syncResults = await Promise.all(
        activeElections.map(async (election) => {
          try {
            const result = await this.dashboardService.syncElectionCounters(election.id);
            return {
              election_id: election.id,
              election_title: election.titulo,
              success: true,
              result: result
            };
          } catch (error) {
            return {
              election_id: election.id,
              election_title: election.titulo,
              success: false,
              error: error.message
            };
          }
        })
      );

      return {
        message: 'Sincronización completada',
        total_processed: activeElections.length,
        results: syncResults
      };
    } catch (error) {
      return {
        error: 'Error ejecutando sincronización global',
        details: error.message
      };
    }
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

  // ✅ NUEVO: Endpoint de salud del dashboard
  @Get('health')
  async getHealth() {
    try {
      const stats = await this.dashboardService.getGlobalRealTimeStats();
      return {
        status: 'healthy',
        timestamp: new Date(),
        active_elections: stats.summary.active_elections,
        total_votes: stats.summary.total_votes,
        service: 'dashboard'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date(),
        error: error.message,
        service: 'dashboard'
      };
    }
  }
}