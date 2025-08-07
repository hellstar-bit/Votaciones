// 📁 backend/src/import/validators/excel-validator.service.ts  
// VALIDADOR MÁS FLEXIBLE
// =====================================================

import { Injectable } from '@nestjs/common';
import { validate, ValidationError } from 'class-validator';
import { plainToClass, Transform } from 'class-transformer';
import { ImportAprendizDto } from '../dto/import-aprendiz.dto';

@Injectable()
export class ExcelValidatorService {

  async validateImportDto(importDto: ImportAprendizDto): Promise<ValidationError[]> {
    const dto = plainToClass(ImportAprendizDto, importDto, {
      enableImplicitConversion: true, // 🔧 CONVERSIÓN AUTOMÁTICA DE TIPOS
      excludeExtraneousValues: false // 🔧 NO EXCLUIR VALORES EXTRA
    });
    
    const errors = await validate(dto, {
      skipMissingProperties: false,
      whitelist: false, // 🔧 NO FILTRAR PROPIEDADES EXTRA
      forbidNonWhitelisted: false // 🔧 NO PROHIBIR PROPIEDADES EXTRA
      // transform: true // 🔧 APLICAR TRANSFORMACIONES (NO SOPORTADO EN ValidatorOptions)
    });
    
    // 🔧 FILTRAR SOLO ERRORES CRÍTICOS
    return errors.filter(error => {
      // Ignorar errores menores en campos opcionales
      if (['telefono', 'email', 'estado'].includes(error.property)) {
        return false;
      }
      return true;
    });
  }

  validateDocumentNumber(documento: string, tipo: string): { valid: boolean; message?: string } {
    if (!documento || documento.trim() === '') {
      return { valid: false, message: 'Número de documento requerido' };
    }

    const cleanDoc = documento.toString().trim().replace(/[\s\.-]/g, '');

    // 🔧 VALIDACIONES MÁS FLEXIBLES
    if (cleanDoc.length < 4) {
      return { valid: false, message: 'Documento muy corto (mínimo 4 caracteres)' };
    }

    if (cleanDoc.length > 20) {
      return { valid: false, message: 'Documento muy largo (máximo 20 caracteres)' };
    }

    // 🔧 VALIDACIONES POR TIPO MÁS PERMISIVAS
    switch (tipo?.toUpperCase()) {
      case 'CC':
        if (!/^\d{4,12}$/.test(cleanDoc)) {
          return { valid: false, message: 'Cédula debe tener entre 4 y 12 dígitos' };
        }
        break;
      
      case 'TI':
        if (!/^\d{6,12}$/.test(cleanDoc)) {
          return { valid: false, message: 'Tarjeta de identidad debe tener entre 6 y 12 dígitos' };
        }
        break;
      
      case 'CE':
      case 'PP':
      case 'PPT':
        // 🔧 MUY FLEXIBLE: Cualquier combinación alfanumérica
        if (!/^[A-Za-z0-9\-]{4,20}$/.test(cleanDoc)) {
          return { valid: false, message: 'Documento debe tener entre 4 y 20 caracteres alfanuméricos' };
        }
        break;

      case 'PEP':
        if (!/^[A-Za-z0-9]{6,15}$/.test(cleanDoc)) {
          return { valid: false, message: 'PEP debe tener entre 6 y 15 caracteres alfanuméricos' };
        }
        break;

      default:
        // 🔧 ACEITAR CUALQUIER TIPO NO RECONOCIDO
        console.warn(`⚠️ Tipo de documento desconocido: ${tipo}, pero se acepta`);
        break;
    }

    return { valid: true };
  }

  validateEmail(email: string): { valid: boolean; message?: string } {
    // 🔧 HACER EMAIL OPCIONAL
    if (!email || email.trim() === '') {
      return { valid: true }; // Email opcional
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return { valid: false, message: 'Formato de email inválido' };
    }

    return { valid: true };
  }

  validatePhone(telefono: string): { valid: boolean; message?: string } {
    // 🔧 HACER TELÉFONO OPCIONAL
    if (!telefono || telefono.trim() === '' || telefono.trim() === '0') {
      return { valid: true }; // Teléfono opcional
    }

    const cleanPhone = telefono.toString().replace(/[^\d+]/g, '');
    
    if (cleanPhone.length < 7 || cleanPhone.length > 20) {
      return { valid: false, message: 'Teléfono debe tener entre 7 y 20 dígitos' };
    }

    return { valid: true };
  }

  // 🔧 NUEVA FUNCIÓN: LIMPIAR Y NORMALIZAR DATOS
  cleanStudentData(estudiante: any): any {
    return {
      tipoDocumento: this.normalizeDocumentType(estudiante.tipoDocumento),
      numeroDocumento: this.cleanDocumentNumber(estudiante.numeroDocumento),
      nombreCompleto: this.cleanName(estudiante.nombreCompleto),
      estado: this.normalizeState(estudiante.estado),
      email: this.cleanEmail(estudiante.email),
      telefono: this.cleanPhone(estudiante.telefono),
      telefonoAlt: this.cleanPhone(estudiante.telefonoAlt || ''),
    };
  }

  private normalizeDocumentType(tipo: string): string {
    if (!tipo) return 'CC';
    
    const tipoUpper = tipo.toString().toUpperCase().trim();
    const mapping = {
      'PPT': 'PP',
      'CEDULA': 'CC',
      'TARJETA': 'TI',
      'EXTRANJERIA': 'CE'
    };
    
    return mapping[tipoUpper] || tipoUpper;
  }

  private cleanDocumentNumber(documento: string): string {
    if (!documento) return '';
    return documento.toString().trim().replace(/[\s\.-]/g, '');
  }

  private cleanName(nombre: string): string {
    if (!nombre) return '';
    return nombre.toString().trim().replace(/\s+/g, ' ').toUpperCase();
  }

  private normalizeState(estado: string): string {
    if (!estado) return 'ACTIVO';
    
    const estadoUpper = estado.toString().toUpperCase().trim();
    const mapping = {
      'MATRICULADO': 'ACTIVO',
      'INSCRITO': 'ACTIVO',
      'EGRESADO': 'INACTIVO',
      'RETIRADO': 'INACTIVO'
    };
    
    return mapping[estadoUpper] || estadoUpper;
  }

  private cleanEmail(email: string): string {
    if (!email || email.toString().trim() === '') return '';
    return email.toString().trim().toLowerCase();
  }

  private cleanPhone(telefono: string): string {
    if (!telefono || telefono.toString().trim() === '' || telefono.toString().trim() === '0') return '';
    return telefono.toString().trim().replace(/[^\d+]/g, '');
  }
}
