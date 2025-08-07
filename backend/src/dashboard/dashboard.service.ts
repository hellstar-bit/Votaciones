// backend/src/dashboard/dashboard.service.ts - Versión corregida con queries funcionales
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Eleccion } from '../elections/entities/eleccion.entity';
import { Voto } from '../votes/entities/voto.entity';
import { VotanteHabilitado } from '../votes/entities/votante-habilitado.entity';
import { Candidato } from '../candidates/entities/candidato.entity';

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
  ) {}

  async getDashboardStats() {
    const activeElections = await this.eleccionRepository.count({
      where: { estado: 'activa' },
    });

    const totalElections = await this.eleccionRepository.count();

    const totalVotes = await this.votoRepository
      .createQueryBuilder('voto')
      .innerJoin('voto.eleccion', 'eleccion')
      .where('eleccion.estado = :estado', { estado: 'activa' })
      .getCount();

    const totalEnabledVoters = await this.votanteHabilitadoRepository
      .createQueryBuilder('votante')
      .innerJoin('votante.eleccion', 'eleccion')
      .where('eleccion.estado = :estado', { estado: 'activa' })
      .getCount();

    // ✅ QUERY SIMPLIFICADA para actividad reciente
    const recentActivity = await this.votoRepository
      .createQueryBuilder('voto')
      .innerJoin('elecciones', 'eleccion', 'eleccion.id_eleccion = voto.id_eleccion')
      .leftJoin('candidatos', 'candidato', 'candidato.id_candidato = voto.id_candidato')
      .leftJoin('personas', 'candidatoPersona', 'candidatoPersona.id_persona = candidato.id_persona')
      .select([
        'voto.timestamp_voto as timestamp',
        'eleccion.titulo as eleccion_titulo',
        'candidatoPersona.nombres as candidato_nombres',
        'candidatoPersona.apellidos as candidato_apellidos'
      ])
      .where('eleccion.estado IN (:...estados)', { estados: ['activa', 'finalizada'] })
      .orderBy('voto.timestamp_voto', 'DESC')
      .limit(20)
      .getRawMany();

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
      recent_activity: recentActivity.map((activity, index) => ({
        id: Date.now() + index,
        votante_nombre: 'Votante', // Por privacidad no mostramos el nombre real
        eleccion_titulo: activity.eleccion_titulo,
        candidato_nombre: activity.candidato_nombres && activity.candidato_apellidos 
          ? `${activity.candidato_nombres} ${activity.candidato_apellidos}`
          : 'Voto en Blanco',
        timestamp: activity.timestamp,
        metodo_identificacion: 'qr',
      })),
    };
  }

  // ✅ MÉTODO CORREGIDO: Obtener elecciones con estadísticas en tiempo real
  async getRealTimeElections() {
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
        // Obtener candidatos con votos
        const candidatos = await this.candidatoRepository.find({
          where: { id_eleccion: election.id_eleccion, estado: 'validado' },
          relations: ['persona'],
        });

        // Calcular votos por candidato
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
              candidato_nombre: candidato.persona.nombreCompleto,
              votos: votos,
              porcentaje: election.total_votos_emitidos > 0 
                ? (votos / election.total_votos_emitidos) * 100 
                : 0,
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
            porcentaje: election.total_votos_emitidos > 0 
              ? (blankVotes / election.total_votos_emitidos) * 100 
              : 0,
          });
        }

        return {
          id: election.id_eleccion,
          titulo: election.titulo,
          estado: election.estado,
          fecha_inicio: election.fecha_inicio,
          fecha_fin: election.fecha_fin,
          estadisticas: {
            total_votos: election.total_votos_emitidos,
            total_votantes_habilitados: election.total_votantes_habilitados,
            participacion_porcentaje: election.total_votantes_habilitados > 0 
              ? (election.total_votos_emitidos / election.total_votantes_habilitados) * 100 
              : 0,
            votos_por_candidato: votesPerCandidate,
          },
        };
      })
    );

    return electionsWithStats;
  }

  // ✅ MÉTODO CORREGIDO: Obtener estadísticas globales en tiempo real
  async getGlobalRealTimeStats() {
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

    // ✅ ACTIVIDAD RECIENTE SIMPLIFICADA (sin nombres de votantes por privacidad)
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
      recent_activity: recentActivity.map((activity, index) => ({
        id: activity.voto_id || (Date.now() + index),
        votante_nombre: 'Votante', // Por privacidad
        eleccion_titulo: activity.eleccion_titulo,
        candidato_nombre: activity.candidato_nombres && activity.candidato_apellidos 
          ? `${activity.candidato_nombres} ${activity.candidato_apellidos}`
          : 'Voto en Blanco',
        timestamp: activity.timestamp,
        metodo_identificacion: 'qr',
      })),
    };
  }

  // ✅ MÉTODO SIMPLIFICADO: Obtener lista de votantes de una elección
  async getElectionVoters(electionId: number) {
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
  }

  // ✅ MÉTODO SIMPLIFICADO: Obtener tendencias por hora
  async getElectionHourlyTrends(electionId: number) {
    const trends = await this.votoRepository
      .createQueryBuilder('voto')
      .select([
        'HOUR(voto.timestamp_voto) as hora',
        'COUNT(*) as votos',
        'DATE(voto.timestamp_voto) as fecha'
      ])
      .where('voto.id_eleccion = :electionId', { electionId })
      .andWhere('voto.timestamp_voto >= DATE_SUB(NOW(), INTERVAL 7 DAY)')
      .groupBy('DATE(voto.timestamp_voto), HOUR(voto.timestamp_voto)')
      .orderBy('voto.timestamp_voto', 'ASC')
      .getRawMany();

    return trends.map(trend => ({
      fecha: trend.fecha,
      hora: parseInt(trend.hora),
      votos: parseInt(trend.votos),
      timestamp: `${trend.fecha} ${trend.hora.toString().padStart(2, '0')}:00:00`
    }));
  }

  // ✅ MÉTODO SIMPLIFICADO: Obtener participación por ubicación
  async getParticipationByLocation(electionId: number) {
    const election = await this.eleccionRepository.findOne({
      where: { id_eleccion: electionId },
      relations: ['tipoEleccion'],
    });

    if (!election) {
      return [];
    }

    // Participación por jornada (más simple y funcional)
    const participation = await this.votanteHabilitadoRepository
      .createQueryBuilder('vh')
      .innerJoin('personas', 'p', 'p.id_persona = vh.id_persona')
      .select([
        'COALESCE(p.jornada, "sin_jornada") as location',
        'COUNT(*) as total_voters',
        'SUM(CASE WHEN vh.ha_votado = 1 THEN 1 ELSE 0 END) as voted'
      ])
      .where('vh.id_eleccion = :electionId', { electionId })
      .groupBy('p.jornada')
      .getRawMany();

    return participation.map(p => ({
      location: p.location || 'Sin jornada',
      total_voters: parseInt(p.total_voters),
      voted: parseInt(p.voted),
      participation_rate: Math.round((p.voted / p.total_voters) * 100),
    }));
  }

  // ✅ MÉTODO SIMPLIFICADO: Obtener resultados finales
  async getFinalResults(electionId: number) {
    const election = await this.eleccionRepository.findOne({
      where: { id_eleccion: electionId },
      relations: ['tipoEleccion'],
    });

    if (!election || election.estado !== 'finalizada') {
      throw new Error('Elección no encontrada o no finalizada');
    }

    const candidatos = await this.candidatoRepository.find({
      where: { id_eleccion: electionId, estado: 'validado' },
      relations: ['persona'],
      order: { votos_recibidos: 'DESC' }
    });

    const votosBlanco = await this.votoRepository.count({
      where: { id_eleccion: electionId, id_candidato: null },
    });

    const resultados = candidatos.map((candidato, index) => ({
      posicion: index + 1,
      candidato_id: candidato.id_candidato,
      candidato_nombre: candidato.persona.nombreCompleto,
      votos: candidato.votos_recibidos,
      porcentaje: election.total_votos_emitidos > 0 
        ? (candidato.votos_recibidos / election.total_votos_emitidos) * 100 
        : 0,
      es_ganador: index === 0 && candidato.votos_recibidos > 0
    }));

    if (election.permite_voto_blanco && votosBlanco > 0) {
      resultados.push({
        posicion: resultados.length + 1,
        candidato_id: 0,
        candidato_nombre: 'Voto en Blanco',
        votos: votosBlanco,
        porcentaje: election.total_votos_emitidos > 0 
          ? (votosBlanco / election.total_votos_emitidos) * 100 
          : 0,
        es_ganador: false
      });
    }

    return {
      eleccion: {
        id: election.id_eleccion,
        titulo: election.titulo,
        fecha_inicio: election.fecha_inicio,
        fecha_fin: election.fecha_fin,
      },
      estadisticas: {
        total_votantes_habilitados: election.total_votantes_habilitados,
        total_votos_emitidos: election.total_votos_emitidos,
        participacion_porcentaje: election.total_votantes_habilitados > 0 
          ? (election.total_votos_emitidos / election.total_votantes_habilitados) * 100 
          : 0,
        votos_blanco: votosBlanco
      },
      resultados: resultados.sort((a, b) => b.votos - a.votos)
    };
  }

  // Método heredado (mantener compatibilidad)
  async getElectionTrends(electionId: number) {
    return this.getElectionHourlyTrends(electionId);
  }
}