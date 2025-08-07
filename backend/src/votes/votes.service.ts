// 📁 backend/src/votes/votes.service.ts - CORREGIDO para usar entidades correctas
import { Injectable, BadRequestException, ForbiddenException, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { Voto } from './entities/voto.entity';
import { VotanteHabilitado } from './entities/votante-habilitado.entity';
import { Eleccion } from '../elections/entities/eleccion.entity';
import { Candidato } from '../candidates/entities/candidato.entity';
import { Persona } from '../users/entities/persona.entity';
import { VoteDto } from './dto/vote.dto';
import { DashboardGateway } from '../dashboard/dashboard.gateway';

@Injectable()
export class VotesService {
  constructor(
    @Inject(forwardRef(() => DashboardGateway))
    private dashboardGateway: DashboardGateway,
    @InjectRepository(Voto)
    private votoRepository: Repository<Voto>,
    @InjectRepository(VotanteHabilitado)
    private votanteHabilitadoRepository: Repository<VotanteHabilitado>,
    @InjectRepository(Eleccion)
    private eleccionRepository: Repository<Eleccion>,
    @InjectRepository(Candidato)
    private candidatoRepository: Repository<Candidato>,
    @InjectRepository(Persona)
    private personaRepository: Repository<Persona>,
  ) {}

  async processVote(voteDto: VoteDto, ipAddress: string, userAgent: string) {
    const { id_eleccion, id_candidato, qr_code } = voteDto;

    console.log('🔍 Procesando voto:', { 
      id_eleccion, 
      id_candidato, 
      qr_preview: qr_code?.substring(0, 100) + '...' 
    });

    // 1. Verificar que la elección existe y está activa
    const eleccion = await this.eleccionRepository.findOne({
      where: { id_eleccion, estado: 'activa' },
      relations: ['tipoEleccion'],
    });

    if (!eleccion) {
      throw new NotFoundException('Elección no encontrada o no está activa');
    }

    console.log('✅ Elección encontrada:', eleccion.titulo);

    // 2. Verificar horario de votación
    const ahora = new Date();
    const fechaInicio = new Date(eleccion.fecha_inicio);
    const fechaFin = new Date(eleccion.fecha_fin);

    if (ahora < fechaInicio) {
      const minutosParaInicio = Math.round((fechaInicio.getTime() - ahora.getTime()) / (1000 * 60));
      throw new BadRequestException(
        `La votación aún no ha comenzado. Faltan ${minutosParaInicio} minutos.`
      );
    }

    if (ahora > fechaFin) {
      throw new BadRequestException('La votación ya ha finalizado');
    }

    // 3. Decodificar y validar QR
    let personaData;
    try {
      const qrDecoded = Buffer.from(qr_code, 'base64').toString('utf-8');
      personaData = JSON.parse(qrDecoded);
      
      if (!personaData.numero_documento) {
        throw new Error('QR no contiene número de documento');
      }
    } catch (error) {
      console.error('❌ Error decodificando QR:', error);
      throw new BadRequestException('Código QR inválido o corrupto');
    }

    // 4. Verificar que la persona existe y está habilitada
    const persona = await this.personaRepository.findOne({
      where: { numero_documento: personaData.numero_documento },
    });

    if (!persona) {
      console.error('❌ Persona no encontrada:', personaData.numero_documento);
      throw new BadRequestException('Persona no encontrada en el sistema');
    }

    console.log('✅ Persona encontrada:', persona.nombreCompleto);

    // ✅ 5. CORREGIDO: Buscar votante habilitado por id_persona
    const votanteHabilitado = await this.votanteHabilitadoRepository.findOne({
      where: { 
        id_eleccion, 
        id_persona: persona.id_persona // ✅ USAR id_persona en lugar de documento_votante
      },
    });

    if (!votanteHabilitado) {
      console.error('❌ Votante no habilitado:', personaData.numero_documento);
      throw new ForbiddenException('No está habilitado para votar en esta elección');
    }

    if (votanteHabilitado.ha_votado) {
      console.error('❌ Ya votó:', personaData.numero_documento);
      throw new BadRequestException('Ya ha emitido su voto en esta elección');
    }

    console.log('✅ Votante habilitado y no ha votado');

    // 6. Verificar candidato si no es voto en blanco
    let candidato = null;
    if (id_candidato !== null && id_candidato !== undefined) {
      candidato = await this.candidatoRepository.findOne({
        where: { 
          id_candidato, 
          id_eleccion, 
          estado: 'validado',
        },
        relations: ['persona']
      });

      if (!candidato) {
        console.error('❌ Candidato no válido:', id_candidato);
        throw new BadRequestException('Candidato no válido para esta elección');
      }

      console.log('✅ Candidato válido:', candidato.persona.nombreCompleto);
    } else {
      // Verificar que se permite voto en blanco
      if (!eleccion.permite_voto_blanco) {
        throw new BadRequestException('No se permite voto en blanco en esta elección');
      }
      console.log('✅ Voto en blanco válido');
    }

    // 7. Generar hash de verificación único
    const hashData = `${id_eleccion}-${persona.id_persona}-${Date.now()}-${Math.random()}`;
    const hash_verificacion = crypto.createHash('sha256').update(hashData).digest('hex');

    // ✅ 8. CORREGIDO: Registrar el voto sin documento_votante
    const voto = this.votoRepository.create({
      id_eleccion,
      id_candidato: id_candidato || null,
      hash_verificacion,
      // ✅ NO INCLUIR documento_votante ya que no existe en la entidad
    });

    await this.votoRepository.save(voto);
    console.log('✅ Voto registrado en BD');

    // 9. Marcar votante como que ya votó
    await this.votanteHabilitadoRepository.update(votanteHabilitado.id_votante_habilitado, {
      ha_votado: true,
      fecha_voto: new Date(),
      ip_voto: ipAddress,
      dispositivo_voto: userAgent,
    });

    // 10. Actualizar contador de votos en candidato (si no es voto en blanco)
    if (candidato) {
      await this.candidatoRepository.increment(
        { id_candidato }, 
        'votos_recibidos', 
        1
      );
    }

    // 11. Actualizar total de votos en elección
    await this.eleccionRepository.increment(
      { id_eleccion }, 
      'total_votos_emitidos', 
      1
    );

    console.log('✅ Contadores actualizados');

    // ✅ 12. NOTIFICAR AL DASHBOARD CON INFORMACIÓN COMPLETA
    try {
      if (this.dashboardGateway) {
        // Enviar documento del votante y ID del candidato para que el gateway obtenga los nombres
        await this.dashboardGateway.notifyNewVote(
          id_eleccion, 
          personaData.numero_documento, // ✅ Documento del votante
          id_candidato // ✅ ID del candidato (null si es voto en blanco)
        );
        console.log('📡 Notificación enviada al dashboard en tiempo real');
      }
    } catch (error) {
      console.warn('⚠️ No se pudo notificar al dashboard:', error.message);
    }

    // ✅ 13. RESULTADO CON INFORMACIÓN COMPLETA
    const result = {
      message: 'Voto registrado exitosamente',
      hash_verificacion,
      timestamp: new Date(),
      votante: persona.nombreCompleto, // ✅ NOMBRE COMPLETO DEL VOTANTE
      candidato: candidato ? 
        `${candidato.persona.nombres} ${candidato.persona.apellidos}`.trim() : 
        'Voto en Blanco',
      eleccion: eleccion.titulo,
    };

    console.log('✅ Voto procesado exitosamente:', result);
    return result;
  }

  async verifyVote(hash_verificacion: string) {
    const voto = await this.votoRepository.findOne({
      where: { hash_verificacion },
      relations: ['eleccion', 'candidato', 'candidato.persona'],
    });

    if (!voto) {
      throw new NotFoundException('Voto no encontrado');
    }

    return {
      id: voto.id_voto,
      eleccion: voto.eleccion.titulo,
      candidato: voto.candidato ? voto.candidato.persona.nombreCompleto : 'VOTO EN BLANCO',
      timestamp: voto.timestamp_voto,
      verificado: true,
    };
  }

  async getElectionResults(id_eleccion: number) {
    const eleccion = await this.eleccionRepository.findOne({
      where: { id_eleccion },
      relations: ['candidatos', 'candidatos.persona'],
    });

    if (!eleccion) {
      throw new NotFoundException('Elección no encontrada');
    }

    const totalVotos = await this.votoRepository.count({
      where: { id_eleccion },
    });

    const votosBlanco = await this.votoRepository.count({
      where: { id_eleccion, id_candidato: null },
    });

    const resultados = await Promise.all(
      eleccion.candidatos.map(async (candidato) => {
        const votos = await this.votoRepository.count({
          where: { id_eleccion, id_candidato: candidato.id_candidato },
        });

        return {
          candidato: {
            id: candidato.id_candidato,
            nombre: candidato.persona.nombreCompleto,
            numero_lista: candidato.numero_lista,
          },
          votos,
          porcentaje: totalVotos > 0 ? Math.round((votos / totalVotos) * 10000) / 100 : 0,
        };
      })
    );

    return {
      eleccion: {
        id: eleccion.id_eleccion,
        titulo: eleccion.titulo,
        estado: eleccion.estado,
      },
      total_votos: totalVotos,
      votos_blanco: votosBlanco,
      porcentaje_blanco: totalVotos > 0 ? Math.round((votosBlanco / totalVotos) * 10000) / 100 : 0,
      candidatos: resultados.sort((a, b) => b.votos - a.votos),
    };
  }

  // ✅ NUEVO: Método para obtener estadísticas de una elección específica
  async getElectionStats(id_eleccion: number) {
    const eleccion = await this.eleccionRepository.findOne({
      where: { id_eleccion },
      relations: ['candidatos', 'candidatos.persona'],
    });

    if (!eleccion) {
      throw new NotFoundException('Elección no encontrada');
    }

    const totalVotantes = eleccion.total_votantes_habilitados;
    const totalVotos = eleccion.total_votos_emitidos;
    const porcentajeParticipacion = totalVotantes > 0 ? (totalVotos / totalVotantes) * 100 : 0;
    
    // Obtener votos en blanco
    const votosBlanco = await this.votoRepository.count({
      where: { id_eleccion, id_candidato: null },
    });
    
    const candidatosConVotos = eleccion.candidatos.map(candidato => ({
      id: candidato.id_candidato,
      nombre: candidato.persona.nombreCompleto,
      numero_lista: candidato.numero_lista,
      votos: candidato.votos_recibidos,
      porcentaje: totalVotos > 0 ? Math.round((candidato.votos_recibidos / totalVotos) * 10000) / 100 : 0,
    }));

    return {
      eleccion: {
        id: eleccion.id_eleccion,
        titulo: eleccion.titulo,
        estado: eleccion.estado,
        fecha_inicio: eleccion.fecha_inicio,
        fecha_fin: eleccion.fecha_fin,
      },
      estadisticas: {
        total_votantes: totalVotantes,
        total_votos: totalVotos,
        votos_blanco: votosBlanco,
        porcentaje_participacion: Math.round(porcentajeParticipacion * 100) / 100,
      },
      candidatos: candidatosConVotos.sort((a, b) => b.votos - a.votos),
    };
  }

  // ✅ NUEVO: Método para obtener la lista de votantes de una elección
  async getElectionVoters(id_eleccion: number) {
    const votantes = await this.votanteHabilitadoRepository.find({
      where: { id_eleccion },
      relations: ['persona'],
      order: { fecha_voto: 'DESC' }
    });

    return votantes.map(votante => ({
      id: votante.id_votante_habilitado,
      persona: {
        nombre_completo: votante.persona.nombreCompleto,
        numero_documento: votante.persona.numero_documento,
        email: votante.persona.email,
      },
      ha_votado: votante.ha_votado,
      fecha_voto: votante.fecha_voto,
      ip_voto: votante.ip_voto,
      dispositivo_voto: votante.dispositivo_voto,
    }));
  }

  // ✅ NUEVO: Método para obtener tendencias de votación por hora
  async getVotingTrends(id_eleccion: number, dias: number = 7) {
    const trends = await this.votoRepository
      .createQueryBuilder('voto')
      .select([
        'DATE(voto.timestamp_voto) as fecha',
        'HOUR(voto.timestamp_voto) as hora',
        'COUNT(*) as votos'
      ])
      .where('voto.id_eleccion = :id_eleccion', { id_eleccion })
      .andWhere('voto.timestamp_voto >= DATE_SUB(NOW(), INTERVAL :dias DAY)', { dias })
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
}