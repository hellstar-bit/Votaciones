// 📁 src/candidates/candidates.service.ts - ACTUALIZADO
// ====================================================================
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Candidato } from './entities/candidato.entity';
import { Persona } from '../users/entities/persona.entity';
import { Eleccion } from '../elections/entities/eleccion.entity';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { PersonasService } from '../personas/personas.service';

@Injectable()
export class CandidatesService {
  constructor(
    @InjectRepository(Candidato)
    private candidatoRepository: Repository<Candidato>,
    @InjectRepository(Persona)
    private personaRepository: Repository<Persona>,
    @InjectRepository(Eleccion)
    private eleccionRepository: Repository<Eleccion>,
    private personasService: PersonasService, // Inyectar PersonasService
  ) {}

  async create(createCandidateDto: CreateCandidateDto) {
    const { id_eleccion, numero_documento, numero_lista, nombres, apellidos, email, telefono } = createCandidateDto;

    // Verificar que la elección existe y está en configuración
    const eleccion = await this.eleccionRepository.findOne({
      where: { id_eleccion },
    });

    if (!eleccion) {
      throw new BadRequestException('Elección no encontrada');
    }

    if (eleccion.estado !== 'configuracion') {
      throw new BadRequestException('No se pueden agregar candidatos a una elección que no está en configuración');
    }

    // Verificar que el número de lista no esté ocupado
    const existingList = await this.candidatoRepository.findOne({
      where: { id_eleccion, numero_lista },
    });

    if (existingList) {
      throw new BadRequestException('El número de lista ya está ocupado');
    }

    // Buscar o crear la persona
    let persona = await this.personaRepository.findOne({
      where: { numero_documento, estado: 'activo' },
    });

    if (!persona) {
      // Si no existe la persona y se proporcionaron datos, crearla
      if (nombres && apellidos) {
        persona = await this.personasService.createPersonaFromCandidate({
          numero_documento,
          nombres,
          apellidos,
          email,
          telefono
        });
        console.log(`✅ Persona creada para candidato: ${nombres} ${apellidos}`);
      } else {
        throw new BadRequestException('Persona no encontrada. Debe proporcionar nombres y apellidos para crear un nuevo candidato.');
      }
    }

    // Verificar que la persona no sea ya candidato en esta elección
    const existingCandidate = await this.candidatoRepository.findOne({
      where: { id_eleccion, id_persona: persona.id_persona },
    });

    if (existingCandidate) {
      throw new BadRequestException('Esta persona ya es candidata en esta elección');
    }

    // Crear candidato
    const candidato = this.candidatoRepository.create({
      id_eleccion,
      id_persona: persona.id_persona,
      numero_lista,
      estado: 'pendiente', // Por defecto pendiente de validación
    });

    const savedCandidate = await this.candidatoRepository.save(candidato);

    // Retornar candidato con información de la persona
    return await this.candidatoRepository.findOne({
      where: { id_candidato: savedCandidate.id_candidato },
      relations: ['persona', 'eleccion'],
    });
  }

  async findByElection(electionId: number) {
    return this.candidatoRepository.find({
      where: { id_eleccion: electionId },
      relations: ['persona', 'eleccion'],
      order: { numero_lista: 'ASC' },
    });
  }

  async validate(id: number, userId: number) {
    const candidato = await this.candidatoRepository.findOne({
      where: { id_candidato: id },
      relations: ['eleccion']
    });

    if (!candidato) {
      throw new NotFoundException('Candidato no encontrado');
    }

    // Verificar que la elección esté en configuración
    if (candidato.eleccion.estado !== 'configuracion') {
      throw new BadRequestException('No se pueden validar candidatos en una elección que no está en configuración');
    }

    await this.candidatoRepository.update(id, {
      estado: 'validado',
      validado: true,
      validado_por: userId,
      validado_at: new Date(),
    });

    return { message: 'Candidato validado exitosamente' };
  }

  async reject(id: number, userId: number, motivo?: string) {
    const candidato = await this.candidatoRepository.findOne({
      where: { id_candidato: id },
      relations: ['eleccion']
    });

    if (!candidato) {
      throw new NotFoundException('Candidato no encontrado');
    }

    // Verificar que la elección esté en configuración
    if (candidato.eleccion.estado !== 'configuracion') {
      throw new BadRequestException('No se pueden rechazar candidatos en una elección que no está en configuración');
    }

    await this.candidatoRepository.update(id, {
      estado: 'rechazado',
      validado: false,
      validado_por: userId,
      validado_at: new Date(),
      motivo_rechazo: motivo,
    });

    return { message: 'Candidato rechazado exitosamente' };
  }

  async remove(id: number) {
    const candidato = await this.candidatoRepository.findOne({
      where: { id_candidato: id },
      relations: ['eleccion']
    });

    if (!candidato) {
      throw new NotFoundException('Candidato no encontrado');
    }

    // Verificar que la elección esté en configuración
    if (candidato.eleccion.estado !== 'configuracion') {
      throw new BadRequestException('No se pueden eliminar candidatos de una elección que no está en configuración');
    }

    await this.candidatoRepository.remove(candidato);

    return { message: 'Candidato eliminado exitosamente' };
  }

  async findOne(id: number) {
    const candidato = await this.candidatoRepository.findOne({
      where: { id_candidato: id },
      relations: ['persona', 'eleccion'],
    });

    if (!candidato) {
      throw new NotFoundException('Candidato no encontrado');
    }

    return candidato;
  }
}