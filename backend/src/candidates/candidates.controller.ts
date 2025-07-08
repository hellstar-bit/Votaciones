// src/candidates/candidates.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  NotFoundException
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { CandidatesService } from './candidates.service'
import { CreateCandidateDto } from './dto/create-candidate.dto'
import { UpdateCandidateDto } from './dto/update-candidate.dto'
import { candidatePhotoStorage, imageFileFilter, fileUploadLimits } from '../common/config/multer.config'
import { FileValidator } from '../common/validators/file.validator'
import * as path from 'path'

@Controller('candidates')
export class CandidatesController {
  constructor(private readonly candidatesService: CandidatesService) {}

  // Crear candidato con foto opcional
  @Post()
  @UseInterceptors(FileInterceptor('foto', {
    storage: candidatePhotoStorage,
    fileFilter: imageFileFilter,
    limits: fileUploadLimits
  }))
  async create(
    @Body() createCandidateDto: CreateCandidateDto,
    @UploadedFile() foto?: Express.Multer.File
  ) {
    try {
      console.log('📤 Recibiendo datos:', createCandidateDto)
      console.log('📸 Archivo recibido:', foto ? foto.filename : 'ninguno')

      // Si hay foto, validarla y agregar URL
      if (foto) {
        FileValidator.validateImageFile(foto)
        createCandidateDto.foto_url = `/uploads/candidates/${foto.filename}`
        console.log('✅ Foto procesada:', createCandidateDto.foto_url)
      }

      const candidate = await this.candidatesService.create(createCandidateDto)
      
      console.log('✅ Candidato creado exitosamente:', candidate.id_candidato)
      return {
        message: 'Candidato creado exitosamente',
        candidate
      }

    } catch (error) {
      console.error('❌ Error creando candidato:', error)

      // Si hay error y se subió archivo, eliminarlo
      if (foto && foto.path) {
        await FileValidator.deleteFile(foto.path)
      }

      throw error
    }
  }

  // Obtener candidatos por elección
  @Get('election/:electionId')
  async getCandidatesByElection(@Param('electionId', ParseIntPipe) electionId: number) {
    return this.candidatesService.findByElection(electionId)
  }

  // Obtener candidato por ID
  @Get(':id')
  async getCandidateById(@Param('id', ParseIntPipe) id: number) {
    const candidate = await this.candidatesService.findById(id)
    if (!candidate) {
      throw new NotFoundException('Candidato no encontrado')
    }
    return candidate
  }

  // Actualizar candidato
  @Patch(':id')
  @UseInterceptors(FileInterceptor('foto', {
    storage: candidatePhotoStorage,
    fileFilter: imageFileFilter,
    limits: fileUploadLimits
  }))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCandidateDto: UpdateCandidateDto,
    @UploadedFile() foto?: Express.Multer.File
  ) {
    try {
      // Si hay nueva foto, procesarla
      if (foto) {
        FileValidator.validateImageFile(foto)
        
        // Obtener candidato actual para eliminar foto anterior
        const currentCandidate = await this.candidatesService.findById(id)
        if (currentCandidate?.persona?.foto_url) {
          const oldPhotoPath = path.join(process.cwd(), currentCandidate.persona.foto_url)
          await FileValidator.deleteFile(oldPhotoPath)
        }

        updateCandidateDto.foto_url = `/uploads/candidates/${foto.filename}`
      }

      const updatedCandidate = await this.candidatesService.update(id, updateCandidateDto)
      
      return {
        message: 'Candidato actualizado exitosamente',
        candidate: updatedCandidate
      }

    } catch (error) {
      console.error('❌ Error actualizando candidato:', error)

      // Si hay error y se subió archivo, eliminarlo
      if (foto && foto.path) {
        await FileValidator.deleteFile(foto.path)
      }

      throw error
    }
  }

  // Validar candidato
  @Patch(':id/validate')
  async validate(@Param('id', ParseIntPipe) id: number) {
    await this.candidatesService.updateStatus(id, 'validado')
    return { message: 'Candidato validado exitosamente' }
  }

  // Rechazar candidato
  @Patch(':id/reject')
  async reject(
    @Param('id', ParseIntPipe) id: number,
    @Body('motivo') motivo?: string
  ) {
    await this.candidatesService.updateStatus(id, 'rechazado', motivo)
    return { message: 'Candidato rechazado' }
  }

  // Eliminar candidato
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    try {
      // Obtener candidato para eliminar foto si existe
      const candidate = await this.candidatesService.findById(id)
      
      // Eliminar de la base de datos
      await this.candidatesService.remove(id)

      // Eliminar foto del sistema de archivos
      if (candidate?.persona?.foto_url) {
        const photoPath = path.join(process.cwd(), candidate.persona.foto_url)
        await FileValidator.deleteFile(photoPath)
      }

      return { message: 'Candidato eliminado exitosamente' }

    } catch (error) {
      console.error('❌ Error eliminando candidato:', error)
      throw error
    }
  }
}