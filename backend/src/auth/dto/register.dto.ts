import { IsString, IsNotEmpty, IsEmail, IsOptional, IsEnum, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => {
    if (!value) return value;
    return value.toString().trim().replace(/[\s\.-]/g, '');
  })
  numero_documento: string;

  @IsEnum(['CC', 'TI', 'CE', 'PEP', 'PPT', 'PP']) // 🔧 Agregar PPT y PP
  @Transform(({ value }) => {
    if (!value) return 'CC';
    const tipo = value.toString().toUpperCase().trim();
    // Mapeo automático
    const mapeo = {
      'PPT': 'PP',
      'CEDULA': 'CC',
      'TARJETA': 'TI'
    };
    return mapeo[tipo] || tipo;
  })
  tipo_documento: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => {
    if (!value) return value;
    return value.toString().trim().replace(/\s+/g, ' ');
  })
  nombres: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => {
    if (!value) return value;
    return value.toString().trim().replace(/\s+/g, ' ');
  })
  apellidos: string;

  @IsEmail()
  @IsOptional() // 🔧 Hacer email opcional
  @Transform(({ value }) => {
    if (!value || value.toString().trim() === '') return null;
    return value.toString().trim().toLowerCase();
  })
  email?: string;

  @IsString()
  @IsOptional() // 🔧 Hacer teléfono opcional
  @Transform(({ value }) => {
    if (!value || value.toString().trim() === '' || value.toString().trim() === '0') return null;
    return value.toString().trim().replace(/[^\d+]/g, '');
  })
  telefono?: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  rol: string;
}