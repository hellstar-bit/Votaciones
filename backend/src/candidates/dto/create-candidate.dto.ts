import { IsNumber, IsString, IsOptional, IsEmail } from 'class-validator'
import { Transform } from 'class-transformer'

export class CreateCandidateDto {
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  id_eleccion: number

  @IsString()
  numero_documento: string

  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  numero_lista: number

  // Campos opcionales para candidatos manuales
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

  // 🆕 Campo para la URL de la foto
  @IsOptional()
  @IsString()
  foto_url?: string
}