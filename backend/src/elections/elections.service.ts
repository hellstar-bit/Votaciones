// 📁 src/elections/elections.service.ts
// ====================================================================
import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { Eleccion } from './entities/eleccion.entity';
import { TipoEleccion } from './entities/tipo-eleccion.entity';
import { VotanteHabilitado } from '../votes/entities/votante-habilitado.entity';
import { Persona } from '../users/entities/persona.entity';
import { CreateElectionDto } from './dto/create-election.dto';

@Injectable()
export class ElectionsService {
  constructor(
    @InjectRepository(Eleccion)
    private eleccionRepository: Repository<Eleccion>,
    @InjectRepository(TipoEleccion)
    private tipoEleccionRepository: Repository<TipoEleccion>,
    @InjectRepository(VotanteHabilitado)
    private votanteHabilitadoRepository: Repository<VotanteHabilitado>,
    @InjectRepository(Persona)
    private personaRepository: Repository<Persona>,
  ) {}

  async create(createElectionDto: CreateElectionDto, userId: number) {
    const { tipo_eleccion, ...electionData } = createElectionDto;

    // Buscar tipo de elección
    const tipoEleccionEntity = await this.tipoEleccionRepository.findOne({
      where: { nombre_tipo: tipo_eleccion, estado: 'activo' },
    });

    if (!tipoEleccionEntity) {
      throw new BadRequestException('Tipo de elección inválido');
    }

    // Validar fechas
    const fechaInicio = new Date(electionData.fecha_inicio);
    const fechaFin = new Date(electionData.fecha_fin);
    const ahora = new Date();

    if (fechaInicio >= fechaFin) {
      throw new BadRequestException('La fecha de inicio debe ser anterior a la fecha de fin');
    }

    // ✅ CAMBIO: Validación más flexible para permitir elecciones el mismo día
    // Solo validar si la fecha de inicio ya pasó completamente
    if (fechaInicio <= ahora) {
      // Verificar si es el mismo día
      const fechaInicioSolo = new Date(fechaInicio.getFullYear(), fechaInicio.getMonth(), fechaInicio.getDate());
      const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
      
      if (fechaInicioSolo.getTime() === hoy.getTime()) {
        // Es el mismo día, verificar que la hora sea futura (con margen de 5 minutos)
        const margenMinutos = 5 * 60 * 1000; // 5 minutos en millisegundos
        if (fechaInicio.getTime() <= (ahora.getTime() + margenMinutos)) {
          throw new BadRequestException('La hora de inicio debe ser al menos 5 minutos en el futuro para elecciones de hoy');
        }
      } else if (fechaInicioSolo < hoy) {
        // Es una fecha pasada
        throw new BadRequestException('La fecha de inicio no puede ser en el pasado');
      }
    }

    // ✅ CAMBIO: Validar duración mínima más flexible (30 minutos en lugar de horas)
    const duracionMinutos = (fechaFin.getTime() - fechaInicio.getTime()) / (1000 * 60);
    if (duracionMinutos < 30) {
      throw new BadRequestException('La votación debe durar al menos 30 minutos');
    }

    // ✅ CAMBIO: Validar que el horario sea razonable para votaciones (opcional)
    const horaInicio = fechaInicio.getHours();
    const horaFin = fechaFin.getHours();
    
    // Permitir votaciones desde las 6:00 AM hasta las 23:59 PM
    if (horaInicio < 6) {
      console.warn(`Elección programada muy temprano: ${horaInicio}:00. Considere un horario después de las 6:00 AM`);
    }

    // Crear elección
    const eleccion = this.eleccionRepository.create({
      ...electionData,
      id_tipo_eleccion: tipoEleccionEntity.id_tipo_eleccion,
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      created_by: userId,
    });

    const savedElection = await this.eleccionRepository.save(eleccion);

    // Generar votantes habilitados
    await this.generateEligibleVoters(savedElection);

    return savedElection;
  }

  async findAll(userId: number, userRole: string) {
    const where: FindOptionsWhere<Eleccion> = {};

    // Filtrar por permisos del usuario
    if (userRole !== 'ADMIN') {
      where.created_by = userId;
    }

    return this.eleccionRepository.find({
      where,
      relations: ['tipoEleccion', 'centro', 'sede', 'ficha', 'createdBy'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: number) {
    const eleccion = await this.eleccionRepository.findOne({
      where: { id_eleccion: id },
      relations: [
        'tipoEleccion',
        'centro',
        'sede',
        'ficha',
        'candidatos',
        'candidatos.persona',
        'votos',
      ],
    });

    if (!eleccion) {
      throw new NotFoundException('Elección no encontrada');
    }

    return eleccion;
  }

  async activate(id: number, userId: number) {
    const eleccion = await this.findOne(id);

    if (eleccion.created_by !== userId) {
      throw new ForbiddenException('No tiene permisos para activar esta elección');
    }

    if (eleccion.estado !== 'configuracion') {
      throw new BadRequestException('Solo se pueden activar elecciones en estado de configuración');
    }

    if (eleccion.candidatos.length === 0) {
      throw new BadRequestException('La elección debe tener al menos un candidato');
    }

    await this.eleccionRepository.update(id, { estado: 'activa' });

    return { message: 'Elección activada exitosamente' };
  }

  async finalize(id: number, userId: number) {
    const eleccion = await this.findOne(id);

    if (eleccion.created_by !== userId) {
      throw new ForbiddenException('No tiene permisos para finalizar esta elección');
    }

    if (eleccion.estado !== 'activa') {
      throw new BadRequestException('Solo se pueden finalizar elecciones activas');
    }

    await this.eleccionRepository.update(id, { estado: 'finalizada' });

    return { message: 'Elección finalizada exitosamente' };
  }

  private async generateEligibleVoters(eleccion: Eleccion) {
    let personas: Persona[] = [];

    const tipoEleccion = await this.tipoEleccionRepository.findOne({
      where: { id_tipo_eleccion: eleccion.id_tipo_eleccion },
    });

    // Determinar votantes según el tipo de elección
    switch (tipoEleccion.nivel_aplicacion) {
      case 'centro':
        // Todos los aprendices del centro en la jornada específica
        personas = await this.personaRepository.find({
          where: {
            id_centro: eleccion.id_centro,
            jornada: eleccion.jornada,
            estado: 'activo',
          },
        });
        break;

      case 'sede':
        // Todos los aprendices de la sede
        personas = await this.personaRepository.find({
          where: {
            id_sede: eleccion.id_sede,
            estado: 'activo',
          },
        });
        break;

      case 'ficha':
        // Todos los aprendices de la ficha
        personas = await this.personaRepository.find({
          where: {
            id_ficha: eleccion.id_ficha,
            estado: 'activo',
          },
        });
        break;
    }

    // Crear registros de votantes habilitados
    const votantesHabilitados = personas.map(persona => 
      this.votanteHabilitadoRepository.create({
        id_eleccion: eleccion.id_eleccion,
        id_persona: persona.id_persona,
      })
    );

    await this.votanteHabilitadoRepository.save(votantesHabilitados);

    // Actualizar total de votantes habilitados
    await this.eleccionRepository.update(eleccion.id_eleccion, {
      total_votantes_habilitados: personas.length,
    });
  }

  async getActiveElections() {
    const ahora = new Date();
    
    return this.eleccionRepository.find({
      where: {
        estado: 'activa',
      },
      relations: ['tipoEleccion', 'centro', 'sede', 'ficha'],
      order: { fecha_inicio: 'ASC' },
    });
  }

  async getElectionStats(id: number) {
    const eleccion = await this.findOne(id);
    
    const totalVotantes = eleccion.total_votantes_habilitados;
    const totalVotos = eleccion.total_votos_emitidos;
    const porcentajeParticipacion = totalVotantes > 0 ? (totalVotos / totalVotantes) * 100 : 0;
    
    const candidatosConVotos = eleccion.candidatos.map(candidato => ({
      id: candidato.id_candidato,
      nombre: candidato.persona.nombreCompleto,
      votos: candidato.votos_recibidos,
      porcentaje: totalVotos > 0 ? (candidato.votos_recibidos / totalVotos) * 100 : 0,
    }));

    const votosBlanco = eleccion.votos.filter(voto => voto.id_candidato === null).length;

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
  async cancel(id: number, userId: number) {
  const eleccion = await this.findOne(id);

  if (eleccion.created_by !== userId) {
    throw new ForbiddenException('No tiene permisos para cancelar esta elección');
  }

  if (eleccion.estado === 'finalizada' || eleccion.estado === 'cancelada') {
    throw new BadRequestException('No se puede cancelar una elección finalizada o ya cancelada');
  }

  await this.eleccionRepository.update(id, { estado: 'cancelada' });

  return { message: 'Elección cancelada exitosamente' };
}

  async delete(id: number, userId: number) {
    const eleccion = await this.findOne(id);

    if (eleccion.created_by !== userId) {
      throw new ForbiddenException('No tiene permisos para eliminar esta elección');
    }

    // ✅ CAMBIO PRINCIPAL: Solo se pueden eliminar elecciones canceladas
    if (eleccion.estado !== 'cancelada') {
      throw new BadRequestException('Solo se pueden eliminar elecciones que han sido canceladas previamente');
    }

    try {
      // ✅ MEJORADO: Eliminar en orden para evitar problemas de foreign keys
      
      // 1. Eliminar votos primero (si los hay)
      if (eleccion.votos && eleccion.votos.length > 0) {
        await this.votoRepository.delete({ id_eleccion: id });
        console.log(`✅ Eliminados ${eleccion.votos.length} votos de la elección ${id}`);
      }

      // 2. Eliminar votantes habilitados
      const votantesHabilitados = await this.votanteHabilitadoRepository.find({ 
        where: { id_eleccion: id } 
      });
      if (votantesHabilitados.length > 0) {
        await this.votanteHabilitadoRepository.delete({ id_eleccion: id });
        console.log(`✅ Eliminados ${votantesHabilitados.length} votantes habilitados`);
      }

      // 3. Eliminar candidatos
      if (eleccion.candidatos && eleccion.candidatos.length > 0) {
        await this.candidatoRepository.delete({ id_eleccion: id });
        console.log(`✅ Eliminados ${eleccion.candidatos.length} candidatos`);
      }
      
      // 4. Finalmente eliminar la elección
      await this.eleccionRepository.delete(id);
      console.log(`✅ Elección ${id} eliminada exitosamente`);

      return { 
        message: 'Elección eliminada exitosamente',
        details: {
          votos_eliminados: eleccion.votos?.length || 0,
          candidatos_eliminados: eleccion.candidatos?.length || 0,
          votantes_eliminados: votantesHabilitados.length
        }
      };

    } catch (error) {
      console.error('Error eliminando elección:', error);
      throw new BadRequestException('Error eliminando la elección. Verifique las dependencias del sistema.');
    }
  }

  async canDeleteElection(id: number, userId: number): Promise<{
    canDelete: boolean;
    reason?: string;
    details?: any;
  }> {
    try {
      const eleccion = await this.findOne(id);

      if (eleccion.created_by !== userId) {
        return {
          canDelete: false,
          reason: 'No tiene permisos para eliminar esta elección'
        };
      }

      if (eleccion.estado !== 'cancelada') {
        return {
          canDelete: false,
          reason: 'Solo se pueden eliminar elecciones canceladas',
          details: { 
            estado_actual: eleccion.estado,
            estado_requerido: 'cancelada'
          }
        };
      }

      // Obtener información de los datos que serían eliminados
      const votantesHabilitados = await this.votanteHabilitadoRepository.count({ 
        where: { id_eleccion: id } 
      });

      return {
        canDelete: true,
        details: {
          votos_a_eliminar: eleccion.total_votos_emitidos,
          candidatos_a_eliminar: eleccion.candidatos?.length || 0,
          votantes_a_eliminar: votantesHabilitados
        }
      };

    } catch (error) {
      return {
        canDelete: false,
        reason: 'Error verificando si se puede eliminar la elección'
      };
    }
  }
}
