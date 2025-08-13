// 📁 src/elections/elections.service.ts
// ====================================================================
import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { Eleccion } from './entities/eleccion.entity';
import { TipoEleccion } from './entities/tipo-eleccion.entity';
import { VotanteHabilitado } from '../votes/entities/votante-habilitado.entity';
import { Persona } from '../users/entities/persona.entity';
import { Voto } from '../votes/entities/voto.entity';
import { Candidato } from '../candidates/entities/candidato.entity';
import { CreateElectionDto } from './dto/create-election.dto';
import * as fs from 'fs';
import * as path from 'path';

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
    @InjectRepository(Voto)
    private votoRepository: Repository<Voto>,
    @InjectRepository(Candidato)
    private candidatoRepository: Repository<Candidato>,
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
        // Es el mismo día, verificar que la hora no haya pasado mucho (permitir crear hasta 1 hora antes)
        const horasHastaInicio = (fechaInicio.getTime() - ahora.getTime()) / (1000 * 60 * 60);
        if (horasHastaInicio < -1) {
          throw new BadRequestException('No se puede crear una elección con más de 1 hora de retraso en el mismo día');
        }
      } else {
        // Es un día anterior, no permitir
        throw new BadRequestException('La fecha de inicio no puede ser anterior a hoy');
      }
    }

    // Crear la elección
    const nuevaEleccion = this.eleccionRepository.create({
      ...electionData,
      id_tipo_eleccion: tipoEleccionEntity.id_tipo_eleccion,
      created_by: userId,
      estado: 'configuracion',
      total_votantes_habilitados: 0,
      total_votos_emitidos: 0,
    });

    const eleccionGuardada = await this.eleccionRepository.save(nuevaEleccion);

    // Generar votantes habilitados
    await this.generateEligibleVoters(eleccionGuardada);

    return this.findOne(eleccionGuardada.id_eleccion);
  }

  async findAll(userId: number, userRole: string) {
    const whereClause: FindOptionsWhere<Eleccion> = {};

    // Si no es admin, solo ver sus propias elecciones
    if (userRole !== 'ADMIN') {
      whereClause.created_by = userId;
    }

    return this.eleccionRepository.find({
      where: whereClause,
      relations: ['tipoEleccion', 'centro', 'sede', 'ficha'],
      order: { created_at: 'DESC' },
    });
  }

  

  async findOne(id: number) {
    const eleccion = await this.eleccionRepository.findOne({
      where: { id_eleccion: id },
      relations: ['tipoEleccion', 'centro', 'sede', 'ficha', 'candidatos', 'candidatos.persona'],
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

  async cancel(id: number, userId: number) {
    const eleccion = await this.findOne(id);

    if (eleccion.created_by !== userId) {
      throw new ForbiddenException('No tiene permisos para cancelar esta elección');
    }

    if (!['configuracion', 'activa'].includes(eleccion.estado)) {
      throw new BadRequestException('Solo se pueden cancelar elecciones en configuración o activas');
    }

    await this.eleccionRepository.update(id, { estado: 'cancelada' });

    return { message: 'Elección cancelada exitosamente' };
  }

  async canDeleteElection(id: number, userId: number) {
  const eleccion = await this.findOne(id);

  if (eleccion.created_by !== userId) {
    throw new ForbiddenException('No tiene permisos para eliminar esta elección');
  }

  // ✅ NUEVO: Permitir eliminar elecciones en CUALQUIER estado
  // Eliminamos la restricción de estado
  
  // Contar datos que se eliminarán
  const [totalVotos, totalCandidatos, totalVotantes] = await Promise.all([
    this.votoRepository.count({ where: { id_eleccion: id } }),
    this.candidatoRepository.count({ where: { id_eleccion: id } }),
    this.votanteHabilitadoRepository.count({ where: { id_eleccion: id } })
  ]);

  return {
    canDelete: true,
    details: {
      estado_actual: eleccion.estado,
      votos_a_eliminar: totalVotos,
      candidatos_a_eliminar: totalCandidatos,
      votantes_a_eliminar: totalVotantes
    }
  };
}

  async delete(id: number, userId: number) {
  const canDeleteResult = await this.canDeleteElection(id, userId);
  
  if (!canDeleteResult.canDelete && canDeleteResult.hasOwnProperty('reason')) {
    throw new BadRequestException((canDeleteResult as any).reason);
  }

  // ⭐ NUEVO: Obtener candidatos con sus fotos antes de borrarlos
  const candidates = await this.candidatoRepository.find({
    where: { id_eleccion: id },
    relations: ['persona']
  });

  // ⭐ NUEVO: Borrar archivos físicos de fotos
  for (const candidate of candidates) {
    if (candidate.persona?.foto_url) {
      await this.deletePhotoFile(candidate.persona.foto_url);
    }
  }

  // Eliminar en orden: votos -> candidatos -> votantes habilitados -> elección
  await this.votoRepository.delete({ id_eleccion: id });
  await this.candidatoRepository.delete({ id_eleccion: id });
  await this.votanteHabilitadoRepository.delete({ id_eleccion: id });
  await this.eleccionRepository.delete(id);

  return {
    message: 'Elección eliminada exitosamente',
    details: canDeleteResult.details
  };
}

// ⭐ NUEVO: Agregar este método helper al final de la clase
private async deletePhotoFile(fotoUrl: string): Promise<void> {
  try {
    if (fotoUrl && !fotoUrl.startsWith('http')) {
      const filePath = path.join(process.cwd(), fotoUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log('📸 Foto borrada:', filePath);
      }
    }
  } catch (error) {
    console.error('❌ Error borrando foto:', error);
  }
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
    
    // Obtener votos en blanco
    const votosBlanco = await this.votoRepository.count({
      where: { id_eleccion: id, id_candidato: null },
    });
    
    const candidatosConVotos = eleccion.candidatos.map(candidato => ({
      id: candidato.id_candidato,
      nombre: candidato.persona.nombreCompleto,
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
}