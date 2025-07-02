// 📁 backend/src/dashboard/dashboard.gateway.ts - ACTUALIZADO
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
import { Injectable, UseGuards, Inject, forwardRef } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ElectionsService } from '../elections/elections.service';

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
    @Inject(forwardRef(() => ElectionsService))
    private electionsService: ElectionsService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        console.log('❌ Cliente sin token intentando conectar');
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token);
      
      // ✅ VERIFICAR que el usuario tiene permisos para el dashboard
      if (!['ADMIN', 'DASHBOARD', 'MESA_VOTACION'].includes(payload.rol)) {
        console.log(`❌ Usuario con rol ${payload.rol} intentando acceder al dashboard`);
        client.disconnect();
        return;
      }

      this.connectedClients.set(client.id, { socket: client, user: payload });
      
      // ✅ UNIR A SALAS SEGÚN ROL
      if (payload.rol === 'ADMIN') {
        client.join('admin-dashboard');
        client.join('full-access'); // Acceso completo
      } else if (payload.rol === 'DASHBOARD') {
        client.join('dashboard-only'); // Solo dashboard en tiempo real
        client.join('full-access'); // También acceso completo para ver todo
      } else if (payload.rol === 'MESA_VOTACION') {
        client.join(`mesa-${payload.sede_id || 'general'}`);
      }

      console.log(`✅ Cliente conectado: ${client.id} - Rol: ${payload.rol} - Usuario: ${payload.nombre_completo}`);
      
      // Enviar estadísticas iniciales
      await this.sendInitialStats(client, payload.rol);
      
    } catch (error) {
      console.error('❌ Error en conexión WebSocket:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const clientData = this.connectedClients.get(client.id);
    if (clientData) {
      console.log(`👋 Cliente desconectado: ${client.id} - ${clientData.user.nombre_completo}`);
    }
    this.connectedClients.delete(client.id);
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
    
    console.log(`📊 Cliente ${client.id} unido a sala de elección ${data.electionId}`);
    
    try {
      const stats = await this.electionsService.getElectionStats(data.electionId);
      client.emit('election-stats', stats);
    } catch (error) {
      console.error('❌ Error al obtener estadísticas:', error);
      client.emit('error', { message: 'Error al obtener estadísticas' });
    }
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
      console.error('❌ Error al obtener estadísticas:', error);
      client.emit('error', { message: 'Error al obtener estadísticas' });
    }
  }

  // ✅ MEJORADO: Notificación de nuevo voto
  async notifyNewVote(electionId: number) {
    try {
      if (!this.electionsService) {
        console.warn('⚠️ ElectionsService no disponible para notificación');
        return;
      }

      const stats = await this.electionsService.getElectionStats(electionId);
      
      const voteNotification = {
        electionId,
        stats,
        timestamp: new Date().toISOString(),
        type: 'new-vote'
      };

      // Enviar a sala específica de la elección
      this.server.to(`election-${electionId}`).emit('new-vote', voteNotification);

      // ✅ ENVIAR A USUARIOS CON ACCESO COMPLETO (ADMIN + DASHBOARD)
      this.server.to('full-access').emit('vote-notification', {
        electionId,
        totalVotes: stats.estadisticas.total_votos,
        electionTitle: stats.eleccion.titulo,
        timestamp: new Date().toISOString(),
      });

      console.log(`🗳️ Notificación de voto enviada para elección ${electionId}`);

    } catch (error) {
      console.error('❌ Error al notificar nuevo voto:', error);
    }
  }

  // ✅ MEJORADO: Enviar estadísticas iniciales según rol
  private async sendInitialStats(client: Socket, userRole: string) {
    try {
      if (!this.electionsService) {
        console.warn('⚠️ ElectionsService no disponible para estadísticas iniciales');
        return;
      }

      const activeElections = await this.electionsService.getActiveElections();
      
      // ✅ DATOS COMPLETOS PARA ADMIN Y DASHBOARD
      if (['ADMIN', 'DASHBOARD'].includes(userRole)) {
        const initialData = {
          activeElections: activeElections.length,
          elections: await Promise.all(
            activeElections.map(async (election) => {
              try {
                const stats = await this.electionsService.getElectionStats(election.id_eleccion);
                return {
                  id: election.id_eleccion,
                  titulo: election.titulo,
                  estado: election.estado,
                  fecha_inicio: election.fecha_inicio,
                  fecha_fin: election.fecha_fin,
                  stats: stats.estadisticas,
                };
              } catch (error) {
                console.error(`❌ Error al obtener stats para elección ${election.id_eleccion}:`, error);
                return {
                  id: election.id_eleccion,
                  titulo: election.titulo,
                  estado: election.estado,
                  stats: null,
                };
              }
            })
          ),
          userRole,
          timestamp: new Date().toISOString(),
        };

        client.emit('initial-dashboard-data', initialData);
        console.log(`📊 Datos iniciales enviados a ${userRole}`);
      }
      
      // ✅ DATOS LIMITADOS PARA MESA DE VOTACIÓN
      else if (userRole === 'MESA_VOTACION') {
        const limitedData = {
          activeElections: activeElections.length,
          userRole,
          timestamp: new Date().toISOString(),
        };

        client.emit('initial-dashboard-data', limitedData);
      }

    } catch (error) {
      console.error('❌ Error al enviar estadísticas iniciales:', error);
    }
  }

  // ✅ NUEVO: Método para enviar alertas dirigidas
  async sendAlert(
    message: string, 
    type: 'info' | 'warning' | 'error' = 'info', 
    targetRoles: string[] = ['ADMIN', 'DASHBOARD']
  ) {
    const alert = {
      message,
      type,
      timestamp: new Date().toISOString(),
    };

    // Enviar a roles específicos
    if (targetRoles.includes('ADMIN')) {
      this.server.to('admin-dashboard').emit('alert', alert);
    }
    
    if (targetRoles.includes('DASHBOARD')) {
      this.server.to('dashboard-only').emit('alert', alert);
    }

    console.log(`🚨 Alerta enviada: ${message} (${type}) - Roles: ${targetRoles.join(', ')}`);
  }

  // ✅ NUEVO: Método para broadcastear actualizaciones de elección
  async broadcastElectionUpdate(electionId: number, updateType: string, data: any) {
    const update = {
      electionId,
      updateType,
      data,
      timestamp: new Date().toISOString(),
    };

    this.server.to('full-access').emit('election-update', update);
    console.log(`📢 Actualización de elección ${electionId} broadcasted: ${updateType}`);
  }

  // ✅ NUEVO: Obtener estadísticas de conexiones
  getConnectionStats() {
    const connections = Array.from(this.connectedClients.values());
    const roleStats = connections.reduce((acc, { user }) => {
      acc[user.rol] = (acc[user.rol] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalConnections: connections.length,
      roleBreakdown: roleStats,
      timestamp: new Date().toISOString(),
    };
  }
}