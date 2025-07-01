// 📁 src/personas/personas.service.ts
// ====================================================================
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere } from 'typeorm';
import { Persona } from '../users/entities/persona.entity';

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
  ) {}

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
}