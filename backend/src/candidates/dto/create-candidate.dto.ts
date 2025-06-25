// 📁 src/candidates/dto/create-candidate.dto.ts
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

  @IsString()
  @IsOptional()
  propuestas?: string;

  @IsString()
  @IsOptional()
  foto_url?: string;
}