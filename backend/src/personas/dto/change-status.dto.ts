// 📁 backend/src/personas/dto/change-status.dto.ts
import { IsString, IsOptional } from 'class-validator';

export class ChangeStatusDto {
  @IsString({ message: 'El estado es obligatorio' })
  estado: string;

  @IsOptional()
  @IsString({ message: 'El motivo debe ser texto' })
  motivo?: string;
}
