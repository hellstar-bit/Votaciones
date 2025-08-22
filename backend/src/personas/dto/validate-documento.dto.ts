// 📁 backend/src/personas/dto/validate-documento.dto.ts
import { IsString, IsOptional, IsInt } from 'class-validator';

export class ValidateDocumentoDto {
  @IsString({ message: 'El número de documento es obligatorio' })
  numero_documento: string;

  @IsOptional()
  @IsInt({ message: 'El ID a excluir debe ser un número entero' })
  excludeId?: number;
}