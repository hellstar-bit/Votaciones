// 📁 backend/src/dashboard/dashboard.service.ts - MÉTODOS ADICIONALES
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
    const [
      totalElections,
      activeElections,
      totalVotes,
      totalVoters,
    ] = await Promise.all([
      this.eleccionRepository.count(),
      this.eleccionRepository.count({ where: { estado: 'activa' } }),
      this.votoRepository.count(),
      this.votanteHabilitadoRepository.count(),
    ]);

    const recentVotes = await this.votoRepository.find({
      take: 10,
      order: { timestamp_voto: 'DESC' },
      relations: ['eleccion', 'candidato', 'candidato.persona'],
    });

    return {
      summary: {
        total_elections: totalElections,
        active_elections: activeElections,
        total_votes: totalVotes,
        total_voters: totalVoters,
        participation_rate: totalVoters > 0 ? Math.round((totalVotes / totalVoters) * 100) : 0,
      },
      recent_activity: recentVotes.map(vote => ({
        id: vote.id_voto,
        election: vote.eleccion.titulo,
        candidate: vote.candidato ? vote.candidato.persona.nombreCompleto : 'VOTO EN BLANCO',
        timestamp: vote.timestamp_voto,
      })),
    };
  }

  async getRealTimeElections() {
    const activeElections = await this.eleccionRepository.find({
      where: { estado: 'activa' },
      relations: ['tipoEleccion', 'centro', 'sede', 'ficha'],
      order: { fecha_inicio: 'DESC' },
    });

    const electionsWithStats = await Promise.all(
      activeElections.map(async (election) => {
        // Obtener candidatos con sus votos
        const candidates = await this.candidatoRepository.find({
          where: { id_eleccion: election.id_eleccion, estado: 'validado' },
          relations: ['persona'],
        });

        // Contar votos por candidato
        const votesPerCandidate = await Promise.all(
          candidates.map(async (candidate) => {
            const voteCount = await this.votoRepository.count({
              where: { 
                id_eleccion: election.id_eleccion, 
                id_candidato: candidate.id_candidato 
              },
            });

            return {
              candidato: candidate.persona.nombreCompleto,
              votos: voteCount,
              porcentaje: election.total_votos_emitidos > 0 
                ? (voteCount / election.total_votos_emitidos) * 100 
                : 0,
            };
          })
        );

        // Contar votos en blanco
        const blankVotes = await this.votoRepository.count({
          where: { 
            id_eleccion: election.id_eleccion, 
            id_candidato: null 
          },
        });

        if (blankVotes > 0) {
          votesPerCandidate.push({
            candidato: 'Voto en Blanco',
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

  async getGlobalRealTimeStats() {
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

    // Actividad reciente (últimos 10 votos)
    const recentActivity = await this.votoRepository
      .createQueryBuilder('voto')
      .innerJoin('voto.eleccion', 'eleccion')
      .leftJoin('voto.candidato', 'candidato')
      .leftJoin('candidato.persona', 'persona')
      .select([
        'voto.created_at',
        'eleccion.titulo',
        'persona.nombreCompleto',
      ])
      .where('eleccion.estado = :estado', { estado: 'activa' })
      .orderBy('voto.created_at', 'DESC')
      .limit(10)
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
      recent_activity: recentActivity.map(activity => ({
        election: activity.eleccion_titulo,
        candidate: activity.persona_nombreCompleto || 'Voto en Blanco',
        timestamp: activity.voto_created_at,
      })),
    };
  }

  async getElectionTrends(electionId: number) {
    // Obtener votos por hora de las últimas 24 horas
    const votes = await this.votoRepository
      .createQueryBuilder('voto')
      .select([
        'DATE_FORMAT(voto.timestamp_voto, "%Y-%m-%d %H:00:00") as hour',
        'COUNT(*) as count'
      ])
      .where('voto.id_eleccion = :electionId', { electionId })
      .andWhere('voto.timestamp_voto >= DATE_SUB(NOW(), INTERVAL 24 HOUR)')
      .groupBy('hour')
      .orderBy('hour', 'ASC')
      .getRawMany();

    return votes.map(vote => ({
      hour: vote.hour,
      votes: parseInt(vote.count),
    }));
  }

  async getParticipationByLocation(electionId: number) {
    const election = await this.eleccionRepository.findOne({
      where: { id_eleccion: electionId },
      relations: ['tipoEleccion'],
    });

    if (!election) {
      return [];
    }

    // Determinar agrupación según el tipo de elección
    let groupBy = '';
    let selectFields = '';

    switch (election.tipoEleccion.nivel_aplicacion) {
      case 'centro':
        groupBy = 'p.jornada';
        selectFields = 'p.jornada as location';
        break;
      case 'sede':
        groupBy = 'f.numero_ficha';
        selectFields = 'f.numero_ficha as location';
        break;
      case 'ficha':
        groupBy = 'p.id_persona';
        selectFields = '"Ficha completa" as location';
        break;
      default:
        return [];
    }

    const participation = await this.votanteHabilitadoRepository
      .createQueryBuilder('vh')
      .select([
        selectFields,
        'COUNT(*) as total_voters',
        'SUM(CASE WHEN vh.ha_votado = 1 THEN 1 ELSE 0 END) as voted'
      ])
      .leftJoin('vh.persona', 'p')
      .leftJoin('p.ficha', 'f')
      .where('vh.id_eleccion = :electionId', { electionId })
      .groupBy(groupBy)
      .getRawMany();

    return participation.map(p => ({
      location: p.location,
      total_voters: parseInt(p.total_voters),
      voted: parseInt(p.voted),
      participation_rate: Math.round((p.voted / p.total_voters) * 100),
    }));
  }
}