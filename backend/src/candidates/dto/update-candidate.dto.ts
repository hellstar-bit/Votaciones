// src/candidates/dto/update-candidate.dto.ts
import { IsNumber, IsString, IsOptional, IsEmail } from 'class-validator'

export class UpdateCandidateDto {
  @IsOptional()
  @IsNumber()
  numero_lista?: number

  @IsOptional()
  @IsString()
  nombres?: string

  @IsOptional()
  @IsString()
  apellidos?: string

  @IsOptional()
  @IsEmail()
  email?: string

  @IsOptional()
  @IsString()
  telefono?: string

  // 🆕 Permitir actualizar foto
  @IsOptional()
  @IsString()
  foto_url?: string
}