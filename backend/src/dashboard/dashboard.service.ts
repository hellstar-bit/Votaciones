// 📁 backend/src/dashboard/dashboard.service.ts - VERSIÓN COMPLETA CORREGIDA PARA POSTGRESQL
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Eleccion } from '../elections/entities/eleccion.entity';
import { Voto } from '../votes/entities/voto.entity';
import { VotanteHabilitado } from '../votes/entities/votante-habilitado.entity';
import { Candidato } from '../candidates/entities/candidato.entity';
import { Persona } from '../users/entities/persona.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Eleccion)
    private eleccionRepository: Repository<Eleccion>,
    @InjectRepository(Voto)
    private votoRepository: Repository<Voto>,
    @InjectRepository(VotanteHabilitado)
    private votanteHabilitadoRepository: Repository<VotanteHabilitado>,
    @InjectRepository(Candidato)
    private candidatoRepository: Repository<Candidato>,
    @InjectRepository(Persona)
    private personaRepository: Repository<Persona>,
  ) {}

  // ✅ MÉTODO PRINCIPAL CORREGIDO: Sin TIMESTAMPDIFF, compatible con PostgreSQL
  async getGlobalRealTimeStats() {
    try {
      console.log('📊 Obteniendo estadísticas globales...');

      const [
        activeElections,
        totalElections,
        totalVotes,
        totalEnabledVoters,
        recentActivity
      ] = await Promise.all([
        // Contar elecciones activas
        this.eleccionRepository.count({
          where: { estado: 'activa' },
        }),

        // Contar total de elecciones
        this.eleccionRepository.count(),

        // Total de votos en elecciones activas
        this.votoRepository
          .createQueryBuilder('voto')
          .innerJoin('voto.eleccion', 'eleccion')
          .where('eleccion.estado = :estado', { estado: 'activa' })
          .getCount(),

        // Total de votantes habilitados en elecciones activas
        this.votanteHabilitadoRepository
          .createQueryBuilder('votante')
          .innerJoin('votante.eleccion', 'eleccion')
          .where('eleccion.estado = :estado', { estado: 'activa' })
          .getCount(),

        // ✅ ACTIVIDAD RECIENTE SIN TIMESTAMPDIFF
        this.votoRepository
          .createQueryBuilder('voto')
          .select([
            'voto.timestamp_voto as timestamp',
            'voto.id_voto as voto_id',
            'eleccion.titulo as eleccion_titulo',
            'eleccion.id_eleccion as eleccion_id',
            'candidatoPersona.nombres as candidato_nombres',
            'candidatoPersona.apellidos as candidato_apellidos'
          ])
          .innerJoin('voto.eleccion', 'eleccion')
          .leftJoin('voto.candidato', 'candidato')
          .leftJoin('candidato.persona', 'candidatoPersona')
          .where('eleccion.estado IN (:...estados)', { estados: ['activa', 'finalizada'] })
          .orderBy('voto.timestamp_voto', 'DESC')
          .limit(20)
          .getRawMany()
      ]);

      console.log('🔍 Actividad reciente encontrada:', recentActivity.length, 'registros');

      // ✅ OBTENER NOMBRES DE VOTANTES SIN TIMESTAMPDIFF
      const activityWithVoters = await Promise.all(
        recentActivity.map(async (activity) => {
          let votanteNombre = 'Usuario Anónimo';
          
          try {
            // ✅ POSTGRESQL: Buscar votante por rango de tiempo simple
            const votante = await this.votanteHabilitadoRepository
              .createQueryBuilder('vh')
              .select([
                'persona.nombres as nombres',
                'persona.apellidos as apellidos',
                'persona.numero_documento as documento'
              ])
              .innerJoin('vh.persona', 'persona')
              .where('vh.id_eleccion = :eleccionId', { eleccionId: activity.eleccion_id })
              .andWhere('vh.ha_votado = true')
              .andWhere('vh.fecha_voto IS NOT NULL')
              // ✅ POSTGRESQL: Usar EXTRACT para diferencia en segundos, más compatible
              .andWhere(
                'ABS(EXTRACT(EPOCH FROM (vh.fecha_voto - :timestamp))) <= 120', // 2 minutos = 120 segundos
                { timestamp: activity.timestamp }
              )
              .orderBy(
                'ABS(EXTRACT(EPOCH FROM (vh.fecha_voto - :timestamp)))',
                'ASC'
              )
              .setParameter('timestamp', activity.timestamp)
              .limit(1)
              .getRawOne();

            if (votante && votante.nombres) {
              votanteNombre = `${votante.nombres} ${votante.apellidos || ''}`.trim();
            }
          } catch (error) {
            console.warn('⚠️ Error obteniendo nombre de votante:', error.message);
            // Mantener nombre por defecto
          }

          return {
            id: activity.voto_id || (Date.now() + Math.random()),
            votante_nombre: votanteNombre,
            eleccion_titulo: activity.eleccion_titulo,
            candidato_nombre: activity.candidato_nombres && activity.candidato_apellidos 
              ? `${activity.candidato_nombres} ${activity.candidato_apellidos}`
              : 'Voto en Blanco',
            timestamp: activity.timestamp,
            metodo_identificacion: 'qr',
          };
        })
      );

      const participationRate = totalEnabledVoters > 0 
        ? (totalVotes / totalEnabledVoters) * 100 
        : 0;

      const stats = {
        summary: {
          total_elections: totalElections,
          active_elections: activeElections,
          total_votes: totalVotes,
          total_voters: totalEnabledVoters,
          participation_rate: Math.round(participationRate * 100) / 100
        },
        recent_activity: activityWithVoters
      };

      console.log('✅ Estadísticas globales obtenidas correctamente');
      return stats;

    } catch (error) {
      console.error('❌ Error obteniendo estadísticas globales:', error);
      
      // ✅ Retornar datos por defecto en caso de error
      return {
        summary: {
          total_elections: 0,
          active_elections: 0,
          total_votes: 0,
          total_voters: 0,
          participation_rate: 0
        },
        recent_activity: []
      };
    }
  }

  // ✅ MÉTODO CORREGIDO: Elecciones con estadísticas en tiempo real
  async getRealTimeElections() {
  try {
    console.log('📊 Obteniendo elecciones en tiempo real...')

    const elections = await this.eleccionRepository.find({
      where: [
        { estado: 'activa' },
        { estado: 'finalizada' }
      ],
      relations: ['tipoEleccion'],
      order: { fecha_inicio: 'DESC' },
    })

    const electionsWithStats = await Promise.all(
      elections.map(async (election) => {
        try {
          // ✅ OBTENER DATOS DIRECTAMENTE DE LA BASE DE DATOS
          const votosQuery = `
            SELECT 
              v.id_candidato,
              CASE 
                WHEN v.id_candidato IS NULL THEN 'Voto en Blanco'
                ELSE CONCAT(p.nombres, ' ', p.apellidos)
              END as candidato_nombre,
              COUNT(*) as total_votos
            FROM votos v
            LEFT JOIN candidatos c ON c.id_candidato = v.id_candidato
            LEFT JOIN personas p ON p.id_persona = c.id_persona
            WHERE v.id_eleccion = $1
            GROUP BY v.id_candidato, p.nombres, p.apellidos
            ORDER BY total_votos DESC
          `

          const votosRaw = await this.votoRepository.query(votosQuery, [election.id_eleccion])
          
          // Total de votos real
          const totalVotosEmitidos = await this.votoRepository.count({
            where: { id_eleccion: election.id_eleccion },
          })

          // Total de votantes habilitados
          const totalVotantesHabilitados = await this.votanteHabilitadoRepository.count({
            where: { id_eleccion: election.id_eleccion },
          })

          console.log(`🗳️ Elección ${election.id_eleccion}:`)
          console.log(`  Total votos: ${totalVotosEmitidos}`)
          console.log(`  Datos raw:`, votosRaw)

          // ✅ CALCULAR PORCENTAJES CORRECTAMENTE
          const votesPerCandidate = votosRaw.map(voto => {
            const votos = parseInt(voto.total_votos)
            const porcentaje = totalVotosEmitidos > 0 ? (votos / totalVotosEmitidos) * 100 : 0
            
            console.log(`  ${voto.candidato_nombre}: ${votos} votos = ${porcentaje.toFixed(2)}%`)
            
            return {
              candidato_id: voto.id_candidato,
              candidato_nombre: voto.candidato_nombre,
              votos: votos,
              porcentaje: Math.round(porcentaje * 100) / 100, // 2 decimales
            }
          })

          // ✅ VERIFICAR QUE LA SUMA ES CORRECTA
          const sumaVotos = votesPerCandidate.reduce((sum, c) => sum + c.votos, 0)
          const sumaPorcentajes = votesPerCandidate.reduce((sum, c) => sum + c.porcentaje, 0)
          
          console.log(`  Verificación - Suma votos: ${sumaVotos}/${totalVotosEmitidos}`)
          console.log(`  Verificación - Suma %: ${sumaPorcentajes.toFixed(2)}%`)

          if (sumaVotos !== totalVotosEmitidos) {
            console.error(`❌ ERROR: Suma de votos no coincide en elección ${election.id_eleccion}`)
          }

          return {
            id: election.id_eleccion,
            titulo: election.titulo,
            estado: election.estado,
            fecha_inicio: election.fecha_inicio,
            fecha_fin: election.fecha_fin,
            tipo_eleccion: election.tipoEleccion?.nombre_tipo || 'Sin tipo',
            estadisticas: {
              total_votos: totalVotosEmitidos,
              total_votantes_habilitados: totalVotantesHabilitados,
              participacion_porcentaje: totalVotantesHabilitados > 0 
                ? Math.round((totalVotosEmitidos / totalVotantesHabilitados) * 10000) / 100
                : 0,
              votos_por_candidato: votesPerCandidate,
            },
          }

        } catch (error) {
          console.error(`❌ Error procesando elección ${election.id_eleccion}:`, error)
          return {
            id: election.id_eleccion,
            titulo: election.titulo,
            estado: election.estado,
            fecha_inicio: election.fecha_inicio,
            fecha_fin: election.fecha_fin,
            tipo_eleccion: election.tipoEleccion?.nombre_tipo || 'Sin tipo',
            estadisticas: {
              total_votos: 0,
              total_votantes_habilitados: 0,
              participacion_porcentaje: 0,
              votos_por_candidato: [],
            },
          }
        }
      })
    )

    console.log('✅ Elecciones procesadas:', electionsWithStats.length)
    return electionsWithStats

  } catch (error) {
    console.error('❌ Error obteniendo elecciones:', error)
    return []
  }
}



// 🔧 ALTERNATIVA: Si el problema persiste, usa esta query directa
async debugElectionVotes(electionId: number) {
  try {
    const query = `
      SELECT 
        v.id_candidato,
        CASE 
          WHEN v.id_candidato IS NULL THEN 'Voto en Blanco'
          ELSE CONCAT(p.nombres, ' ', p.apellidos)
        END as candidato_nombre,
        COUNT(*) as total_votos,
        ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM votos WHERE id_eleccion = $1)), 2) as porcentaje
      FROM votos v
      LEFT JOIN candidatos c ON c.id_candidato = v.id_candidato
      LEFT JOIN personas p ON p.id_persona = c.id_persona
      WHERE v.id_eleccion = $1
      GROUP BY v.id_candidato, p.nombres, p.apellidos
      ORDER BY total_votos DESC
    `
    
    const result = await this.votoRepository.query(query, [electionId])
    
    console.log('🔍 Debug query result:', result)
    return result
  } catch (error) {
    console.error('❌ Error en debug query:', error)
    return []
  }
}

  // ✅ MÉTODO CORREGIDO: Tendencias por hora (PostgreSQL compatible)
  async getElectionHourlyTrends(electionId: number) {
    try {
      const trends = await this.votoRepository
        .createQueryBuilder('voto')
        .select([
          'EXTRACT(HOUR FROM voto.timestamp_voto) as hora',
          'COUNT(*) as votos',
          'DATE(voto.timestamp_voto) as fecha'
        ])
        .where('voto.id_eleccion = :electionId', { electionId })
        .andWhere('voto.timestamp_voto >= NOW() - INTERVAL \'1 DAY\'')
        .groupBy('DATE(voto.timestamp_voto), EXTRACT(HOUR FROM voto.timestamp_voto)')
        .orderBy('fecha, hora', 'ASC')
        .getRawMany();

      // Generar horas completas (0-23) para el gráfico
      const horasCompletas = [];
      const hoy = new Date();
      const fechaHoy = hoy.toISOString().split('T')[0];

      for (let hora = 0; hora < 24; hora++) {
        const trendData = trends.find(t => 
          t.fecha === fechaHoy && parseInt(t.hora) === hora
        );

        horasCompletas.push({
          fecha: fechaHoy,
          hora: hora,
          votos: trendData ? parseInt(trendData.votos) : 0,
          timestamp: `${fechaHoy} ${hora.toString().padStart(2, '0')}:00:00`,
          label: `${hora.toString().padStart(2, '0')}:00`
        });
      }

      return horasCompletas;
    } catch (error) {
      console.error('❌ Error obteniendo tendencias:', error);
      return [];
    }
  }

  // ✅ MÉTODO CORREGIDO: Participación por ubicación
  async getParticipationByLocation(electionId: number) {
    try {
      const participation = await this.votanteHabilitadoRepository
        .createQueryBuilder('vh')
        .innerJoin('vh.persona', 'persona')
        .select([
          'COALESCE(persona.direccion, \'Sin especificar\') as location',
          'COUNT(*) as total_voters',
          'SUM(CASE WHEN vh.ha_votado = true THEN 1 ELSE 0 END) as voted'
        ])
        .where('vh.id_eleccion = :electionId', { electionId })
        .groupBy('persona.direccion')
        .orderBy('voted', 'DESC')
        .getRawMany();

      return participation.map(p => ({
        location: p.location || 'Sin especificar',
        total_voters: parseInt(p.total_voters),
        voted: parseInt(p.voted),
        participation_rate: p.total_voters > 0 ? (p.voted / p.total_voters) * 100 : 0,
      }));
    } catch (error) {
      console.error('❌ Error obteniendo participación por ubicación:', error);
      return [];
    }
  }

  // ✅ MÉTODO CORREGIDO: Lista de votantes
  async getElectionVoters(electionId: number) {
    try {
      const voters = await this.votanteHabilitadoRepository
        .createQueryBuilder('vh')
        .select([
          'persona.nombres as nombres',
          'persona.apellidos as apellidos',
          'persona.numero_documento as documento',
          'vh.ha_votado as ha_votado',
          'vh.fecha_voto as fecha_voto',
          'vh.ip_voto as ip_voto',
          'vh.dispositivo_voto as dispositivo_voto',
        ])
        .innerJoin('vh.persona', 'persona')
        .where('vh.id_eleccion = :electionId', { electionId })
        .orderBy('vh.fecha_voto', 'DESC')
        .addOrderBy('persona.nombres', 'ASC')
        .getRawMany();

      return voters.map(voter => ({
        nombre: `${voter.nombres} ${voter.apellidos}`.trim(),
        documento: voter.documento,
        ha_votado: !!voter.ha_votado,
        fecha_voto: voter.fecha_voto,
        ip_voto: voter.ip_voto,
        dispositivo_voto: voter.dispositivo_voto,
      }));
    } catch (error) {
      console.error('❌ Error obteniendo votantes:', error);
      return [];
    }
  }

  // ✅ MÉTODO CORREGIDO: Resultados finales
  async getFinalResults(electionId: number) {
    try {
      const eleccion = await this.eleccionRepository.findOne({
        where: { id_eleccion: electionId },
        relations: ['tipoEleccion'],
      });

      if (!eleccion) {
        throw new NotFoundException('Elección no encontrada');
      }

      const totalVotosEmitidos = await this.votoRepository.count({
        where: { id_eleccion: electionId },
      });

      const totalVotantesHabilitados = await this.votanteHabilitadoRepository.count({
        where: { id_eleccion: electionId },
      });

      const votosBlanco = await this.votoRepository.count({
        where: { id_eleccion: electionId, id_candidato: null },
      });

      const candidatos = await this.candidatoRepository.find({
        where: { id_eleccion: electionId, estado: 'validado' },
        relations: ['persona'],
      });

      const resultados = await Promise.all(
        candidatos.map(async (candidato, index) => {
          const votos = await this.votoRepository.count({
            where: { 
              id_eleccion: electionId,
              id_candidato: candidato.id_candidato 
            },
          });

          return {
            posicion: index + 1,
            candidato_id: candidato.id_candidato,
            candidato_nombre: `${candidato.persona.nombres} ${candidato.persona.apellidos}`.trim(),
            votos: votos,
            porcentaje: totalVotosEmitidos > 0 ? Math.round((votos / totalVotosEmitidos) * 10000) / 100 : 0,
            es_ganador: false // Se calculará después
          };
        })
      );

      // Ordenar por votos y marcar ganador
      resultados.sort((a, b) => b.votos - a.votos);
      if (resultados.length > 0) {
        resultados[0].es_ganador = true;
      }

      // Recalcular posiciones
      resultados.forEach((resultado, index) => {
        resultado.posicion = index + 1;
      });

      return {
        eleccion: {
          id: eleccion.id_eleccion,
          titulo: eleccion.titulo,
          fecha_inicio: eleccion.fecha_inicio,
          fecha_fin: eleccion.fecha_fin,
        },
        estadisticas: {
          total_votantes_habilitados: totalVotantesHabilitados,
          total_votos_emitidos: totalVotosEmitidos,
          participacion_porcentaje: totalVotantesHabilitados > 0 
            ? Math.round((totalVotosEmitidos / totalVotantesHabilitados) * 10000) / 100
            : 0,
          votos_blanco: votosBlanco,
        },
        resultados: resultados,
      };
    } catch (error) {
      console.error('❌ Error obteniendo resultados finales:', error);
      throw error;
    }
  }

  // ✅ MÉTODO NUEVO: Para debugging de datos
  async debugElectionData(electionId: number) {
    try {
      console.log('🔍 DEBUG: Verificando datos de elección', electionId);
      
      const eleccion = await this.eleccionRepository.findOne({
        where: { id_eleccion: electionId },
        relations: ['tipoEleccion'],
      });

      if (!eleccion) {
        return { error: 'Elección no encontrada' };
      }

      const [
        candidatos,
        totalVotos,
        totalVotantes,
        votosBlanco
      ] = await Promise.all([
        this.candidatoRepository.find({
          where: { id_eleccion: electionId, estado: 'validado' },
          relations: ['persona'],
        }),
        this.votoRepository.count({ where: { id_eleccion: electionId } }),
        this.votanteHabilitadoRepository.count({ where: { id_eleccion: electionId } }),
        this.votoRepository.count({ where: { id_eleccion: electionId, id_candidato: null } })
      ]);

      const candidatosInfo = await Promise.all(
        candidatos.map(async (candidato) => {
          const votos = await this.votoRepository.count({
            where: { id_eleccion: electionId, id_candidato: candidato.id_candidato },
          });

          return {
            id: candidato.id_candidato,
            nombre: `${candidato.persona.nombres} ${candidato.persona.apellidos}`.trim(),
            votos_bd: votos,
            votos_reportados: candidato.votos_recibidos,
            diferencia: votos - candidato.votos_recibidos
          };
        })
      );

      const sumaVotosCandidatos = candidatosInfo.reduce((sum, c) => sum + c.votos_bd, 0);

      return {
        eleccion: {
          id: eleccion.id_eleccion,
          titulo: eleccion.titulo,
          estado: eleccion.estado,
        },
        estadisticas: {
          total_votos_bd: totalVotos,
          total_votos_reportado: eleccion.total_votos_emitidos,
          total_votantes_bd: totalVotantes,
          total_votantes_reportado: eleccion.total_votantes_habilitados,
          votos_blanco: votosBlanco,
          suma_votos_candidatos: sumaVotosCandidatos,
          total_calculado: sumaVotosCandidatos + votosBlanco,
        },
        candidatos: candidatosInfo,
        inconsistencias: {
          votos_totales: totalVotos !== eleccion.total_votos_emitidos,
          votantes_totales: totalVotantes !== eleccion.total_votantes_habilitados,
          suma_no_coincide: (sumaVotosCandidatos + votosBlanco) !== totalVotos,
        }
      };
    } catch (error) {
      console.error('❌ Error en debug:', error);
      return { error: error.message };
    }
  }

  // ✅ MÉTODO NUEVO: Para sincronizar contadores
  async syncElectionCounters(electionId: number) {
    try {
      console.log('🔄 Sincronizando contadores para elección', electionId);
      
      const eleccion = await this.eleccionRepository.findOne({
        where: { id_eleccion: electionId },
        relations: ['candidatos'],
      });

      if (!eleccion) {
        throw new NotFoundException('Elección no encontrada');
      }

      // Contar votos reales en la BD
      const votosTotalesReales = await this.votoRepository.count({
        where: { id_eleccion: electionId },
      });

      const votantesTotalesReales = await this.votanteHabilitadoRepository.count({
        where: { id_eleccion: electionId },
      });

      // Actualizar contadores en la elección
      await this.eleccionRepository.update(electionId, {
        total_votos_emitidos: votosTotalesReales,
        total_votantes_habilitados: votantesTotalesReales
      });

      // Actualizar contadores por candidato
      for (const candidato of eleccion.candidatos) {
        const votosReales = await this.votoRepository.count({
          where: { id_eleccion: electionId, id_candidato: candidato.id_candidato },
        });

        await this.candidatoRepository.update(candidato.id_candidato, {
          votos_recibidos: votosReales
        });

        console.log(`📊 Candidato ${candidato.id_candidato}: ${votosReales} votos`);
      }

      console.log('✅ Contadores sincronizados');
      return { 
        message: 'Contadores sincronizados exitosamente',
        votos_totales: votosTotalesReales,
        votantes_totales: votantesTotalesReales
      };
    } catch (error) {
      console.error('❌ Error sincronizando contadores:', error);
      throw error;
    }
  }

  // ✅ MÉTODOS HEREDADOS: Para compatibilidad con versiones anteriores
  async getDashboardStats() {
    try {
      const globalStats = await this.getGlobalRealTimeStats();
      const elections = await this.getRealTimeElections();

      return {
        ...globalStats.summary,
        elections: elections,
        recent_activity: globalStats.recent_activity,
      };
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas del dashboard:', error);
      return {
        total_elections: 0,
        active_elections: 0,
        total_votes: 0,
        total_voters: 0,
        participation_rate: 0,
        elections: [],
        recent_activity: [],
      };
    }
  }

  async getElectionTrends(electionId: number) {
    return this.getElectionHourlyTrends(electionId);
  }

  // ✅ MÉTODO NUEVO: Para obtener estadísticas específicas de una elección
  async getElectionSpecificStats(electionId: number) {
    try {
      const elections = await this.getRealTimeElections();
      const election = elections.find(e => e.id === electionId);
      
      if (!election) {
        throw new NotFoundException('Elección no encontrada');
      }

      return election;
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas específicas:', error);
      throw error;
    }
  }

  // ✅ MÉTODO NUEVO: Para obtener métricas de rendimiento
  async getPerformanceMetrics() {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      const [
        votesLastHour,
        activeConnections,
        avgResponseTime
      ] = await Promise.all([
        this.votoRepository.count({
          where: {
            timestamp_voto: {
              $gte: oneHourAgo
            } as any
          }
        }),
        // Simular conexiones activas (esto vendría del WebSocket Gateway)
        Promise.resolve(Math.floor(Math.random() * 50) + 1),
        // Simular tiempo de respuesta promedio
        Promise.resolve(Math.floor(Math.random() * 100) + 50)
      ]);

      return {
        votes_last_hour: votesLastHour,
        active_connections: activeConnections,
        avg_response_time_ms: avgResponseTime,
        server_status: 'healthy',
        last_updated: now
      };
    } catch (error) {
      console.error('❌ Error obteniendo métricas de rendimiento:', error);
      return {
        votes_last_hour: 0,
        active_connections: 0,
        avg_response_time_ms: 0,
        server_status: 'error',
        last_updated: new Date()
      };
    }
  }
}