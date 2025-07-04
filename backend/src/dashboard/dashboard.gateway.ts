// 📁 backend/src/dashboard/dashboard.gateway.ts - CORREGIDO
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
import { ConfigService } from '@nestjs/config'; // ✅ AGREGAR ConfigService
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
  notifyNewVote(id_eleccion: number) {
    throw new Error('Method not implemented.');
  }
  @WebSocketServer()
  server: Server;

  private connectedClients = new Map<string, { socket: Socket; user: any }>();

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService, // ✅ INYECTAR ConfigService
    @Inject(forwardRef(() => ElectionsService))
    private electionsService: ElectionsService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      console.log('🔌 Nueva conexión WebSocket:', client.id);
      
      // ✅ MEJORAR extracción del token
      let token = client.handshake.auth?.token;
      
      if (!token) {
        // Intentar extraer del header Authorization
        const authHeader = client.handshake.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
          token = authHeader.split(' ')[1];
        }
      }
      
      if (!token) {
        console.log('❌ Cliente sin token intentando conectar');
        client.emit('error', { message: 'Token requerido' });
        client.disconnect();
        return;
      }

      console.log('🔑 Token recibido, verificando...');

      // ✅ VERIFICAR token manualmente con el secret correcto
      const jwtSecret = this.configService.get<string>('JWT_SECRET');
      
      if (!jwtSecret) {
        console.error('❌ JWT_SECRET no configurado en variables de entorno');
        client.emit('error', { message: 'Error de configuración del servidor' });
        client.disconnect();
        return;
      }

      console.log('🔐 JWT_SECRET encontrado, verificando token...');

      // ✅ USAR verifyAsync con opciones explícitas
      const payload = await this.jwtService.verifyAsync(token, {
        secret: jwtSecret,
        ignoreExpiration: false,
      });
      
      console.log('✅ Token verificado para usuario:', payload.nombre_completo, 'Rol:', payload.rol);
      
      // ✅ VERIFICAR que el usuario tiene permisos para el dashboard
      if (!['ADMIN', 'DASHBOARD', 'MESA_VOTACION'].includes(payload.rol)) {
        console.log(`❌ Usuario con rol ${payload.rol} intentando acceder al dashboard`);
        client.emit('error', { message: 'No tienes permisos para acceder al dashboard' });
        client.disconnect();
        return;
      }

      this.connectedClients.set(client.id, { socket: client, user: payload });
      
      // ✅ UNIR A SALAS SEGÚN ROL
      if (payload.rol === 'ADMIN') {
        client.join('admin-dashboard');
        client.join('full-access'); // Acceso completo
        console.log(`👤 Admin ${payload.nombre_completo} conectado`);
      } else if (payload.rol === 'DASHBOARD') {
        client.join('dashboard-only'); // Solo dashboard en tiempo real
        client.join('full-access'); // También acceso completo para ver todo
        console.log(`📊 Usuario Dashboard ${payload.nombre_completo} conectado`);
      } else if (payload.rol === 'MESA_VOTACION') {
        client.join(`mesa-${payload.sede_id || 'general'}`);
        console.log(`🗳️ Mesa de votación ${payload.nombre_completo} conectada`);
      }

      console.log(`✅ Cliente conectado exitosamente: ${client.id} - Rol: ${payload.rol} - Usuario: ${payload.nombre_completo}`);
      
      // ✅ CONFIRMAR conexión al cliente
      client.emit('connection-confirmed', {
        message: 'Conectado exitosamente',
        userId: payload.id_usuario,
        role: payload.rol,
        timestamp: new Date().toISOString(),
      });
      
      // Enviar estadísticas iniciales
      await this.sendInitialStats(client, payload.rol);
      
    } catch (error) {
      console.error('❌ Error en conexión WebSocket:', error);
      
      // ✅ ENVIAR error específico al cliente
      if (error.name === 'JsonWebTokenError') {
        client.emit('error', { message: 'Token inválido' });
      } else if (error.name === 'TokenExpiredError') {
        client.emit('error', { message: 'Token expirado' });
      } else {
        client.emit('error', { message: 'Error de autenticación' });
      }
      
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

  // ✅ NUEVO: Manejar solicitud de estado de conexión
  @SubscribeMessage('get-connection-status')
  handleGetConnectionStatus(@ConnectedSocket() client: Socket) {
    const clientData = this.connectedClients.get(client.id);
    if (clientData) {
      client.emit('connection-status', {
        connected: true,
        user: clientData.user.nombre_completo,
        role: clientData.user.rol,
        timestamp: new Date().toISOString(),
        totalConnections: this.connectedClients.size,
      });
    }
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
      const electionStats = await this.electionsService.getElectionStats(data.electionId);
      client.emit('election-stats', electionStats);
    } catch (error) {
      console.error('Error obteniendo estadísticas de elección:', error);
      client.emit('error', { message: 'Error obteniendo datos de la elección' });
    }
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

  // ✅ MÉTODO para enviar estadísticas iniciales
  private async sendInitialStats(client: Socket, userRole: string) {
    try {
      console.log(`📈 Enviando estadísticas iniciales para rol: ${userRole}`);
      
      // Obtener elecciones activas
      const activeElections = await this.electionsService.getActiveElections();
      
      // ✅ DATOS BÁSICOS para todos los roles
      const dashboardData = {
        activeElections: activeElections.length,
        elections: activeElections.map(election => ({
          id: election.id_eleccion,
          titulo: election.titulo,
          estado: election.estado,
          fecha_inicio: election.fecha_inicio,
          fecha_fin: election.fecha_fin,
          estadisticas: {
            total_votos: 0, // Se calculará en tiempo real
            participacion_porcentaje: 0,
            total_votantes_habilitados: 0,
            votos_por_candidato: [],
          }
        })),
        timestamp: new Date().toISOString(),
      };

      console.log(`📊 Enviando datos iniciales:`, {
        elecciones: dashboardData.activeElections,
        usuario_rol: userRole
      });

      client.emit('initial-dashboard-data', dashboardData);
      
    } catch (error) {
      console.error('❌ Error al enviar estadísticas iniciales:', error);
      client.emit('error', { message: 'Error obteniendo datos iniciales' });
    }
  }

  // ✅ MÉTODO para broadcastear actualizaciones de votos
  async broadcastVoteUpdate(electionId: number, voteData: any) {
    try {
      const update = {
        electionId,
        stats: voteData,
        timestamp: new Date().toISOString(),
      };

      // Enviar a todos los usuarios con acceso completo
      this.server.to('full-access').emit('new-vote', update);
      
      // También enviar a la sala específica de la elección
      this.server.to(`election-${electionId}`).emit('new-vote', update);
      
      console.log(`📢 Actualización de voto broadcasted para elección ${electionId}`);
      
    } catch (error) {
      console.error('❌ Error broadcasting voto:', error);
    }
  }

  // ✅ MÉTODO para enviar alertas dirigidas
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

  // ✅ MÉTODO para obtener estadísticas de conexiones
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