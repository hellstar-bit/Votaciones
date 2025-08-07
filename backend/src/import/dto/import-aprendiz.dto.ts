import { IsString, IsEmail, IsOptional, IsIn, Length, Matches, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';

export class ImportAprendizDto {
  @IsString()
  @Transform(({ value }) => {
    if (!value) return value;
    const tipo = value.toString().toUpperCase().trim();
    // 🔧 MAPEO AUTOMÁTICO DE TIPOS COMUNES
    const mapeo = {
      'PPT': 'PP',
      'CEDULA': 'CC',
      'TARJETA': 'TI',
      'EXTRANJERIA': 'CE'
    };
    return mapeo[tipo] || tipo;
  })
  @IsIn(['CC', 'TI', 'CE', 'PP', 'PEP', 'PPT'], {
    message: 'Tipo de documento debe ser: CC, TI, CE, PP, PEP, PPT'
  })
  tipo_documento: string;

  @IsString()
  @IsNotEmpty({ message: 'Número de documento es requerido' })
  @Transform(({ value }) => {
    // 🔧 LIMPIEZA AUTOMÁTICA: remover espacios, guiones, puntos
    if (!value) return value;
    return value.toString().trim().replace(/[\s\.-]/g, '');
  })
  @Length(4, 20, { message: 'Número de documento debe tener entre 4 y 20 caracteres' })
  // 🔧 MÁS FLEXIBLE: Permitir números, letras y algunos caracteres especiales
  @Matches(/^[0-9A-Za-z\-]+$/, { message: 'Número de documento contiene caracteres inválidos' })
  numero_documento: string;

  @IsString()
  @IsNotEmpty({ message: 'Nombres son requeridos' })
  @Transform(({ value }) => {
    if (!value) return value;
    return value.toString().trim().replace(/\s+/g, ' '); // Normalizar espacios
  })
  @Length(1, 150, { message: 'Nombres debe tener entre 1 y 150 caracteres' })
  nombres: string;

  @IsString()
  @IsNotEmpty({ message: 'Apellidos son requeridos' })
  @Transform(({ value }) => {
    if (!value) return value;
    return value.toString().trim().replace(/\s+/g, ' '); // Normalizar espacios
  })
  @Length(1, 150, { message: 'Apellidos debe tener entre 1 y 150 caracteres' })
  apellidos: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email debe tener un formato válido' })
  @Transform(({ value }) => {
    if (!value || value.toString().trim() === '') return null;
    return value.toString().trim().toLowerCase();
  })
  email?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => {
    if (!value || value.toString().trim() === '' || value.toString().trim() === '0') return null;
    // 🔧 LIMPIEZA: remover caracteres no numéricos excepto +
    return value.toString().trim().replace(/[^\d+]/g, '');
  })
  @Length(7, 20, { message: 'Teléfono debe tener entre 7 y 20 dígitos' })
  telefono?: string;

  @IsString()
  @IsNotEmpty({ message: 'Número de ficha es requerido' })
  @Transform(({ value }) => {
    if (!value) return value;
    return value.toString().trim();
  })
  numero_ficha: string;

  @IsString()
  @IsNotEmpty({ message: 'Nombre del programa es requerido' })
  @Transform(({ value }) => {
    if (!value) return value;
    return value.toString().trim();
  })
  nombre_programa: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => {
    if (!value) return 'ACTIVO';
    const estado = value.toString().toUpperCase().trim();
    // 🔧 MAPEO DE ESTADOS COMUNES
    const mapeoEstados = {
      'MATRICULADO': 'ACTIVO',
      'INSCRITO': 'ACTIVO',
      'EGRESADO': 'INACTIVO',
      'RETIRADO': 'INACTIVO'
    };
    return mapeoEstados[estado] || estado;
  })
  estado?: string;
}