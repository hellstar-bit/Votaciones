// 📁 backend/src/dashboard/dashboard.gateway.ts - CORREGIDO
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

  // ✅ MÉTODO PRINCIPAL CORREGIDO: Notificar nuevo voto
  async notifyNewVote(electionId: number, documentoVotante?: string, candidatoId?: number) {
    try {
      console.log(`🗳️ Notificando nuevo voto en elección ${electionId}`);
      
      // ✅ OBTENER NOMBRE DEL VOTANTE POR DOCUMENTO
      let votanteNombre = 'Votante';
      if (documentoVotante) {
        const votantePersona = await this.personaRepository.findOne({
          where: { numero_documento: documentoVotante }
        });
        
        if (votantePersona) {
          votanteNombre = `${votantePersona.nombres} ${votantePersona.apellidos}`.trim();
        }
      }

      // ✅ OBTENER NOMBRE DEL CANDIDATO
      let candidatoNombre = 'Voto en Blanco';
      if (candidatoId) {
        const candidatoPersona = await this.personaRepository
          .createQueryBuilder('persona')
          .innerJoin('candidatos', 'candidato', 'candidato.id_persona = persona.id_persona')
          .where('candidato.id_candidato = :candidatoId', { candidatoId })
          .getOne();
        
        if (candidatoPersona) {
          candidatoNombre = `${candidatoPersona.nombres} ${candidatoPersona.apellidos}`.trim();
        }
      }

      // ✅ OBTENER ESTADÍSTICAS ACTUALIZADAS
      const updatedElections = await this.dashboardService.getRealTimeElections();
      const updatedElection = updatedElections.find(e => e.id === electionId);
      const globalStats = await this.dashboardService.getGlobalRealTimeStats();

      // ✅ NOTIFICAR A TODOS LOS CLIENTES CONECTADOS
      this.server.emit('new-vote', {
        electionId,
        voterName: votanteNombre,
        candidateName: candidatoNombre,
        timestamp: new Date().toISOString(),
        method: 'qr',
        updatedStats: updatedElection?.estadisticas || null
      });

      // ✅ NOTIFICAR A LA SALA ESPECÍFICA DE LA ELECCIÓN
      this.server.to(`election-${electionId}`).emit('election-stats-updated', {
        electionId,
        stats: updatedElection?.estadisticas || null,
        timestamp: new Date().toISOString()
      });

      // ✅ NOTIFICAR ESTADÍSTICAS GLOBALES ACTUALIZADAS
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

  // ✅ MÉTODO: Obtener clientes conectados
  getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  // ✅ MÉTODO: Broadcast a todos los clientes
  broadcastToAll(event: string, data: any) {
    this.server.emit(event, data);
  }

  // ✅ MÉTODO: Broadcast a una sala específica
  broadcastToRoom(room: string, event: string, data: any) {
    this.server.to(room).emit(event, data);
  }
}