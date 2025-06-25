// 📁 src/candidates/candidates.service.ts
// ====================================================================
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Candidato } from './entities/candidato.entity';
import { Persona } from '../users/entities/persona.entity';
import { Eleccion } from '../elections/entities/eleccion.entity';
import { CreateCandidateDto } from './dto/create-candidate.dto';

@Injectable()
export class CandidatesService {
  constructor(
    @InjectRepository(Candidato)
    private candidatoRepository: Repository<Candidato>,
    @InjectRepository(Persona)
    private personaRepository: Repository<Persona>,
    @InjectRepository(Eleccion)
    private eleccionRepository: Repository<Eleccion>,
  ) {}

  async create(createCandidateDto: CreateCandidateDto) {
    const { numero_documento, id_eleccion, numero_lista, ...candidateData } = createCandidateDto;

    // Verificar que la elección existe
    const eleccion = await this.eleccionRepository.findOne({
      where: { id_eleccion, estado: 'configuracion' },
    });

    if (!eleccion) {
      throw new NotFoundException('Elección no encontrada o no está en configuración');
    }

    // Buscar la persona
    const persona = await this.personaRepository.findOne({
      where: { numero_documento, estado: 'activo' },
    });

    if (!persona) {
      throw new NotFoundException('Persona no encontrada');
    }

    // Verificar que no esté ya registrado como candidato en esta elección
    const existingCandidate = await this.candidatoRepository.findOne({
      where: { id_eleccion, id_persona: persona.id_persona },
    });

    if (existingCandidate) {
      throw new BadRequestException('La persona ya está registrada como candidato en esta elección');
    }

    // Verificar que el número de lista no esté ocupado
    const existingList = await this.candidatoRepository.findOne({
      where: { id_eleccion, numero_lista },
    });

    if (existingList) {
      throw new BadRequestException('El número de lista ya está ocupado');
    }

    // Crear candidato
    const candidato = this.candidatoRepository.create({
      id_eleccion,
      id_persona: persona.id_persona,
      numero_lista,
      ...candidateData,
    });

    return this.candidatoRepository.save(candidato);
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
    });

    if (!candidato) {
      throw new NotFoundException('Candidato no encontrado');
    }

    await this.candidatoRepository.update(id, {
      validado: true,
      validado_por: userId,
      validado_at: new Date(),
      estado: 'validado',
    });

    return { message: 'Candidato validado exitosamente' };
  }
}