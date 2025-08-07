// backend/src/dashboard/dashboard.gateway.ts - Versión actualizada
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { DashboardService } from './dashboard.service';
import { ElectionsService } from '../elections/elections.service';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
})
export class DashboardGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedClients = new Map<string, { userId: number; userRole: string }>();

  constructor(
    private jwtService: JwtService,
    private dashboardService: DashboardService,
    private electionsService: ElectionsService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      console.log(`🔌 Cliente conectando: ${client.id}`);
      
      const token = client.handshake.auth?.token || client.handshake.query?.token;
      
      if (!token) {
        console.log('❌ No hay token, desconectando cliente');
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token);
      const userRole = payload.rol || 'GUEST';
      
      console.log(`✅ Cliente autenticado: ${client.id}, Rol: ${userRole}`);
      
      // Verificar permisos para el dashboard
      const allowedRoles = ['ADMIN', 'DASHBOARD'];
      if (!allowedRoles.includes(userRole)) {
        console.log(`❌ Rol no autorizado: ${userRole}`);
        client.emit('error', { message: 'No autorizado para acceder al dashboard' });
        client.disconnect();
        return;
      }

      // Guardar información del cliente
      this.connectedClients.set(client.id, {
        userId: payload.sub,
        userRole: userRole,
      });

      // Enviar datos iniciales
      await this.sendInitialDashboardData(client, userRole);
      
      console.log(`📊 Cliente conectado al dashboard: ${client.id}`);
      
    } catch (error) {
      console.error('❌ Error en autenticación WebSocket:', error);
      client.emit('error', { message: 'Token inválido' });
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`📤 Cliente desconectado: ${client.id}`);
    this.connectedClients.delete(client.id);
  }

  // ✅ Enviar datos iniciales al cliente
  private async sendInitialDashboardData(client: Socket, userRole: string) {
    try {
      console.log(`📈 Enviando datos iniciales para rol: ${userRole}`);
      
      // Obtener elecciones con estadísticas
      const elections = await this.dashboardService.getRealTimeElections();
      
      // Obtener estadísticas globales
      const globalStats = await this.dashboardService.getGlobalRealTimeStats();
      
      const dashboardData = {
        activeElections: elections.filter(e => e.estado === 'activa').length,
        elections: elections,
        recent_activity: globalStats.recent_activity,
        summary: globalStats.summary,
        timestamp: new Date().toISOString(),
      };

      console.log(`📊 Enviando datos iniciales:`, {
        elecciones: dashboardData.activeElections,
        total_elections: dashboardData.elections.length,
        usuario_rol: userRole
      });

      client.emit('initial-dashboard-data', dashboardData);
      
    } catch (error) {
      console.error('❌ Error al enviar datos iniciales:', error);
      client.emit('error', { message: 'Error obteniendo datos iniciales' });
    }
  }

  // ✅ Unirse a sala de elección específica
  @SubscribeMessage('join-election-room')
  handleJoinElectionRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { electionId: number },
  ) {
    const room = `election-${data.electionId}`;
    client.join(room);
    console.log(`📊 Cliente ${client.id} se unió a la sala de elección ${data.electionId}`);
    
    // Enviar estadísticas específicas de la elección
    this.sendElectionSpecificData(client, data.electionId);
  }

  // ✅ Salir de sala de elección
  @SubscribeMessage('leave-election-room')
  handleLeaveElectionRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { electionId: number },
  ) {
    const room = `election-${data.electionId}`;
    client.leave(room);
    console.log(`📊 Cliente ${client.id} salió de la sala de elección ${data.electionId}`);
  }

  // ✅ Enviar datos específicos de una elección
  private async sendElectionSpecificData(client: Socket, electionId: number) {
    try {
      // Obtener datos específicos de la elección
      const elections = await this.dashboardService.getRealTimeElections();
      const election = elections.find(e => e.id === electionId);
      
      if (election) {
        // Obtener tendencias por hora
        const hourlyTrends = await this.dashboardService.getElectionHourlyTrends(electionId);
        
        // Obtener participación por ubicación
        const participationByLocation = await this.dashboardService.getParticipationByLocation(electionId);
        
        client.emit('election-specific-data', {
          election,
          hourlyTrends,
          participationByLocation,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('❌ Error enviando datos específicos de elección:', error);
      client.emit('error', { message: 'Error obteniendo datos de la elección' });
    }
  }

  // ✅ MÉTODO PRINCIPAL: Notificar nuevo voto
  async notifyNewVote(electionId: number, voteData?: any) {
    try {
      console.log(`🗳️ Notificando nuevo voto en elección ${electionId}`);
      
      // Obtener estadísticas actualizadas de la elección
      const elections = await this.dashboardService.getRealTimeElections();
      const updatedElection = elections.find(e => e.id === electionId);
      
      if (!updatedElection) {
        console.warn(`⚠️ No se encontró la elección ${electionId}`);
        return;
      }

      // Obtener estadísticas globales actualizadas
      const globalStats = await this.dashboardService.getGlobalRealTimeStats();

      // Notificar a todos los clientes conectados
      this.server.emit('new-vote', {
        electionId,
        voterName: voteData?.voterName || 'Votante',
        candidateName: voteData?.candidateName || 'Candidato',
        timestamp: new Date().toISOString(),
        method: voteData?.method || 'qr',
        updatedStats: updatedElection.estadisticas
      });

      // Notificar estadísticas actualizadas de la elección específica
      this.server.to(`election-${electionId}`).emit('election-stats-updated', {
        electionId,
        stats: updatedElection.estadisticas,
        timestamp: new Date().toISOString()
      });

      // Notificar estadísticas globales actualizadas
      this.server.emit('global-stats-updated', {
        summary: globalStats.summary,
        recent_activity: globalStats.recent_activity.slice(0, 10), // Solo los últimos 10
        timestamp: new Date().toISOString()
      });

      console.log(`✅ Notificación de voto enviada a todos los clientes`);
      
    } catch (error) {
      console.error('❌ Error notificando nuevo voto:', error);
    }
  }

  // ✅ MÉTODO: Notificar elección finalizada
  async notifyElectionFinalized(electionId: number) {
    try {
      console.log(`🏁 Notificando finalización de elección ${electionId}`);
      
      // Obtener resultados finales
      const finalResults = await this.dashboardService.getFinalResults(electionId);
      
      // Notificar a todos los clientes
      this.server.emit('election-finalized', {
        electionId,
        results: finalResults,
        timestamp: new Date().toISOString()
      });

      // Notificar específicamente a los clientes en la sala de la elección
      this.server.to(`election-${electionId}`).emit('election-final-results', {
        electionId,
        results: finalResults,
        timestamp: new Date().toISOString()
      });

      console.log(`✅ Notificación de finalización enviada`);
      
    } catch (error) {
      console.error('❌ Error notificando finalización de elección:', error);
    }
  }

  // ✅ MÉTODO: Notificar activación de elección
  async notifyElectionActivated(electionId: number) {
    try {
      console.log(`🎯 Notificando activación de elección ${electionId}`);
      
      // Obtener datos de la elección activada
      const elections = await this.dashboardService.getRealTimeElections();
      const activatedElection = elections.find(e => e.id === electionId);
      
      if (activatedElection) {
        this.server.emit('election-activated', {
          electionId,
          election: activatedElection,
          timestamp: new Date().toISOString()
        });
      }

      console.log(`✅ Notificación de activación enviada`);
      
    } catch (error) {
      console.error('❌ Error notificando activación de elección:', error);
    }
  }

  // ✅ MÉTODO: Enviar alerta del sistema
  async sendSystemAlert(message: string, type: 'info' | 'warning' | 'error' = 'info') {
    try {
      console.log(`🚨 Enviando alerta del sistema: ${message}`);
      
      this.server.emit('system-alert', {
        message,
        type,
        timestamp: new Date().toISOString()
      });

      console.log(`✅ Alerta del sistema enviada`);
      
    } catch (error) {
      console.error('❌ Error enviando alerta del sistema:', error);
    }
  }

  // ✅ MÉTODO: Obtener número de clientes conectados
  getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  // ✅ MÉTODO: Obtener estadísticas de conexión
  getConnectionStats() {
    const clientsByRole = new Map<string, number>();
    
    this.connectedClients.forEach(client => {
      const current = clientsByRole.get(client.userRole) || 0;
      clientsByRole.set(client.userRole, current + 1);
    });

    return {
      totalClients: this.connectedClients.size,
      clientsByRole: Object.fromEntries(clientsByRole),
      timestamp: new Date().toISOString()
    };
  }
}