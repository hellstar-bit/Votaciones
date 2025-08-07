// backend/src/dashboard/dashboard.gateway.ts - Con nombres reales de votantes
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
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DashboardService } from './dashboard.service';
import { ElectionsService } from '../elections/elections.service';
import { Persona } from '../users/entities/persona.entity';
import { VotanteHabilitado } from '../votes/entities/votante-habilitado.entity';

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
    @InjectRepository(Persona)
    private personaRepository: Repository<Persona>,
    @InjectRepository(VotanteHabilitado)
    private votanteHabilitadoRepository: Repository<VotanteHabilitado>,
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
      
      const allowedRoles = ['ADMIN', 'DASHBOARD'];
      if (!allowedRoles.includes(userRole)) {
        console.log(`❌ Rol no autorizado: ${userRole}`);
        client.emit('error', { message: 'No autorizado para acceder al dashboard' });
        client.disconnect();
        return;
      }

      this.connectedClients.set(client.id, {
        userId: payload.sub,
        userRole: userRole,
      });

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

  private async sendInitialDashboardData(client: Socket, userRole: string) {
    try {
      console.log(`📈 Enviando datos iniciales para rol: ${userRole}`);
      
      const elections = await this.dashboardService.getRealTimeElections();
      const globalStats = await this.dashboardService.getGlobalRealTimeStats();
      
      const dashboardData = {
        activeElections: elections.filter(e => e.estado === 'activa').length,
        elections: elections,
        recent_activity: globalStats.recent_activity,
        summary: globalStats.summary,
        timestamp: new Date().toISOString(),
      };

      client.emit('initial-dashboard-data', dashboardData);
      
    } catch (error) {
      console.error('❌ Error al enviar datos iniciales:', error);
      client.emit('error', { message: 'Error obteniendo datos iniciales' });
    }
  }

  @SubscribeMessage('join-election-room')
  handleJoinElectionRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { electionId: number },
  ) {
    const room = `election-${data.electionId}`;
    client.join(room);
    console.log(`📊 Cliente ${client.id} se unió a la sala de elección ${data.electionId}`);
  }

  @SubscribeMessage('leave-election-room')
  handleLeaveElectionRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { electionId: number },
  ) {
    const room = `election-${data.electionId}`;
    client.leave(room);
    console.log(`📊 Cliente ${client.id} salió de la sala de elección ${data.electionId}`);
  }

  // ✅ MÉTODO PRINCIPAL ACTUALIZADO: Notificar nuevo voto con nombre real
  async notifyNewVote(electionId: number, votanteDocumento?: string, candidatoId?: number) {
    try {
      console.log(`🗳️ Notificando nuevo voto en elección ${electionId}`);
      
      // ✅ OBTENER NOMBRE REAL DEL VOTANTE
      let votanteNombre = 'Votante';
      if (votanteDocumento) {
        try {
          const persona = await this.personaRepository.findOne({
            where: { numero_documento: votanteDocumento.toString() }
          });
          
          if (persona) {
            votanteNombre = persona.nombreCompleto;
            console.log(`👤 Votante identificado: ${votanteNombre}`);
          }
        } catch (error) {
          console.warn('⚠️ No se pudo obtener nombre del votante:', error);
        }
      }

      // ✅ OBTENER NOMBRE DEL CANDIDATO
      let candidatoNombre = 'Voto en Blanco';
      if (candidatoId) {
        try {
          const candidato = await this.personaRepository
            .createQueryBuilder('persona')
            .innerJoin('candidatos', 'candidato', 'candidato.id_persona = persona.id_persona')
            .select(['persona.nombres', 'persona.apellidos'])
            .where('candidato.id_candidato = :candidatoId', { candidatoId })
            .getRawOne();
          
          if (candidato) {
            candidatoNombre = `${candidato.persona_nombres} ${candidato.persona_apellidos}`;
            console.log(`🏆 Candidato identificado: ${candidatoNombre}`);
          }
        } catch (error) {
          console.warn('⚠️ No se pudo obtener nombre del candidato:', error);
        }
      }

      // Obtener estadísticas actualizadas
      const elections = await this.dashboardService.getRealTimeElections();
      const updatedElection = elections.find(e => e.id === electionId);
      
      if (!updatedElection) {
        console.warn(`⚠️ No se encontró la elección ${electionId}`);
        return;
      }

      const globalStats = await this.dashboardService.getGlobalRealTimeStats();

      // ✅ NOTIFICAR CON NOMBRES REALES
      this.server.emit('new-vote', {
        electionId,
        voterName: votanteNombre, // ✅ NOMBRE REAL DEL VOTANTE
        candidateName: candidatoNombre, // ✅ NOMBRE REAL DEL CANDIDATO
        timestamp: new Date().toISOString(),
        method: 'qr',
        updatedStats: updatedElection.estadisticas
      });

      this.server.to(`election-${electionId}`).emit('election-stats-updated', {
        electionId,
        stats: updatedElection.estadisticas,
        timestamp: new Date().toISOString()
      });

      this.server.emit('global-stats-updated', {
        summary: globalStats.summary,
        recent_activity: globalStats.recent_activity.slice(0, 10),
        timestamp: new Date().toISOString()
      });

      console.log(`✅ Notificación enviada: ${votanteNombre} → ${candidatoNombre}`);
      
    } catch (error) {
      console.error('❌ Error notificando nuevo voto:', error);
    }
  }

  // ✅ MÉTODO: Notificar elección finalizada
  async notifyElectionFinalized(electionId: number) {
    try {
      console.log(`🏁 Notificando finalización de elección ${electionId}`);
      
      const finalResults = await this.dashboardService.getFinalResults(electionId);
      
      this.server.emit('election-finalized', {
        electionId,
        results: finalResults,
        timestamp: new Date().toISOString()
      });

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