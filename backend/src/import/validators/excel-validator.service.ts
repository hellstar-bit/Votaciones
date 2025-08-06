// 📁 backend/src/import/validators/excel-validator.service.ts
import { Injectable } from '@nestjs/common';
import { validate, ValidationError } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { ImportAprendizDto } from '../dto/import-aprendiz.dto';

@Injectable()
export class ExcelValidatorService {

  async validateImportDto(importDto: ImportAprendizDto): Promise<ValidationError[]> {
    const dto = plainToClass(ImportAprendizDto, importDto);
    return await validate(dto);
  }

  validateExcelStructure(sheetData: any[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validar estructura mínima
    if (!Array.isArray(sheetData) || sheetData.length === 0) {
      errors.push('Hoja vacía o formato inválido');
      return { valid: false, errors };
    }

    // Buscar headers esperados
    let hasHeaders = false;
    for (const row of sheetData) {
      if (Array.isArray(row) && row.includes('Identificación') && row.includes('Nombre')) {
        hasHeaders = true;
        break;
      }
    }

    if (!hasHeaders) {
      errors.push('No se encontraron headers válidos (Identificación, Nombre)');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  validateDocumentNumber(documento: string, tipo: string): { valid: boolean; message?: string } {
    if (!documento || documento.trim() === '') {
      return { valid: false, message: 'Número de documento requerido' };
    }

    const cleanDoc = documento.toString().trim();

    // Validar según tipo de documento
    switch (tipo?.toUpperCase()) {
      case 'CC':
        if (!/^\d{6,10}$/.test(cleanDoc)) {
          return { valid: false, message: 'Cédula debe tener entre 6 y 10 dígitos' };
        }
        break;
      
      case 'TI':
        if (!/^\d{8,11}$/.test(cleanDoc)) {
          return { valid: false, message: 'Tarjeta de identidad debe tener entre 8 y 11 dígitos' };
        }
        break;
      
      case 'CE':
        if (!/^[A-Z0-9]{6,15}$/.test(cleanDoc)) {
          return { valid: false, message: 'Cédula extranjera debe tener entre 6 y 15 caracteres alfanuméricos' };
        }
        break;

      case 'PPT':
        if (!/^\d{6,12}$/.test(cleanDoc)) {
          return { valid: false, message: 'PPT debe tener entre 6 y 12 dígitos' };
        }
        break;

      default:
        return { valid: false, message: `Tipo de documento '${tipo}' no válido` };
    }

    return { valid: true };
  }

  validateEmail(email: string): { valid: boolean; message?: string } {
    if (!email || email.trim() === '') {
      return { valid: false, message: 'Email requerido' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return { valid: false, message: 'Formato de email inválido' };
    }

    return { valid: true };
  }

  validatePhone(telefono: string): { valid: boolean; message?: string } {
    if (!telefono || telefono.trim() === '') {
      return { valid: true }; // Teléfono es opcional
    }

    const cleanPhone = telefono.toString().replace(/[\s\-\(\)]/g, '');
    
    if (!/^\+?[0-9]{7,15}$/.test(cleanPhone)) {
      return { valid: false, message: 'Formato de teléfono inválido' };
    }

    return { valid: true };
  }

  splitFullName(nombreCompleto: string): { nombres: string; apellidos: string } {
    if (!nombreCompleto || nombreCompleto.trim() === '') {
      return { nombres: '', apellidos: '' };
    }

    const parts = nombreCompleto.trim().split(/\s+/);
    
    if (parts.length === 1) {
      return { nombres: parts[0], apellidos: parts[0] };
    } else if (parts.length === 2) {
      return { nombres: parts[0], apellidos: parts[1] };
    } else if (parts.length === 3) {
      return { nombres: parts[0], apellidos: `${parts[1]} ${parts[2]}` };
    } else {
      // Más de 3 partes: primeras 2 como nombres, resto como apellidos
      return { 
        nombres: `${parts[0]} ${parts[1]}`, 
        apellidos: parts.slice(2).join(' ') 
      };
    }
  }
}