// 📁 src/elections/dto/create-election.dto.ts
// ====================================================================
import { IsString, IsNotEmpty, IsOptional, IsDateString, IsEnum, IsBoolean, IsNumber } from 'class-validator';

export class CreateElectionDto {
  @IsString()
  @IsNotEmpty()
  titulo: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsString()
  @IsNotEmpty()
  tipo_eleccion: string;

  @IsNumber()
  @IsOptional()
  id_centro?: number;

  @IsNumber()
  @IsOptional()
  id_sede?: number;

  @IsNumber()
  @IsOptional()
  id_ficha?: number;

  @IsEnum(['mixta', 'nocturna', 'madrugada'])
  @IsOptional()
  jornada?: string;

  @IsDateString()
  fecha_inicio: string;

  @IsDateString()
  fecha_fin: string;

  @IsBoolean()
  @IsOptional()
  permite_voto_blanco?: boolean = true;
}