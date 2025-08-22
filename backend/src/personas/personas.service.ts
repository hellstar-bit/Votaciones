// 📁 backend/src/personas/personas.service.ts - VERSIÓN COMPLETA ACTUALIZADA
import { 
  Injectable, 
  NotFoundException, 
  BadRequestException, 
  ConflictException 
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere } from 'typeorm';
import { Persona } from '../users/entities/persona.entity';
import { Ficha } from '../users/entities/ficha.entity';
import { CreateAprendizDto } from './dto/create-aprendiz.dto';
import { UpdateAprendizDto } from './dto/update-aprendiz.dto';

interface GetAprendicesFilters {
  fichaId?: number;
  sedeId?: number;
  centroId?: number;
  jornada?: string;
  search?: string;
}

@Injectable()
export class PersonasService {
  constructor(
    @InjectRepository(Persona)
    private personaRepository: Repository<Persona>,
    @InjectRepository(Ficha)
    private fichaRepository: Repository<Ficha>,
  ) {}

  // 🔧 MÉTODO EXISTENTE - Mantener tal como está
  async getAprendices(filters: GetAprendicesFilters = {}) {
    const { fichaId, sedeId, centroId, jornada, search } = filters;

    // Construir condiciones de búsqueda
    const where: FindOptionsWhere<Persona> = {
      estado: 'activo'
    };

    // Filtros por ubicación
    if (fichaId) {
      where.id_ficha = fichaId;
    }
    if (sedeId) {
      where.id_sede = sedeId;
    }
    if (centroId) {
      where.id_centro = centroId;
    }
    if (jornada) {
      where.jornada = jornada as any;
    }

    let queryBuilder = this.personaRepository.createQueryBuilder('persona')
      .leftJoinAndSelect('persona.ficha', 'ficha')
      .leftJoinAndSelect('persona.sede', 'sede')
      .leftJoinAndSelect('persona.centro', 'centro')
      .where(where);

    // Filtro de búsqueda de texto
    if (search) {
      queryBuilder = queryBuilder.andWhere(
        '(persona.nombres LIKE :search OR persona.apellidos LIKE :search OR persona.numero_documento LIKE :search OR persona.email LIKE :search)',
        { search: `%${search}%` }
      );
    }

    const aprendices = await queryBuilder
      .orderBy('persona.apellidos', 'ASC')
      .addOrderBy('persona.nombres', 'ASC')
      .getMany();

    // Transformar datos para el frontend
    return aprendices.map(persona => ({
      id_persona: persona.id_persona,
      numero_documento: persona.numero_documento,
      tipo_documento: persona.tipo_documento,
      nombres: persona.nombres,
      apellidos: persona.apellidos,
      nombreCompleto: `${persona.nombres} ${persona.apellidos}`,
      email: persona.email,
      telefono: persona.telefono,
      estado: persona.estado,
      jornada: persona.jornada,
      ficha: persona.ficha ? {
        id_ficha: persona.ficha.id_ficha,
        numero_ficha: persona.ficha.numero_ficha,
        nombre_programa: persona.ficha.nombre_programa,
        jornada: persona.ficha.jornada
      } : null,
      sede: persona.sede ? {
        id_sede: persona.sede.id_sede,
        nombre_sede: persona.sede.nombre_sede
      } : null,
      centro: persona.centro ? {
        id_centro: persona.centro.id_centro,
        nombre_centro: persona.centro.nombre_centro
      } : null
    }));
  }

  // 🔧 MÉTODO EXISTENTE - Mantener tal como está
  async findByDocumento(numero_documento: string) {
    const persona = await this.personaRepository.findOne({
      where: { numero_documento, estado: 'activo' },
      relations: ['ficha', 'sede', 'centro']
    });

    if (!persona) {
      throw new NotFoundException('Persona no encontrada con ese número de documento');
    }

    return {
      id_persona: persona.id_persona,
      numero_documento: persona.numero_documento,
      tipo_documento: persona.tipo_documento,
      nombres: persona.nombres,
      apellidos: persona.apellidos,
      nombreCompleto: `${persona.nombres} ${persona.apellidos}`,
      email: persona.email,
      telefono: persona.telefono,
      jornada: persona.jornada,
      ficha: persona.ficha ? {
        id_ficha: persona.ficha.id_ficha,
        numero_ficha: persona.ficha.numero_ficha,
        nombre_programa: persona.ficha.nombre_programa,
        jornada: persona.ficha.jornada
      } : null,
      sede: persona.sede ? {
        id_sede: persona.sede.id_sede,
        nombre_sede: persona.sede.nombre_sede
      } : null,
      centro: persona.centro ? {
        id_centro: persona.centro.id_centro,
        nombre_centro: persona.centro.nombre_centro
      } : null
    };
  }

  // 🔧 MÉTODO EXISTENTE - Mantener tal como está
  async createPersonaFromCandidate(candidateData: {
    numero_documento: string;
    nombres: string;
    apellidos: string;
    email?: string;
    telefono?: string;
  }) {
    // Verificar si ya existe
    const existingPersona = await this.personaRepository.findOne({
      where: { numero_documento: candidateData.numero_documento }
    });

    if (existingPersona) {
      return existingPersona;
    }

    // Crear nueva persona
    const persona = this.personaRepository.create({
      numero_documento: candidateData.numero_documento,
      tipo_documento: 'CC', // Por defecto
      nombres: candidateData.nombres,
      apellidos: candidateData.apellidos,
      email: candidateData.email || `${candidateData.nombres.toLowerCase()}.${candidateData.apellidos.split(' ')[0].toLowerCase()}@sena.edu.co`,
      telefono: candidateData.telefono || '3000000000',
      estado: 'activo'
    });

    return await this.personaRepository.save(persona);
  }

  // 🚀 NUEVOS MÉTODOS - Agregar después de los existentes

  // Crear nuevo aprendiz
  async createAprendiz(createAprendizDto: CreateAprendizDto, userId?: number) {
    console.log('🔍 Validando datos del aprendiz...');

    // Validar que el documento no exista
    const existingPersona = await this.personaRepository.findOne({
      where: { numero_documento: createAprendizDto.numero_documento }
    });

    if (existingPersona) {
      throw new ConflictException(`Ya existe un aprendiz con el documento ${createAprendizDto.numero_documento}`);
    }

    // Validar que el email no exista
    if (createAprendizDto.email) {
      const existingEmail = await this.personaRepository.findOne({
        where: { email: createAprendizDto.email }
      });

      if (existingEmail) {
        throw new ConflictException(`Ya existe un aprendiz con el email ${createAprendizDto.email}`);
      }
    }

    // Validar ficha si se proporciona
    let ficha = null;
    if (createAprendizDto.id_ficha) {
      ficha = await this.fichaRepository.findOne({
        where: { id_ficha: createAprendizDto.id_ficha },
        relations: ['sede', 'centro']
      });

      if (!ficha) {
        throw new BadRequestException(`La ficha con ID ${createAprendizDto.id_ficha} no existe`);
      }
    }

    console.log('✅ Datos validados, creando aprendiz...');

    // Crear la persona
    const nuevaPersona = this.personaRepository.create({
      numero_documento: createAprendizDto.numero_documento,
      tipo_documento: createAprendizDto.tipo_documento,
      nombres: createAprendizDto.nombres.toUpperCase(),
      apellidos: createAprendizDto.apellidos.toUpperCase(),
      email: createAprendizDto.email.toLowerCase(),
      telefono: createAprendizDto.telefono,
      estado: 'activo',
      id_ficha: createAprendizDto.id_ficha,
      id_sede: ficha?.id_sede,
      id_centro: ficha?.id_centro,
      jornada: ficha?.jornada
    });

    const personaGuardada = await this.personaRepository.save(nuevaPersona);

    console.log('✅ Aprendiz creado exitosamente con ID:', personaGuardada.id_persona);

    // Retornar el aprendiz completo
    return this.getAprendizById(personaGuardada.id_persona);
  }

  // Actualizar aprendiz existente
  async updateAprendiz(id: number, updateAprendizDto: UpdateAprendizDto, userId?: number) {
    console.log('🔍 Buscando aprendiz para actualizar...');

    // Buscar el aprendiz
    const persona = await this.personaRepository.findOne({
      where: { id_persona: id },
      relations: ['ficha', 'sede', 'centro']
    });

    if (!persona) {
      throw new NotFoundException(`Aprendiz con ID ${id} no encontrado`);
    }

    // Validar email único si se está cambiando
    if (updateAprendizDto.email && updateAprendizDto.email !== persona.email) {
      const existingEmail = await this.personaRepository.findOne({
        where: { email: updateAprendizDto.email }
      });

      if (existingEmail && existingEmail.id_persona !== id) {
        throw new ConflictException(`Ya existe un aprendiz con el email ${updateAprendizDto.email}`);
      }
    }

    // Validar ficha si se está cambiando
    let nuevaFicha = null;
    if (updateAprendizDto.id_ficha && updateAprendizDto.id_ficha !== persona.id_ficha) {
      nuevaFicha = await this.fichaRepository.findOne({
        where: { id_ficha: updateAprendizDto.id_ficha },
        relations: ['sede', 'centro']
      });

      if (!nuevaFicha) {
        throw new BadRequestException(`La ficha con ID ${updateAprendizDto.id_ficha} no existe`);
      }
    }

    console.log('✅ Datos validados, actualizando aprendiz...');

    // Actualizar campos
    if (updateAprendizDto.nombres) {
      persona.nombres = updateAprendizDto.nombres.toUpperCase();
    }
    if (updateAprendizDto.apellidos) {
      persona.apellidos = updateAprendizDto.apellidos.toUpperCase();
    }
    if (updateAprendizDto.email) {
      persona.email = updateAprendizDto.email.toLowerCase();
    }
    if (updateAprendizDto.telefono) {
      persona.telefono = updateAprendizDto.telefono;
    }
    if (updateAprendizDto.tipo_documento) {
      persona.tipo_documento = updateAprendizDto.tipo_documento;
    }

    // Actualizar ficha y ubicaciones relacionadas
    if (nuevaFicha) {
      persona.id_ficha = nuevaFicha.id_ficha;
      persona.id_sede = nuevaFicha.id_sede;
      persona.id_centro = nuevaFicha.id_centro;
      persona.jornada = nuevaFicha.jornada;
    }

    await this.personaRepository.save(persona);

    console.log('✅ Aprendiz actualizado exitosamente');

    // Retornar el aprendiz actualizado
    return this.getAprendizById(id);
  }

  // Eliminar aprendiz (soft delete)
  async deleteAprendiz(id: number, userId?: number) {
    console.log('🔍 Buscando aprendiz para eliminar...');

    const persona = await this.personaRepository.findOne({
      where: { id_persona: id }
    });

    if (!persona) {
      throw new NotFoundException(`Aprendiz con ID ${id} no encontrado`);
    }

    // Soft delete - cambiar estado a inactivo
    persona.estado = 'inactivo';

    await this.personaRepository.save(persona);

    console.log('✅ Aprendiz eliminado (soft delete) exitosamente');

    return { message: 'Aprendiz eliminado exitosamente' };
  }

  // Validar documento único
  async validateDocumento(numeroDocumento: string, excludeId?: number) {
    console.log('🔍 Validando documento:', numeroDocumento);

    const query = this.personaRepository.createQueryBuilder('persona')
      .where('persona.numero_documento = :numeroDocumento', { numeroDocumento });

    if (excludeId) {
      query.andWhere('persona.id_persona != :excludeId', { excludeId });
    }

    const existingPersona = await query.getOne();

    const isValid = !existingPersona;

    return {
      isValid,
      message: isValid ? 'Documento disponible' : 'El documento ya está registrado'
    };
  }

  // Obtener estadísticas de aprendices
  async getAprendicesStats() {
    console.log('📊 Calculando estadísticas de aprendices...');

    const [
      total,
      activos,
      inactivos,
      sinFicha,
      porJornada,
      porSede,
      porCentro
    ] = await Promise.all([
      // Total de aprendices
      this.personaRepository.count(),
      
      // Activos
      this.personaRepository.count({ where: { estado: 'activo' } }),
      
      // Inactivos
      this.personaRepository.count({ where: { estado: 'inactivo' } }),
      
      // Sin ficha
      this.personaRepository.count({ 
        where: { estado: 'activo', id_ficha: null } 
      }),
      
      // Por jornada
      this.personaRepository.createQueryBuilder('persona')
        .select('persona.jornada', 'jornada')
        .addSelect('COUNT(*)', 'count')
        .where('persona.estado = :estado', { estado: 'activo' })
        .andWhere('persona.jornada IS NOT NULL')
        .groupBy('persona.jornada')
        .getRawMany(),
      
      // Por sede
      this.personaRepository.createQueryBuilder('persona')
        .leftJoin('persona.sede', 'sede')
        .select('sede.nombre_sede', 'sede')
        .addSelect('COUNT(*)', 'count')
        .where('persona.estado = :estado', { estado: 'activo' })
        .andWhere('sede.nombre_sede IS NOT NULL')
        .groupBy('sede.nombre_sede')
        .getRawMany(),
      
      // Por centro
      this.personaRepository.createQueryBuilder('persona')
        .leftJoin('persona.centro', 'centro')
        .select('centro.nombre_centro', 'centro')
        .addSelect('COUNT(*)', 'count')
        .where('persona.estado = :estado', { estado: 'activo' })
        .andWhere('centro.nombre_centro IS NOT NULL')
        .groupBy('centro.nombre_centro')
        .getRawMany()
    ]);

    // Transformar resultados
    const jornadaStats = porJornada.reduce((acc, item) => {
      acc[item.jornada] = parseInt(item.count);
      return acc;
    }, {});

    const sedeStats = porSede.reduce((acc, item) => {
      acc[item.sede] = parseInt(item.count);
      return acc;
    }, {});

    const centroStats = porCentro.reduce((acc, item) => {
      acc[item.centro] = parseInt(item.count);
      return acc;
    }, {});

    return {
      total,
      activos,
      inactivos,
      sinFicha,
      porJornada: jornadaStats,
      porSede: sedeStats,
      porCentro: centroStats
    };
  }

  // Exportar aprendices a CSV
  async exportAprendices(filters: any = {}) {
    console.log('📥 Preparando exportación de aprendices...');

    // Aplicar los mismos filtros que getAprendices
    const aprendices = await this.getAprendices({
      fichaId: filters.ficha ? parseInt(filters.ficha) : undefined,
      sedeId: filters.sede ? parseInt(filters.sede) : undefined,
      centroId: filters.centro ? parseInt(filters.centro) : undefined,
      jornada: filters.jornada,
      search: filters.search
    });

    // Crear contenido CSV
    const headers = [
      'Tipo Documento',
      'Número Documento', 
      'Nombres',
      'Apellidos',
      'Email',
      'Teléfono',
      'Estado',
      'Ficha',
      'Programa',
      'Jornada',
      'Sede',
      'Centro'
    ];

    const rows = aprendices.map(aprendiz => [
      aprendiz.tipo_documento,
      aprendiz.numero_documento,
      aprendiz.nombres,
      aprendiz.apellidos,
      aprendiz.email || '',
      aprendiz.telefono || '',
      aprendiz.estado,
      aprendiz.ficha?.numero_ficha || '',
      aprendiz.ficha?.nombre_programa || '',
      aprendiz.jornada || '',
      aprendiz.sede?.nombre_sede || '',
      aprendiz.centro?.nombre_centro || ''
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    console.log('✅ CSV generado con', aprendices.length, 'registros');

    return {
      data: csvContent,
      filename: `aprendices_${new Date().toISOString().split('T')[0]}.csv`,
      contentType: 'text/csv'
    };
  }

  // Cambiar estado de aprendiz
  async changeAprendizStatus(id: number, estado: string, motivo?: string, userId?: number) {
    const persona = await this.personaRepository.findOne({
      where: { id_persona: id }
    });

    if (!persona) {
      throw new NotFoundException(`Aprendiz con ID ${id} no encontrado`);
    }

    persona.estado = estado;

    await this.personaRepository.save(persona);

    return this.getAprendizById(id);
  }

  // Asignar ficha a aprendiz
  async assignFicha(id: number, idFicha: number, userId?: number) {
    const persona = await this.personaRepository.findOne({
      where: { id_persona: id }
    });

    if (!persona) {
      throw new NotFoundException(`Aprendiz con ID ${id} no encontrado`);
    }

    const ficha = await this.fichaRepository.findOne({
      where: { id_ficha: idFicha },
      relations: ['sede', 'centro']
    });

    if (!ficha) {
      throw new NotFoundException(`Ficha con ID ${idFicha} no encontrada`);
    }

    persona.id_ficha = ficha.id_ficha;
    persona.id_sede = ficha.id_sede;
    persona.id_centro = ficha.id_centro;
    persona.jornada = ficha.jornada;

    await this.personaRepository.save(persona);

    return this.getAprendizById(id);
  }

  // Obtener historial de cambios (placeholder)
  async getAprendizHistory(id: number) {
    // Por ahora retornar array vacío
    // En el futuro se puede implementar una tabla de auditoría
    return [];
  }

  // Obtener aprendiz por ID
  async getAprendizById(id: number) {
    const persona = await this.personaRepository.findOne({
      where: { id_persona: id },
      relations: ['ficha', 'sede', 'centro']
    });

    if (!persona) {
      throw new NotFoundException(`Aprendiz con ID ${id} no encontrado`);
    }

    return {
      id_persona: persona.id_persona,
      numero_documento: persona.numero_documento,
      tipo_documento: persona.tipo_documento,
      nombres: persona.nombres,
      apellidos: persona.apellidos,
      nombreCompleto: `${persona.nombres} ${persona.apellidos}`,
      email: persona.email,
      telefono: persona.telefono,
      estado: persona.estado,
      jornada: persona.jornada,
      ficha: persona.ficha ? {
        id_ficha: persona.ficha.id_ficha,
        numero_ficha: persona.ficha.numero_ficha,
        nombre_programa: persona.ficha.nombre_programa,
        jornada: persona.ficha.jornada
      } : null,
      sede: persona.sede ? {
        id_sede: persona.sede.id_sede,
        nombre_sede: persona.sede.nombre_sede
      } : null,
      centro: persona.centro ? {
        id_centro: persona.centro.id_centro,
        nombre_centro: persona.centro.nombre_centro
      } : null
    };
  }
}