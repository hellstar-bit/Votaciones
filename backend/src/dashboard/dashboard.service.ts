// 📁 src/dashboard/dashboard.service.ts
// ====================================================================
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