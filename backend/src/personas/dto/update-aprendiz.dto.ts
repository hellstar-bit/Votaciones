// 📁 backend/src/personas/dto/update-aprendiz.dto.ts
import { IsString, IsEmail, IsOptional, IsInt, IsIn, Matches, Length } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateAprendizDto {
  @IsOptional()
  @IsString({ message: 'Los nombres deben ser texto' })
  @Length(2, 100, { message: 'Los nombres deben tener entre 2 y 100 caracteres' })
  @Transform(({ value }) => value?.trim())
  nombres?: string;

  @IsOptional()
  @IsString({ message: 'Los apellidos deben ser texto' })
  @Length(2, 100, { message: 'Los apellidos deben tener entre 2 y 100 caracteres' })
  @Transform(({ value }) => value?.trim())
  apellidos?: string;

  @IsOptional()
  @IsString({ message: 'El tipo de documento debe ser texto' })
  @IsIn(['CC', 'TI', 'CE', 'PA', 'PE'], { 
    message: 'El tipo de documento debe ser CC, TI, CE, PA o PE' 
  })
  tipo_documento?: string;

  @IsOptional()
  @IsString({ message: 'El teléfono debe ser texto' })
  @Matches(/^\d{10}$/, { 
    message: 'El teléfono debe tener exactamente 10 dígitos' 
  })
  telefono?: string;

  @IsOptional()
  @IsEmail({}, { message: 'El formato del email no es válido' })
  @Transform(({ value }) => value?.toLowerCase()?.trim())
  email?: string;

  @IsOptional()
  @IsInt({ message: 'El ID de la ficha debe ser un número entero' })
  id_ficha?: number;
}
