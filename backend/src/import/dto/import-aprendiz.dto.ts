// 📁 backend/src/import/dto/import-aprendiz.dto.ts
import { IsString, IsEmail, IsOptional, IsIn, Length, Matches } from 'class-validator';

export class ImportAprendizDto {
  @IsString()
  @IsIn(['CC', 'TI', 'CE', 'PPT', 'PEP'], {
    message: 'Tipo de documento debe ser: CC, TI, CE, PPT, PEP'
  })
  tipo_documento: string;

  @IsString()
  @Length(6, 15, { message: 'Número de documento debe tener entre 6 y 15 caracteres' })
  @Matches(/^[0-9]+$/, { message: 'Número de documento solo puede contener números' })
  numero_documento: string;

  @IsString()
  @Length(2, 100, { message: 'Nombres debe tener entre 2 y 100 caracteres' })
  nombres: string;

  @IsString()
  @Length(2, 100, { message: 'Apellidos debe tener entre 2 y 100 caracteres' })
  apellidos: string;

  @IsEmail({}, { message: 'Email debe tener un formato válido' })
  email: string;

  @IsOptional()
  @IsString()
  @Matches(/^[0-9+\-\s()]{7,15}$/, { message: 'Teléfono debe tener un formato válido' })
  telefono?: string;

  @IsString()
  numero_ficha: string;

  @IsString()
  nombre_programa: string;

  @IsOptional()
  @IsString()
  estado?: string;
}

