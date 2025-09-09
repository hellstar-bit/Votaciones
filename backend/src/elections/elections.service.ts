// 📁 src/elections/elections.service.ts - VERSIÓN COMPLETA CORREGIDA
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
  console.log('👥 === GENERANDO VOTANTES HABILITADOS ===');
  console.log('ID Elección:', eleccion.id_eleccion);
  console.log('Título:', eleccion.titulo);
  
  let personas: Persona[] = [];

  const tipoEleccion = await this.tipoEleccionRepository.findOne({
    where: { id_tipo_eleccion: eleccion.id_tipo_eleccion },
  });

  console.log('🎯 Tipo de elección:', tipoEleccion.nombre_tipo);
  console.log('📊 Nivel de aplicación:', tipoEleccion.nivel_aplicacion);

  // Determinar votantes según el tipo de elección
  switch (tipoEleccion.nivel_aplicacion) {
    case 'centro':
      console.log('🏢 Procesando elección a nivel CENTRO...');
      
      if (tipoEleccion.nombre_tipo === 'REPRESENTANTE_CENTRO') {
        // ✅ CORREGIDO: Para Representante de Centro, TODOS los aprendices activos pueden votar
        console.log('🌍 REPRESENTANTE_CENTRO: Habilitando TODOS los aprendices activos del sistema');
        
        personas = await this.personaRepository.find({
          where: {
            estado: 'activo',
            // 🚫 NO filtrar por centro ni jornada - todos los aprendices pueden votar
          },
          relations: ['ficha', 'sede', 'centro']
        });
        
        console.log('✅ Total de aprendices activos encontrados:', personas.length);
      } else {
        // Para otros tipos de elección de centro, aplicar filtros específicos
        console.log('🏢 Otras elecciones de centro: aplicando filtros específicos');
        
        personas = await this.personaRepository.find({
          where: {
            id_centro: eleccion.id_centro,
            jornada: eleccion.jornada,
            estado: 'activo',
          },
          relations: ['ficha', 'sede', 'centro']
        });
      }
      break;

    case 'sede':
      console.log('🏛️ Procesando elección a nivel SEDE...');
      // Todos los aprendices de la sede
      personas = await this.personaRepository.find({
        where: {
          id_sede: eleccion.id_sede,
          estado: 'activo',
        },
        relations: ['ficha', 'sede', 'centro']
      });
      break;

    case 'ficha':
      console.log('🎓 Procesando elección a nivel FICHA...');
      // Todos los aprendices de la ficha
      personas = await this.personaRepository.find({
        where: {
          id_ficha: eleccion.id_ficha,
          estado: 'activo',
        },
        relations: ['ficha', 'sede', 'centro']
      });
      break;

    default:
      console.log('⚠️ Nivel de aplicación no reconocido:', tipoEleccion.nivel_aplicacion);
  }

  console.log('📋 Total de personas encontradas para habilitar:', personas.length);

  if (personas.length === 0) {
    console.log('⚠️ No se encontraron aprendices para habilitar');
    return;
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

  console.log('✅ Votantes habilitados creados exitosamente');
  console.log(`📊 Total: ${personas.length} votantes habilitados para la elección "${eleccion.titulo}"`);
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

  // ✅ MÉTODO PRINCIPAL CORREGIDO: getElectionStats
  async getElectionStats(id: number) {
    const eleccion = await this.findOne(id);
    
    const totalVotantes = eleccion.total_votantes_habilitados;
    const totalVotos = eleccion.total_votos_emitidos;
    const porcentajeParticipacion = totalVotantes > 0 ? (totalVotos / totalVotantes) * 100 : 0;
    
    // Obtener votos en blanco
    const votosBlanco = await this.votoRepository.count({
      where: { id_eleccion: id, id_candidato: null },
    });
    
    console.log('🔍 Debug getElectionStats:', {
      eleccion_id: id,
      total_votos: totalVotos,
      votos_blanco: votosBlanco,
      candidatos_count: eleccion.candidatos.length
    });
    
    // ✅ CORREGIDO: Estructura de candidatos con votos
    const candidatosConVotos = eleccion.candidatos.map(candidato => {
      console.log(`📊 Candidato: ${candidato.persona.nombreCompleto} - Votos: ${candidato.votos_recibidos}`);
      return {
        candidato_id: candidato.id_candidato, // ✅ CAMBIAR 'id' por 'candidato_id'
        candidato_nombre: candidato.persona.nombreCompleto, // ✅ CAMBIAR 'nombre' por 'candidato_nombre'
        votos: candidato.votos_recibidos,
        porcentaje: totalVotos > 0 ? Math.round((candidato.votos_recibidos / totalVotos) * 10000) / 100 : 0,
      };
    });

    // ✅ AGREGAR VOTO EN BLANCO SI EXISTE
    const votosBlancoData = votosBlanco > 0 ? [{
      candidato_id: null,
      candidato_nombre: 'Voto en Blanco',
      votos: votosBlanco,
      porcentaje: totalVotos > 0 ? Math.round((votosBlanco / totalVotos) * 10000) / 100 : 0,
    }] : [];

    const todosLosCandidatos = [...candidatosConVotos, ...votosBlancoData].sort((a, b) => b.votos - a.votos);

    console.log('✅ Candidatos finales:', todosLosCandidatos);

    // ✅ ESTRUCTURA CORREGIDA PARA COINCIDIR CON EL FRONTEND
    return {
      id: eleccion.id_eleccion,
      titulo: eleccion.titulo,
      estado: eleccion.estado,
      fecha_inicio: eleccion.fecha_inicio,
      fecha_fin: eleccion.fecha_fin,
      tipo_eleccion: eleccion.tipoEleccion?.nombre_tipo || 'No especificado',
      estadisticas: {
        total_votos: totalVotos,
        total_votantes_habilitados: totalVotantes,
        participacion_porcentaje: Math.round(porcentajeParticipacion * 100) / 100,
        votos_por_candidato: todosLosCandidatos, // ✅ ESTRUCTURA CORRECTA
      }
    };
  }

  // ✅ NUEVO: Método para obtener elecciones en tiempo real para el dashboard
  async getRealTimeElections() {
    console.log('🔍 Obteniendo elecciones en tiempo real...');
    
    // Obtener todas las elecciones activas
    const elecciones = await this.eleccionRepository.find({
      where: { estado: 'activa' },
      relations: ['tipoEleccion', 'candidatos', 'candidatos.persona'],
      order: { fecha_inicio: 'DESC' },
    });

    console.log(`📊 Encontradas ${elecciones.length} elecciones activas`);

    // ✅ FORMATEAR CADA ELECCIÓN CON LA ESTRUCTURA CORRECTA
    const eleccionesFormateadas = await Promise.all(
      elecciones.map(async (eleccion) => {
        const totalVotantes = eleccion.total_votantes_habilitados;
        const totalVotos = eleccion.total_votos_emitidos;
        const porcentajeParticipacion = totalVotantes > 0 ? (totalVotos / totalVotantes) * 100 : 0;
        
        // Obtener votos en blanco
        const votosBlanco = await this.votoRepository.count({
          where: { id_eleccion: eleccion.id_eleccion, id_candidato: null },
        });
        
        console.log(`🗳️ Elección ${eleccion.id_eleccion}: ${totalVotos} votos, ${votosBlanco} en blanco`);
        
        // ✅ ESTRUCTURA CORREGIDA PARA CANDIDATOS
        const candidatosConVotos = eleccion.candidatos.map(candidato => ({
          candidato_id: candidato.id_candidato,
          candidato_nombre: candidato.persona.nombreCompleto,
          votos: candidato.votos_recibidos,
          porcentaje: totalVotos > 0 ? Math.round((candidato.votos_recibidos / totalVotos) * 10000) / 100 : 0,
        }));

        // ✅ AGREGAR VOTO EN BLANCO SI EXISTE
        const votosBlancoData = votosBlanco > 0 ? [{
          candidato_id: null,
          candidato_nombre: 'Voto en Blanco',
          votos: votosBlanco,
          porcentaje: totalVotos > 0 ? Math.round((votosBlanco / totalVotos) * 10000) / 100 : 0,
        }] : [];

        const todosLosCandidatos = [...candidatosConVotos, ...votosBlancoData].sort((a, b) => b.votos - a.votos);

        return {
          id: eleccion.id_eleccion,
          titulo: eleccion.titulo,
          estado: eleccion.estado,
          fecha_inicio: eleccion.fecha_inicio,
          fecha_fin: eleccion.fecha_fin,
          tipo_eleccion: eleccion.tipoEleccion?.nombre_tipo || 'No especificado',
          estadisticas: {
            total_votos: totalVotos,
            total_votantes_habilitados: totalVotantes,
            participacion_porcentaje: Math.round(porcentajeParticipacion * 100) / 100,
            votos_por_candidato: todosLosCandidatos,
          }
        };
      })
    );

    console.log('✅ Elecciones formateadas correctamente');
    return eleccionesFormateadas;
  }

  // ✅ DEBUGGING: Método para verificar datos
  async debugElectionData(id_eleccion: number) {
    console.log('🔍 DEBUG: Verificando datos de elección', id_eleccion);
    
    const eleccion = await this.eleccionRepository.findOne({
      where: { id_eleccion },
      relations: ['candidatos', 'candidatos.persona'],
    });

    if (!eleccion) {
      console.error('❌ Elección no encontrada');
      return { error: 'Elección no encontrada' };
    }

    console.log('📊 Elección:', {
      id: eleccion.id_eleccion,
      titulo: eleccion.titulo,
      total_votos_emitidos: eleccion.total_votos_emitidos,
      total_votantes_habilitados: eleccion.total_votantes_habilitados,
    });

    console.log('👥 Candidatos:');
    const candidatosInfo = [];
    for (const candidato of eleccion.candidatos) {
      const info = {
        id: candidato.id_candidato,
        nombre: candidato.persona.nombreCompleto,
        votos_reportados: candidato.votos_recibidos
      };
      console.log(`  - ${info.nombre}: ${info.votos_reportados} votos`);
      candidatosInfo.push(info);
    }

    // Verificar votos en BD
    const votosTotalesContados = await this.votoRepository.count({
      where: { id_eleccion },
    });

    const votosBlanco = await this.votoRepository.count({
      where: { id_eleccion, id_candidato: null },
    });

    console.log('🧮 Verificación:');
    console.log(`  - Votos totales contados en BD: ${votosTotalesContados}`);
    console.log(`  - Votos en blanco: ${votosBlanco}`);
    console.log(`  - Votos reportados en elección: ${eleccion.total_votos_emitidos}`);

    // Contar votos por candidato
    const votosRealesContados = [];
    for (const candidato of eleccion.candidatos) {
      const votosContados = await this.votoRepository.count({
        where: { id_eleccion, id_candidato: candidato.id_candidato },
      });
      console.log(`  - Votos para ${candidato.persona.nombreCompleto}: ${votosContados} (reportado: ${candidato.votos_recibidos})`);
      votosRealesContados.push({
        candidato: candidato.persona.nombreCompleto,
        votos_contados: votosContados,
        votos_reportados: candidato.votos_recibidos,
        diferencia: votosContados - candidato.votos_recibidos
      });
    }

    const sumaVotosCandidatos = eleccion.candidatos.reduce((sum, c) => sum + c.votos_recibidos, 0);
    console.log(`  - Suma votos candidatos: ${sumaVotosCandidatos}`);
    console.log(`  - Total con blancos: ${sumaVotosCandidatos + votosBlanco}`);

    return {
      eleccion: {
        id: eleccion.id_eleccion,
        titulo: eleccion.titulo,
        total_votos_emitidos: eleccion.total_votos_emitidos,
        total_votantes_habilitados: eleccion.total_votantes_habilitados,
      },
      candidatos: candidatosInfo,
      verificacion: {
        votos_totales_contados: votosTotalesContados,
        votos_blanco: votosBlanco,
        votos_reportados: eleccion.total_votos_emitidos,
        suma_votos_candidatos: sumaVotosCandidatos,
        total_con_blancos: sumaVotosCandidatos + votosBlanco,
      },
      votos_por_candidato: votosRealesContados,
      inconsistencias: {
        votos_totales: votosTotalesContados !== eleccion.total_votos_emitidos,
        suma_no_coincide: (sumaVotosCandidatos + votosBlanco) !== eleccion.total_votos_emitidos
      }
    };
  }

  // ✅ NUEVO: Método para sincronizar contadores (útil para corregir inconsistencias)
  async syncElectionCounters(id_eleccion: number) {
    console.log('🔄 Sincronizando contadores para elección', id_eleccion);
    
    const eleccion = await this.findOne(id_eleccion);
    
    // Contar votos reales en la BD
    const votosTotalesReales = await this.votoRepository.count({
      where: { id_eleccion },
    });

    // Actualizar contador en la elección
    await this.eleccionRepository.update(id_eleccion, {
      total_votos_emitidos: votosTotalesReales
    });

    // Actualizar contadores por candidato
    for (const candidato of eleccion.candidatos) {
      const votosReales = await this.votoRepository.count({
        where: { id_eleccion, id_candidato: candidato.id_candidato },
      });

      await this.candidatoRepository.update(candidato.id_candidato, {
        votos_recibidos: votosReales
      });

      console.log(`📊 Candidato ${candidato.persona.nombreCompleto}: ${votosReales} votos`);
    }

    console.log('✅ Contadores sincronizados');
    return { 
      message: 'Contadores sincronizados exitosamente',
      votos_totales: votosTotalesReales 
    };
  }
  async regenerateEligibleVoters(electionId: number) {
  console.log('🔄 === REGENERANDO VOTANTES HABILITADOS ===');
  console.log('ID de elección:', electionId);

  const eleccion = await this.eleccionRepository.findOne({
    where: { id_eleccion: electionId },
    relations: ['tipoEleccion', 'candidatos', 'votantesHabilitados']
  });

  if (!eleccion) {
    throw new NotFoundException(`Elección con ID ${electionId} no encontrada`);
  }

  // Verificar que la elección esté en estado 'borrador' o 'activa'
  if (!['borrador', 'activa'].includes(eleccion.estado)) {
    throw new BadRequestException('Solo se pueden regenerar votantes para elecciones en borrador o activas');
  }

  // Limpiar votantes habilitados existentes
  console.log('🧹 Limpiando votantes habilitados existentes...');
  await this.votanteHabilitadoRepository.delete({ id_eleccion: electionId });

  // Regenerar votantes habilitados
  console.log('🎯 Regenerando votantes habilitados...');
  await this.generateEligibleVoters(eleccion);

  // Obtener el nuevo conteo
  const nuevoTotal = await this.votanteHabilitadoRepository.count({
    where: { id_eleccion: electionId }
  });

  console.log('✅ Votantes habilitados regenerados exitosamente');
  console.log('📊 Nuevo total:', nuevoTotal);

  return {
    message: 'Votantes habilitados regenerados exitosamente',
    eleccion_id: electionId,
    titulo: eleccion.titulo,
    total_votantes_anterior: eleccion.total_votantes_habilitados,
    total_votantes_nuevo: nuevoTotal,
    diferencia: nuevoTotal - eleccion.total_votantes_habilitados
  };
}
}