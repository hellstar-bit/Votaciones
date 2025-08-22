// 📁 backend/src/personas/dto/create-aprendiz.dto.ts
import { IsString, IsEmail, IsOptional, IsInt, IsIn, Matches, Length } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateAprendizDto {
  @IsString({ message: 'Los nombres son obligatorios' })
  @Length(2, 100, { message: 'Los nombres deben tener entre 2 y 100 caracteres' })
  @Transform(({ value }) => value?.trim())
  nombres: string;

  @IsString({ message: 'Los apellidos son obligatorios' })
  @Length(2, 100, { message: 'Los apellidos deben tener entre 2 y 100 caracteres' })
  @Transform(({ value }) => value?.trim())
  apellidos: string;

  @IsString({ message: 'El tipo de documento es obligatorio' })
  @IsIn(['CC', 'TI', 'CE', 'PA', 'PE'], { 
    message: 'El tipo de documento debe ser CC, TI, CE, PA o PE' 
  })
  tipo_documento: string;

  @IsString({ message: 'El número de documento es obligatorio' })
  @Matches(/^\d{6,15}$/, { 
    message: 'El número de documento debe tener entre 6 y 15 dígitos' 
  })
  numero_documento: string;

  @IsString({ message: 'El teléfono es obligatorio' })
  @Matches(/^\d{10}$/, { 
    message: 'El teléfono debe tener exactamente 10 dígitos' 
  })
  telefono: string;

  @IsEmail({}, { message: 'El formato del email no es válido' })
  @Transform(({ value }) => value?.toLowerCase()?.trim())
  email: string;

  @IsOptional()
  @IsInt({ message: 'El ID de la ficha debe ser un número entero' })
  id_ficha?: number;
}