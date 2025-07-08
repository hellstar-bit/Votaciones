// src/candidates/candidates.service.ts
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Candidate } from '../entities/candidate.entity'
import { Persona } from '../entities/persona.entity'
import { Election } from '../entities/election.entity'
import { CreateCandidateDto } from './dto/create-candidate.dto'
import { UpdateCandidateDto } from './dto/update-candidate.dto'

@Injectable()
export class CandidatesService {
  constructor(
    @InjectRepository(Candidate)
    private readonly candidateRepository: Repository<Candidate>,
    
    @InjectRepository(Persona)
    private readonly personaRepository: Repository<Persona>,
    
    @InjectRepository(Election)
    private readonly electionRepository: Repository<Election>
  ) {
    console.log('✅ CandidatesService inicializado correctamente')
  }

  async create(createCandidateDto: CreateCandidateDto): Promise<Candidate> {
    console.log('🔄 Iniciando creación de candidato:', createCandidateDto)

    // Validar que la elección existe y está en configuración
    const election = await this.electionRepository.findOne({
      where: { id_eleccion: createCandidateDto.id_eleccion }
    })

    if (!election) {
      throw new BadRequestException('La elección no existe')
    }

    if (election.estado !== 'configuracion') {
      throw new BadRequestException('No se pueden agregar candidatos a una elección que no está en configuración')
    }

    // Validar que el número de lista no esté ocupado
    const existingCandidate = await this.candidateRepository.findOne({
      where: {
        id_eleccion: createCandidateDto.id_eleccion,
        numero_lista: createCandidateDto.numero_lista
      }
    })

    if (existingCandidate) {
      throw new BadRequestException(`El número de lista ${createCandidateDto.numero_lista} ya está ocupado`)
    }

    let persona: Persona

    // Buscar si la persona ya existe por documento
    persona = await this.personaRepository.findOne({
      where: { numero_documento: createCandidateDto.numero_documento }
    })

    if (persona) {
      console.log('👤 Persona existente encontrada:', persona.id_persona)
      
      // Si es candidato manual con foto, actualizar la foto
      if (createCandidateDto.foto_url) {
        persona.foto_url = createCandidateDto.foto_url
        await this.personaRepository.save(persona)
        console.log('📸 Foto actualizada para persona existente')
      }
    } else {
      // Crear nueva persona
      console.log('👤 Creando nueva persona')

      if (!createCandidateDto.nombres || !createCandidateDto.apellidos) {
        throw new BadRequestException('Para candidatos nuevos, nombres y apellidos son obligatorios')
      }

      // Para candidatos manuales, validar que tengan foto
      if (!createCandidateDto.foto_url) {
        throw new BadRequestException('La foto es obligatoria para candidatos nuevos')
      }

      persona = this.personaRepository.create({
        numero_documento: createCandidateDto.numero_documento,
        nombres: createCandidateDto.nombres,
        apellidos: createCandidateDto.apellidos,
        email: createCandidateDto.email,
        telefono: createCandidateDto.telefono,
        foto_url: createCandidateDto.foto_url,
        tipo_documento: 'CC' // Por defecto
      })

      // Generar nombre completo automáticamente (computed property)
      persona = await this.personaRepository.save(persona)
      console.log('✅ Nueva persona creada:', persona.id_persona)
    }

    // Crear candidato
    const candidate = this.candidateRepository.create({
      id_eleccion: createCandidateDto.id_eleccion,
      id_persona: persona.id_persona,
      numero_lista: createCandidateDto.numero_lista,
      estado: 'pendiente'
    })

    const savedCandidate = await this.candidateRepository.save(candidate)
    console.log('✅ Candidato creado:', savedCandidate.id_candidato)

    // Retornar candidato con relaciones
    return this.findById(savedCandidate.id_candidato)
  }

  async findByElection(electionId: number): Promise<Candidate[]> {
    return this.candidateRepository.find({
      where: { id_eleccion: electionId },
      relations: ['persona'],
      order: { numero_lista: 'ASC' }
    })
  }

  async findById(id: number): Promise<Candidate> {
    const candidate = await this.candidateRepository.findOne({
      where: { id_candidato: id },
      relations: ['persona', 'eleccion']
    })

    if (!candidate) {
      throw new NotFoundException('Candidato no encontrado')
    }

    return candidate
  }

  async update(id: number, updateCandidateDto: UpdateCandidateDto): Promise<Candidate> {
    const candidate = await this.findById(id)

    // Validar que la elección permite modificaciones
    if (candidate.eleccion.estado !== 'configuracion') {
      throw new BadRequestException('No se pueden modificar candidatos de una elección que no está en configuración')
    }

    // Si se cambia el número de lista, validar que no esté ocupado
    if (updateCandidateDto.numero_lista && updateCandidateDto.numero_lista !== candidate.numero_lista) {
      const existingCandidate = await this.candidateRepository.findOne({
        where: {
          id_eleccion: candidate.id_eleccion,
          numero_lista: updateCandidateDto.numero_lista
        }
      })

      if (existingCandidate && existingCandidate.id_candidato !== id) {
        throw new BadRequestException(`El número de lista ${updateCandidateDto.numero_lista} ya está ocupado`)
      }

      candidate.numero_lista = updateCandidateDto.numero_lista
    }

    // Actualizar datos de la persona si se proporcionan
    if (updateCandidateDto.nombres || updateCandidateDto.apellidos || updateCandidateDto.email || updateCandidateDto.telefono || updateCandidateDto.foto_url) {
      const persona = candidate.persona

      if (updateCandidateDto.nombres) persona.nombres = updateCandidateDto.nombres
      if (updateCandidateDto.apellidos) persona.apellidos = updateCandidateDto.apellidos
      if (updateCandidateDto.email) persona.email = updateCandidateDto.email
      if (updateCandidateDto.telefono) persona.telefono = updateCandidateDto.telefono
      if (updateCandidateDto.foto_url) persona.foto_url = updateCandidateDto.foto_url

      await this.personaRepository.save(persona)
    }

    await this.candidateRepository.save(candidate)
    return this.findById(id)
  }

  async updateStatus(id: number, estado: 'validado' | 'rechazado', motivo?: string): Promise<void> {
    const candidate = await this.findById(id)

    candidate.estado = estado
    if (estado === 'rechazado' && motivo) {
      candidate.motivo_rechazo = motivo
    }
    if (estado === 'validado') {
      candidate.validado_at = new Date()
      // candidate.validado_por = userId; // Agregar cuando tengas autenticación
    }

    await this.candidateRepository.save(candidate)
  }

  async remove(id: number): Promise<void> {
    const candidate = await this.findById(id)

    // Validar que la elección permite modificaciones
    if (candidate.eleccion.estado !== 'configuracion') {
      throw new BadRequestException('No se pueden eliminar candidatos de una elección que no está en configuración')
    }

    await this.candidateRepository.remove(candidate)
  }
}