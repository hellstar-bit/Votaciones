// 📁 src/votes/dto/vote.dto.ts
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class VoteDto {
  @IsNumber()
  id_eleccion: number;

  @IsNumber()
  @IsOptional()
  id_candidato?: number; // null para voto en blanco

  @IsString()
  qr_code: string; // Código QR del carnet
}