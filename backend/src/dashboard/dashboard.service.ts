// 📁 backend/src/dashboard/dashboard.service.ts - QUERY CORREGIDA
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

  // ✅ MÉTODO CORREGIDO: Sin bucle infinito, query optimizada
  async getGlobalRealTimeStats() {
    try {
      console.log('📊 Obteniendo estadísticas globales...');

      const activeElections = await this.eleccionRepository.count({
        where: { estado: 'activa' },
      });

      const totalElections = await this.eleccionRepository.count();

      const totalVotes = await this.votoRepository
        .createQueryBuilder('voto')
        .innerJoin('elecciones', 'eleccion', 'eleccion.id_eleccion = voto.id_eleccion')
        .where('eleccion.estado = :estado', { estado: 'activa' })
        .getCount();

      const totalEnabledVoters = await this.votanteHabilitadoRepository
        .createQueryBuilder('votante')
        .innerJoin('elecciones', 'eleccion', 'eleccion.id_eleccion = votante.id_eleccion')
        .where('eleccion.estado = :estado', { estado: 'activa' })
        .getCount();

      // ✅ ACTIVIDAD RECIENTE SIMPLIFICADA - Sin join complejo que causa bucles
      const recentActivity = await this.votoRepository
        .createQueryBuilder('voto')
        .innerJoin('elecciones', 'eleccion', 'eleccion.id_eleccion = voto.id_eleccion')
        .leftJoin('candidatos', 'candidato', 'candidato.id_candidato = voto.id_candidato')
        .leftJoin('personas', 'candidatoPersona', 'candidatoPersona.id_persona = candidato.id_persona')
        .select([
          'voto.timestamp_voto as timestamp',
          'voto.id_voto as voto_id',
          'eleccion.titulo as eleccion_titulo',
          'eleccion.id_eleccion as eleccion_id',
          'candidatoPersona.nombres as candidato_nombres',
          'candidatoPersona.apellidos as candidato_apellidos'
        ])
        .where('eleccion.estado IN (:...estados)', { estados: ['activa', 'finalizada'] })
        .orderBy('voto.timestamp_voto', 'DESC')
        .limit(20)
        .getRawMany();

      console.log('🔍 Actividad reciente encontrada:', recentActivity.length, 'registros');

      // ✅ Para obtener nombres de votantes, hacemos queries separadas y eficientes
      const activityWithVoters = await Promise.all(
        recentActivity.map(async (activity) => {
          // Buscar el votante que votó en esta elección cerca de este momento
          const votanteHabilitado = await this.votanteHabilitadoRepository
            .createQueryBuilder('vh')
            .innerJoin('personas', 'persona', 'persona.id_persona = vh.id_persona')
            .select([
              'persona.nombres as nombres',
              'persona.apellidos as apellidos',
              'persona.numero_documento as documento'
            ])
            .where('vh.id_eleccion = :eleccionId', { eleccionId: activity.eleccion_id })
            .andWhere('vh.ha_votado = true')
            .andWhere('ABS(TIMESTAMPDIFF(MINUTE, :timestamp, vh.fecha_voto)) <= 2', { 
              timestamp: activity.timestamp 
            })
            .orderBy('ABS(TIMESTAMPDIFF(MINUTE, :timestamp, vh.fecha_voto))', 'ASC')
            .setParameters({ timestamp: activity.timestamp })
            .limit(1)
            .getRawOne();

          return {
            ...activity,
            votante_nombres: votanteHabilitado?.nombres || 'Votante',
            votante_apellidos: votanteHabilitado?.apellidos || '',
            votante_documento: votanteHabilitado?.documento || ''
          };
        })
      );

      return {
        summary: {
          total_elections: totalElections,
          active_elections: activeElections,
          total_votes: totalVotes,
          total_voters: totalEnabledVoters,
          participation_rate: totalEnabledVoters > 0 
            ? (totalVotes / totalEnabledVoters) * 100 
            : 0,
        },
        recent_activity: activityWithVoters.map((activity, index) => ({
          id: activity.voto_id || (Date.now() + index),
          votante_nombre: activity.votante_nombres && activity.votante_apellidos
            ? `${activity.votante_nombres} ${activity.votante_apellidos}`
            : `Votante ${activity.votante_documento || 'Anónimo'}`,
          eleccion_titulo: activity.eleccion_titulo,
          candidato_nombre: activity.candidato_nombres && activity.candidato_apellidos 
            ? `${activity.candidato_nombres} ${activity.candidato_apellidos}`
            : 'Voto en Blanco',
          timestamp: activity.timestamp,
          metodo_identificacion: 'qr',
        })),
      };

    } catch (error) {
      console.error('❌ Error obteniendo estadísticas globales:', error);
      // En caso de error, devolver datos por defecto para evitar crashes
      return {
        summary: {
          total_elections: 0,
          active_elections: 0,
          total_votes: 0,
          total_voters: 0,
          participation_rate: 0,
        },
        recent_activity: [],
      };
    }
  }

  // ✅ MÉTODO CORREGIDO: Elecciones con estadísticas en tiempo real
  async getRealTimeElections() {
    try {
      console.log('📊 Obteniendo elecciones en tiempo real...');

      const elections = await this.eleccionRepository.find({
        where: [
          { estado: 'activa' },
          { estado: 'finalizada' }
        ],
        relations: ['tipoEleccion'],
        order: { fecha_inicio: 'DESC' },
      });

      const electionsWithStats = await Promise.all(
        elections.map(async (election) => {
          try {
            // Obtener candidatos con votos
            const candidatos = await this.candidatoRepository.find({
              where: { id_eleccion: election.id_eleccion, estado: 'validado' },
              relations: ['persona'],
            });

            // Total de votos real de la base de datos
            const totalVotosEmitidos = await this.votoRepository.count({
              where: { id_eleccion: election.id_eleccion },
            });

            // Total de votantes habilitados real
            const totalVotantesHabilitados = await this.votanteHabilitadoRepository.count({
              where: { id_eleccion: election.id_eleccion },
            });

            // Calcular votos por candidato de forma eficiente
            const votesPerCandidate = await Promise.all(
              candidatos.map(async (candidato) => {
                const votos = await this.votoRepository.count({
                  where: { 
                    id_eleccion: election.id_eleccion,
                    id_candidato: candidato.id_candidato 
                  },
                });

                return {
                  candidato_id: candidato.id_candidato,
                  candidato_nombre: `${candidato.persona.nombres} ${candidato.persona.apellidos}`.trim(),
                  votos: votos,
                  porcentaje: totalVotosEmitidos > 0 ? (votos / totalVotosEmitidos) * 100 : 0,
                };
              })
            );

            // Agregar votos en blanco si están permitidos
            if (election.permite_voto_blanco) {
              const blankVotes = await this.votoRepository.count({
                where: { 
                  id_eleccion: election.id_eleccion,
                  id_candidato: null 
                },
              });

              votesPerCandidate.push({
                candidato_id: 0,
                candidato_nombre: 'Voto en Blanco',
                votos: blankVotes,
                porcentaje: totalVotosEmitidos > 0 ? (blankVotes / totalVotosEmitidos) * 100 : 0,
              });
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
                  ? (totalVotosEmitidos / totalVotantesHabilitados) * 100 
                  : 0,
                votos_por_candidato: votesPerCandidate,
              },
            };

          } catch (error) {
            console.error(`❌ Error procesando elección ${election.id_eleccion}:`, error);
            // Devolver datos básicos en caso de error
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
            };
          }
        })
      );

      console.log('✅ Elecciones procesadas:', electionsWithStats.length);
      return electionsWithStats;

    } catch (error) {
      console.error('❌ Error obteniendo elecciones:', error);
      return [];
    }
  }

  // ✅ MÉTODO CORREGIDO: Tendencias por hora
  async getElectionHourlyTrends(electionId: number) {
    try {
      const trends = await this.votoRepository
        .createQueryBuilder('voto')
        .select([
          'HOUR(voto.timestamp_voto) as hora',
          'COUNT(*) as votos',
          'DATE(voto.timestamp_voto) as fecha'
        ])
        .where('voto.id_eleccion = :electionId', { electionId })
        .andWhere('voto.timestamp_voto >= DATE_SUB(NOW(), INTERVAL 1 DAY)')
        .groupBy('DATE(voto.timestamp_voto), HOUR(voto.timestamp_voto)')
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
        .innerJoin('personas', 'persona', 'persona.id_persona = vh.id_persona')
        .select([
          'COALESCE(persona.direccion, "Sin especificar") as location',
          'COUNT(*) as total_voters',
          'SUM(CASE WHEN vh.ha_votado = 1 THEN 1 ELSE 0 END) as voted'
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
        .innerJoin('personas', 'persona', 'persona.id_persona = vh.id_persona')
        .select([
          'persona.nombres as nombres',
          'persona.apellidos as apellidos',
          'persona.numero_documento as documento',
          'vh.ha_votado as ha_votado',
          'vh.fecha_voto as fecha_voto',
          'vh.ip_voto as ip_voto',
          'vh.dispositivo_voto as dispositivo_voto',
        ])
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
            porcentaje: totalVotosEmitidos > 0 ? (votos / totalVotosEmitidos) * 100 : 0,
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
            ? (totalVotosEmitidos / totalVotantesHabilitados) * 100 
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

  // ✅ MÉTODO HEREDADO: Para compatibilidad
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

  // ✅ MÉTODO HEREDADO: Para compatibilidad
  async getElectionTrends(electionId: number) {
    return this.getElectionHourlyTrends(electionId);
  }
}