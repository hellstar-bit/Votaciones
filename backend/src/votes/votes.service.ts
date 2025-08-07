// backend/src/votes/votes.service.ts - Versión completa actualizada
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

    console.log('🕒 Verificando horario:', {
      ahora: ahora.toISOString(),
      fecha_inicio: fechaInicio.toISOString(),
      fecha_fin: fechaFin.toISOString(),
      puede_votar: ahora >= fechaInicio && ahora <= fechaFin
    });

    if (ahora < fechaInicio) {
      const minutosParaInicio = Math.round((fechaInicio.getTime() - ahora.getTime()) / (1000 * 60));
      throw new BadRequestException(
        `La votación aún no ha comenzado. Inicia en ${minutosParaInicio} minutos`
      );
    }

    if (ahora > fechaFin) {
      const minutosDesdeFinalizacion = Math.round((ahora.getTime() - fechaFin.getTime()) / (1000 * 60));
      throw new BadRequestException(
        `La votación ya ha finalizado hace ${minutosDesdeFinalizacion} minutos`
      );
    }

    console.log('✅ Elección en horario válido');

    // 3. Decodificar y verificar QR/documento
    let personaData;
    try {
      personaData = await this.decodeIdentificationData(qr_code);
      console.log('✅ Datos de identificación procesados:', personaData);
    } catch (error) {
      console.error('❌ Error procesando datos de identificación:', error);
      throw new BadRequestException(error.message || 'Datos de identificación inválidos');
    }

    // 4. Buscar la persona
    const persona = await this.personaRepository.findOne({
      where: { 
        numero_documento: personaData.numero_documento, 
        estado: 'activo' 
      },
      relations: ['centro', 'sede', 'ficha'],
    });

    if (!persona) {
      console.error('❌ Persona no encontrada:', personaData.numero_documento);
      throw new BadRequestException(
        `Persona con documento ${personaData.numero_documento} no encontrada o inactiva`
      );
    }

    console.log('✅ Persona encontrada:', {
      nombre: persona.nombreCompleto,
      documento: persona.numero_documento,
      centro: persona.centro?.nombre_centro,
      sede: persona.sede?.nombre_sede,
      ficha: persona.ficha?.numero_ficha
    });

    // 5. Verificar que la persona está habilitada para votar
    const votanteHabilitado = await this.votanteHabilitadoRepository.findOne({
      where: { id_eleccion, id_persona: persona.id_persona },
    });

    if (!votanteHabilitado) {
      console.error('❌ Votante no habilitado:', { 
        eleccion: id_eleccion, 
        persona: persona.id_persona,
        documento: persona.numero_documento
      });
      throw new ForbiddenException(
        `${persona.nombreCompleto} no está habilitado para votar en esta elección`
      );
    }

    if (votanteHabilitado.ha_votado) {
      console.error('❌ Ya votó:', {
        documento: persona.numero_documento,
        fecha_voto: votanteHabilitado.fecha_voto
      });
      throw new BadRequestException(
        `${persona.nombreCompleto} ya ha votado en esta elección`
      );
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

    // 8. Registrar el voto
    const voto = this.votoRepository.create({
      id_eleccion,
      id_candidato: id_candidato || null,
      hash_verificacion,
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
      candidato: candidato ? candidato.persona.nombreCompleto : 'VOTO EN BLANCO',
      metodo_identificacion: personaData.metodo,
      // ✅ INFORMACIÓN ADICIONAL PARA EL FRONTEND
      votante_info: {
        nombre_completo: persona.nombreCompleto,
        documento: persona.numero_documento,
        email: persona.email,
        centro: persona.centro?.nombre_centro,
        sede: persona.sede?.nombre_sede,
        ficha: persona.ficha?.numero_ficha
      }
    };

    console.log('🎉 Voto procesado exitosamente:', result);
    return result;
  }

  /**
   * Decodifica y valida los datos de identificación del votante
   * Soporta tanto QR codes como entrada manual de documento
   */
  private async decodeIdentificationData(data: string): Promise<{ 
    numero_documento: string, 
    metodo: string,
    timestamp?: number,
    id?: number,
    type?: string 
  }> {
    try {
      console.log('🔍 Procesando datos de identificación...');
      
      // Intentar parsear como JSON (QR code)
      try {
        const parsed = JSON.parse(data);
        console.log('📱 Datos parseados como JSON:', parsed);
        
        // Validar formato del QR SENA
        if (parsed.type === 'ACCESUM_SENA_LEARNER' || parsed.type === 'MANUAL_INPUT' || parsed.type === 'DIRECT_INPUT') {
          const documento = parsed.doc || parsed.numero_documento;
          
          if (!documento) {
            throw new Error('QR/datos inválidos: falta número de documento');
          }

          // Validar que el documento sea numérico
          if (!/^\d+$/.test(documento.toString())) {
            throw new Error('Número de documento debe contener solo dígitos');
          }

          // Validar longitud del documento
          if (documento.length < 7 || documento.length > 12) {
            throw new Error('Número de documento debe tener entre 7 y 12 dígitos');
          }

          return {
            numero_documento: documento.toString(),
            metodo: parsed.type === 'MANUAL_INPUT' ? 'manual' : 
                   parsed.type === 'DIRECT_INPUT' ? 'directo' : 'qr',
            timestamp: parsed.timestamp,
            id: parsed.id,
            type: parsed.type
          };
        } 
        
        // Formato JSON genérico con numero_documento
        if (parsed.numero_documento || parsed.doc) {
          const documento = (parsed.numero_documento || parsed.doc).toString();
          
          if (!/^\d+$/.test(documento)) {
            throw new Error('Número de documento debe contener solo dígitos');
          }

          if (documento.length < 7 || documento.length > 12) {
            throw new Error('Número de documento debe tener entre 7 y 12 dígitos');
          }

          return {
            numero_documento: documento,
            metodo: 'json',
            timestamp: parsed.timestamp || Date.now(),
            type: parsed.type || 'GENERIC_JSON'
          };
        }

        throw new Error('Formato JSON no reconocido');
        
      } catch (jsonError) {
        // No es JSON válido, tratar como número de documento directo
        console.log('📝 Tratando como número de documento directo');
        
        const documento = data.trim();
        
        // Validar que solo contenga números
        if (!/^\d+$/.test(documento)) {
          throw new Error('El número de documento debe contener solo dígitos');
        }

        // Validar longitud
        if (documento.length < 7 || documento.length > 12) {
          throw new Error('El número de documento debe tener entre 7 y 12 dígitos');
        }

        return {
          numero_documento: documento,
          metodo: 'directo',
          timestamp: Date.now(),
          type: 'DIRECT_STRING'
        };
      }
      
    } catch (error) {
      console.error('❌ Error procesando datos de identificación:', error);
      throw new BadRequestException(
        `Datos de identificación inválidos: ${error.message}`
      );
    }
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