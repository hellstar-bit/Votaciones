// 📁 backend/src/candidates/candidates.service.ts
// ====================================================================
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Candidato } from './entities/candidato.entity';
import { Persona } from '../users/entities/persona.entity';
import { Eleccion } from '../elections/entities/eleccion.entity';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { UpdateCandidateDto } from './dto/update-candidate.dto';

@Injectable()
export class CandidatesService {
  constructor(
    @InjectRepository(Candidato)
    private candidateRepository: Repository<Candidato>,
    @InjectRepository(Persona)
    private personaRepository: Repository<Persona>,
    @InjectRepository(Eleccion)
    private eleccionRepository: Repository<Eleccion>,
  ) {}

  async create(createCandidateDto: CreateCandidateDto): Promise<Candidato> {
    console.log('🆕 Creando candidato con datos:', createCandidateDto);

    // Validar número de lista único
    const existingCandidate = await this.candidateRepository.findOne({
      where: {
        id_eleccion: createCandidateDto.id_eleccion,
        numero_lista: createCandidateDto.numero_lista
      }
    });

    if (existingCandidate) {
      throw new BadRequestException(`El número de lista ${createCandidateDto.numero_lista} ya está ocupado`);
    }

    let persona: Persona;

    // Buscar si la persona ya existe por documento
    persona = await this.personaRepository.findOne({
      where: { numero_documento: createCandidateDto.numero_documento }
    });

    if (persona) {
      console.log('👤 Persona existente encontrada:', persona.id_persona);
      
      // Si se proporciona una foto nueva, actualizarla
      if (createCandidateDto.foto_url) {
        console.log('📸 Actualizando foto de persona existente:', createCandidateDto.foto_url);
        persona.foto_url = createCandidateDto.foto_url;
        persona = await this.personaRepository.save(persona);
      }
    } else {
      // Crear nueva persona
      console.log('👤 Creando nueva persona');

      if (!createCandidateDto.nombres || !createCandidateDto.apellidos) {
        throw new BadRequestException('Para candidatos nuevos, nombres y apellidos son obligatorios');
      }

      // Para candidatos manuales, la foto es requerida
      if (!createCandidateDto.foto_url) {
        throw new BadRequestException('La foto es obligatoria para candidatos nuevos');
      }

      persona = this.personaRepository.create({
        numero_documento: createCandidateDto.numero_documento,
        nombres: createCandidateDto.nombres.trim(),
        apellidos: createCandidateDto.apellidos.trim(),
        email: createCandidateDto.email?.trim() || `${createCandidateDto.nombres.toLowerCase().replace(/\s+/g, '.')}.${createCandidateDto.apellidos.toLowerCase().split(' ')[0]}@candidato.local`,
        telefono: createCandidateDto.telefono?.trim() || '3000000000',
        foto_url: createCandidateDto.foto_url,
        tipo_documento: 'CC', // Por defecto
        estado: 'activo'
      });

      persona = await this.personaRepository.save(persona);
      console.log('✅ Nueva persona creada:', {
        id: persona.id_persona,
        nombres: persona.nombres,
        apellidos: persona.apellidos,
        nombreCompleto: persona.nombreCompleto,
        foto_url: persona.foto_url
      });
    }

    // Crear candidato
    const candidate = this.candidateRepository.create({
      id_eleccion: createCandidateDto.id_eleccion,
      id_persona: persona.id_persona,
      numero_lista: createCandidateDto.numero_lista,
      estado: 'pendiente'
    });

    const savedCandidate = await this.candidateRepository.save(candidate);
    console.log('✅ Candidato creado:', savedCandidate.id_candidato);

    // Retornar candidato con relaciones cargadas
    const candidateWithRelations = await this.findById(savedCandidate.id_candidato);
    console.log('📤 Retornando candidato con relaciones:', {
      id: candidateWithRelations.id_candidato,
      numero_lista: candidateWithRelations.numero_lista,
      persona: {
        nombres: candidateWithRelations.persona.nombres,
        apellidos: candidateWithRelations.persona.apellidos,
        nombreCompleto: candidateWithRelations.persona.nombreCompleto,
        foto_url: candidateWithRelations.persona.foto_url
      }
    });

    return candidateWithRelations;
  }

  async findByElection(electionId: number): Promise<any[]> {
  const candidates = await this.candidateRepository.find({
    where: { id_eleccion: electionId },
    relations: ['persona'],
    order: { numero_lista: 'ASC' }
  });

  // ✅ TRANSFORMAR LA RESPUESTA PARA GARANTIZAR QUE INCLUYA nombreCompleto
  return candidates.map(candidate => ({
    id_candidato: candidate.id_candidato,
    numero_lista: candidate.numero_lista,
    estado: candidate.estado,
    foto_url: candidate.foto_url,
    votos_recibidos: candidate.votos_recibidos,
    created_at: candidate.created_at,
    updated_at: candidate.updated_at,
    persona: candidate.persona ? {
      id_persona: candidate.persona.id_persona,
      numero_documento: candidate.persona.numero_documento,
      nombres: candidate.persona.nombres,
      apellidos: candidate.persona.apellidos,
      email: candidate.persona.email,
      telefono: candidate.persona.telefono,
      foto_url: candidate.persona.foto_url,
      // ✅ FORZAR EL NOMBRE COMPLETO
      nombreCompleto: candidate.persona.nombres && candidate.persona.apellidos 
        ? `${candidate.persona.nombres} ${candidate.persona.apellidos}`.trim()
        : 'Sin nombre'
    } : null
  }));
}

  async findById(id: number): Promise<Candidato> {
    const candidate = await this.candidateRepository.findOne({
      where: { id_candidato: id },
      relations: ['persona', 'eleccion']
    });

    if (!candidate) {
      throw new NotFoundException('Candidato no encontrado');
    }

    return candidate;
  }

  async update(id: number, updateCandidateDto: UpdateCandidateDto): Promise<Candidato> {
    const candidate = await this.findById(id);

    // Validar que la elección permite modificaciones
    if (candidate.eleccion.estado !== 'configuracion') {
      throw new BadRequestException('No se pueden modificar candidatos de una elección que no está en configuración');
    }

    // Si se cambia el número de lista, validar que no esté ocupado
    if (updateCandidateDto.numero_lista && updateCandidateDto.numero_lista !== candidate.numero_lista) {
      const existingCandidate = await this.candidateRepository.findOne({
        where: {
          id_eleccion: candidate.id_eleccion,
          numero_lista: updateCandidateDto.numero_lista
        }
      });

      if (existingCandidate && existingCandidate.id_candidato !== id) {
        throw new BadRequestException(`El número de lista ${updateCandidateDto.numero_lista} ya está ocupado`);
      }

      candidate.numero_lista = updateCandidateDto.numero_lista;
    }

    // Actualizar datos de la persona si se proporcionan
    if (updateCandidateDto.nombres || updateCandidateDto.apellidos || updateCandidateDto.email || updateCandidateDto.telefono || updateCandidateDto.foto_url) {
      const persona = candidate.persona;

      if (updateCandidateDto.nombres) persona.nombres = updateCandidateDto.nombres;
      if (updateCandidateDto.apellidos) persona.apellidos = updateCandidateDto.apellidos;
      if (updateCandidateDto.email) persona.email = updateCandidateDto.email;
      if (updateCandidateDto.telefono) persona.telefono = updateCandidateDto.telefono;
      if (updateCandidateDto.foto_url) persona.foto_url = updateCandidateDto.foto_url;

      await this.personaRepository.save(persona);
    }

    await this.candidateRepository.save(candidate);
    return this.findById(id);
  }

  async updateStatus(id: number, estado: 'validado' | 'rechazado', motivo?: string): Promise<void> {
    const candidate = await this.findById(id);

    candidate.estado = estado;
    if (estado === 'rechazado' && motivo) {
      candidate.motivo_rechazo = motivo;
    }
    if (estado === 'validado') {
      candidate.validado_at = new Date();
      // candidate.validado_por = userId; // Agregar cuando tengas autenticación
    }

    await this.candidateRepository.save(candidate);
  }

  async remove(id: number): Promise<void> {
    const candidate = await this.findById(id);

    // Validar que la elección permite modificaciones
    if (candidate.eleccion.estado !== 'configuracion') {
      throw new BadRequestException('No se pueden eliminar candidatos de una elección que no está en configuración');
    }

    await this.candidateRepository.remove(candidate);
  }
}