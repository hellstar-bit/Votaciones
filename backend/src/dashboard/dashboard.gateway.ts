// 📁 src/dashboard/dashboard.gateway.ts
// ====================================================================
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ElectionsService } from '../elections/elections.service';
import { VotesService } from '../votes/votes.service';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
    credentials: true,
  },
  namespace: '/dashboard',
})
export class DashboardGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedClients = new Map<string, { socket: Socket; user: any }>();

  constructor(
    private jwtService: JwtService,
    private electionsService: ElectionsService,
    private votesService: VotesService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      // Extraer token del handshake
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        client.disconnect();
        return;
      }

      // Verificar token
      const payload = await this.jwtService.verifyAsync(token);
      
      // Almacenar cliente conectado
      this.connectedClients.set(client.id, { socket: client, user: payload });
      
      // Unir a sala específica según rol
      if (payload.rol === 'ADMIN') {
        client.join('admin-dashboard');
      } else if (payload.rol === 'MESA_VOTACION') {
        client.join(`mesa-${payload.sede_id}`);
      }

      console.log(`Cliente conectado: ${client.id} - Rol: ${payload.rol}`);
      
      // Enviar estadísticas iniciales
      await this.sendInitialStats(client);
      
    } catch (error) {
      console.error('Error en conexión WebSocket:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.connectedClients.delete(client.id);
    console.log(`Cliente desconectado: ${client.id}`);
  }

  @SubscribeMessage('join-election-room')
  async handleJoinElectionRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { electionId: number },
  ) {
    const clientData = this.connectedClients.get(client.id);
    if (!clientData) return;

    const room = `election-${data.electionId}`;
    client.join(room);
    
    // Enviar estadísticas de la elección específica
    const stats = await this.electionsService.getElectionStats(data.electionId);
    client.emit('election-stats', stats);
  }

  @SubscribeMessage('get-election-stats')
  async handleGetElectionStats(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { electionId: number },
  ) {
    try {
      const stats = await this.electionsService.getElectionStats(data.electionId);
      client.emit('election-stats', stats);
    } catch (error) {
      client.emit('error', { message: 'Error al obtener estadísticas' });
    }
  }

  // Método para notificar nuevo voto
  async notifyNewVote(electionId: number) {
    try {
      const stats = await this.electionsService.getElectionStats(electionId);
      
      // Enviar a sala específica de la elección
      this.server.to(`election-${electionId}`).emit('new-vote', {
        electionId,
        stats,
        timestamp: new Date(),
      });

      // También enviar a administradores
      this.server.to('admin-dashboard').emit('vote-notification', {
        electionId,
        totalVotes: stats.estadisticas.total_votos,
        timestamp: new Date(),
      });

    } catch (error) {
      console.error('Error al notificar nuevo voto:', error);
    }
  }

  // Método para enviar estadísticas iniciales
  private async sendInitialStats(client: Socket) {
    try {
      const activeElections = await this.electionsService.getActiveElections();
      
      const initialData = {
        activeElections: activeElections.length,
        elections: await Promise.all(
          activeElections.map(async (election) => {
            const stats = await this.electionsService.getElectionStats(election.id_eleccion);
            return {
              id: election.id_eleccion,
              titulo: election.titulo,
              stats: stats.estadisticas,
            };
          })
        ),
      };

      client.emit('initial-dashboard-data', initialData);
    } catch (error) {
      console.error('Error al enviar estadísticas iniciales:', error);
    }
  }

  // Método para enviar alertas
  async sendAlert(message: string, type: 'info' | 'warning' | 'error' = 'info', targetRoom?: string) {
    const alert = {
      message,
      type,
      timestamp: new Date(),
    };

    if (targetRoom) {
      this.server.to(targetRoom).emit('alert', alert);
    } else {
      this.server.emit('alert', alert);
    }
  }
}