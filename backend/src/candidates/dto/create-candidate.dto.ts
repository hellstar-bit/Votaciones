// 📁 src/candidates/dto/create-candidate.dto.ts - ACTUALIZADO
// ====================================================================
import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class CreateCandidateDto {
  @IsNumber()
  id_eleccion: number;

  @IsString()
  @IsNotEmpty()
  numero_documento: string;

  @IsNumber()
  numero_lista: number;

  // ✅ NUEVOS CAMPOS: Para candidatos que no existen en el sistema
  @IsString()
  @IsOptional()
  nombres?: string;

  @IsString()
  @IsOptional()
  apellidos?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  telefono?: string;

  // Campos existentes opcionales
  @IsString()
  @IsOptional()
  propuestas?: string;

  @IsString()
  @IsOptional()
  foto_url?: string;
}