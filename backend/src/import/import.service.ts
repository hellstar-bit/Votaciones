// 📁 backend/src/import/import.service.ts - VERSIÓN CORREGIDA CON RUTAS
import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

// ✅ IMPORTAR DESDE LAS RUTAS CORRECTAS
import { Persona } from '../entities/persona.entity';
import { Ficha } from '../entities/ficha.entity';
import { Centro } from '../entities/centro.entity';
import { Sede } from '../entities/sede.entity';


import { ImportResultDto, ImportSummary, ImportError, ImportWarning } from './dto/import-result.dto';
import { ImportAprendizDto } from './dto/import-aprendiz.dto';
import { ExcelSheetData, ExcelRowData } from './interfaces/excel-row.interface';
import { ExcelValidatorService } from './validators/excel-validator.service';
import { ImportLog } from 'src/entities/import-log.entity';
import { ImportError as ImportErrorEntity } from 'src/entities/import-error.entity';
@Injectable()
export class ImportService {
  constructor(
    @InjectRepository(Persona)
    private personaRepository: Repository<Persona>,
    @InjectRepository(Ficha)
    private fichaRepository: Repository<Ficha>,
    @InjectRepository(Centro)
    private centroRepository: Repository<Centro>,
    @InjectRepository(Sede)
    private sedeRepository: Repository<Sede>,
    @InjectRepository(ImportLog)
    private importLogRepository: Repository<ImportLog>,
    @InjectRepository(ImportErrorEntity)
    private importErrorRepository: Repository<ImportErrorEntity>,
    private dataSource: DataSource,
    private excelValidator: ExcelValidatorService,
  ) {}

  async importAprendicesFromExcel(
    file: Express.Multer.File,
    options: { validateFichas?: boolean; createMissingFichas?: boolean }
  ): Promise<ImportResultDto> {
    const startTime = Date.now();
    
    try {
      console.log('📊 Iniciando procesamiento de Excel...');
      
      // 1. Leer y procesar el archivo Excel
      const sheetsData = await this.processExcelFile(file);
      console.log(`📋 Procesadas ${sheetsData.length} hojas`);

      // 2. Validar datos
      const validationResults = await this.validateImportData(sheetsData, options);
      console.log('✅ Validación completada');

      // 3. Importar datos válidos
      const importResults = await this.executeImport(validationResults.validRecords);
      console.log(`💾 Importados ${importResults.importedCount} registros`);

      // 4. Limpiar archivo temporal
      this.cleanupTempFile(file.path);

      // 5. Generar reporte final
      const executionTime = Date.now() - startTime;
      
      return {
        success: validationResults.errors.filter(e => e.severity === 'error').length === 0,
        summary: {
          totalFiles: 1,
          totalSheets: sheetsData.length,
          totalRecords: validationResults.totalRecords,
          importedRecords: importResults.importedCount,
          duplicateRecords: importResults.duplicatesCount,
          errorRecords: validationResults.errors.length,
          fichasProcessed: sheetsData.map(s => s.numeroFicha),
          programasFound: [...new Set(sheetsData.map(s => s.nombrePrograma))],
        },
        errors: validationResults.errors,
        warnings: validationResults.warnings,
        importedRecords: importResults.importedCount,
        totalRecords: validationResults.totalRecords,
        executionTime,
      };

    } catch (error) {
      console.error('❌ Error en importación:', error);
      this.cleanupTempFile(file.path);
      
      throw new InternalServerErrorException({
        message: 'Error procesando archivo Excel',
        details: error.message,
      });
    }
  }

  private async processExcelFile(file: Express.Multer.File): Promise<ExcelSheetData[]> {
    const workbook = XLSX.readFile(file.path, {
      cellDates: true,
      cellNF: false,
      cellText: false,
    });

    const sheetsData: ExcelSheetData[] = [];

    for (const sheetName of workbook.SheetNames) {
      console.log(`📋 Procesando hoja: ${sheetName}`);
      
      const worksheet = workbook.Sheets[sheetName];
      const allData = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1,
        raw: false,
        defval: '',
      }) as any[][];

      // Extraer información de la hoja
      const sheetData = this.parseSheetData(sheetName, allData);
      
      if (sheetData.estudiantes.length > 0) {
        sheetsData.push(sheetData);
        console.log(`✅ Hoja ${sheetName}: ${sheetData.estudiantes.length} estudiantes`);
      } else {
        console.log(`⚠️ Hoja ${sheetName}: Sin estudiantes`);
      }
    }

    return sheetsData;
  }

  private parseSheetData(sheetName: string, allData: any[][]): ExcelSheetData {
    let numeroFicha = sheetName;
    let nombrePrograma = '';
    const estudiantes: ExcelRowData[] = [];
    const errores: ImportError[] = [];

    // Buscar programa de formación
    for (let i = 0; i < allData.length; i++) {
      const row = allData[i];
      if (row[0] === 'Programa de Formación') {
        nombrePrograma = row[2] || '';
        break;
      }
    }

    // Buscar inicio de datos de estudiantes
    let dataStartIndex = -1;
    for (let i = 0; i < allData.length; i++) {
      const row = allData[i];
      if (row[0] === 'Identificación' && row[2] === 'Nombre') {
        dataStartIndex = i + 1;
        break;
      }
    }

    // Procesar estudiantes
    if (dataStartIndex > -1) {
      for (let i = dataStartIndex; i < allData.length; i++) {
        const row = allData[i];
        
        if (!row || !row[1] || row[1].toString().trim() === '') {
          continue; // Saltar filas vacías
        }

        try {
          const estudiante: ExcelRowData = {
            tipoDocumento: (row[0] || '').toString().trim(),
            numeroDocumento: (row[1] || '').toString().trim(),
            nombreCompleto: (row[2] || '').toString().trim(),
            estado: (row[3] || '').toString().trim(),
            email: (row[4] || '').toString().trim(),
            telefono: (row[5] || '').toString().trim(),
            telefonoAlt: (row[6] || '').toString().trim(),
          };

          // Validación básica
          if (!estudiante.numeroDocumento || !estudiante.nombreCompleto) {
            errores.push({
              row: i + 1,
              sheet: sheetName,
              field: 'documento/nombre',
              value: row,
              message: 'Documento o nombre faltante',
              severity: 'error',
            });
            continue;
          }

          estudiantes.push(estudiante);

        } catch (error) {
          errores.push({
            row: i + 1,
            sheet: sheetName,
            field: 'general',
            value: row,
            message: `Error procesando fila: ${error.message}`,
            severity: 'error',
          });
        }
      }
    }

    return {
      numeroFicha,
      nombrePrograma,
      estudiantes,
      errores,
    };
  }

  private async validateImportData(
    sheetsData: ExcelSheetData[],
    options: { validateFichas?: boolean; createMissingFichas?: boolean }
  ) {
    const validRecords: ImportAprendizDto[] = [];
    const errors: ImportError[] = [];
    const warnings: ImportWarning[] = [];
    let totalRecords = 0;

    // Obtener fichas existentes
    const existingFichas = await this.fichaRepository.find();
    const fichasMap = new Map(existingFichas.map(f => [f.numero_ficha, f]));

    for (const sheetData of sheetsData) {
      totalRecords += sheetData.estudiantes.length;

      // Validar si la ficha existe
      if (options.validateFichas && !fichasMap.has(sheetData.numeroFicha)) {
        if (options.createMissingFichas) {
          warnings.push({
            row: 0,
            sheet: sheetData.numeroFicha,
            message: `Ficha ${sheetData.numeroFicha} será creada automáticamente`,
            data: { numeroFicha: sheetData.numeroFicha, programa: sheetData.nombrePrograma },
          });
        } else {
          errors.push({
            row: 0,
            sheet: sheetData.numeroFicha,
            field: 'numero_ficha',
            value: sheetData.numeroFicha,
            message: `Ficha ${sheetData.numeroFicha} no existe en el sistema`,
            severity: 'error',
          });
          continue;
        }
      }

      // Validar cada estudiante
      for (const estudiante of sheetData.estudiantes) {
        try {
          const [nombres, ...apellidosArray] = estudiante.nombreCompleto.split(' ');
          const apellidos = apellidosArray.join(' ') || nombres;

          const importDto: ImportAprendizDto = {
            tipo_documento: estudiante.tipoDocumento,
            numero_documento: estudiante.numeroDocumento,
            nombres: nombres,
            apellidos: apellidos,
            email: estudiante.email,
            telefono: estudiante.telefono,
            numero_ficha: sheetData.numeroFicha,
            nombre_programa: sheetData.nombrePrograma,
            estado: estudiante.estado || 'ACTIVO',
          };

          // Validar con class-validator
          const validationErrors = await this.excelValidator.validateImportDto(importDto);
          
          if (validationErrors.length > 0) {
            validationErrors.forEach(error => {
              errors.push({
                row: 0,
                sheet: sheetData.numeroFicha,
                field: error.property,
                value: error.value,
                message: Object.values(error.constraints || {}).join(', '),
                severity: 'error',
              });
            });
          } else {
            validRecords.push(importDto);
          }

        } catch (error) {
          errors.push({
            row: 0,
            sheet: sheetData.numeroFicha,
            field: 'general',
            value: estudiante,
            message: `Error validando estudiante: ${error.message}`,
            severity: 'error',
          });
        }
      }

      // Agregar errores de parsing
      errors.push(...sheetData.errores);
    }

    return {
      validRecords,
      errors,
      warnings,
      totalRecords,
    };
  }

  private async executeImport(validRecords: ImportAprendizDto[]) {
    let importedCount = 0;
    let duplicatesCount = 0;

    // Obtener centro y sede por defecto (ajustar según tu configuración)
    const defaultCentro = await this.centroRepository.findOne({
      where: { codigo_centro: '9207' }, // Centro Colombo Alemán
    });

    const defaultSede = await this.sedeRepository.findOne({
      where: { codigo_sede: 'PRINCIPAL' },
    });

    // Usar transacción para la importación
    await this.dataSource.transaction(async (manager) => {
      for (const record of validRecords) {
        try {
          // Verificar si ya existe el documento
          const existingPersona = await manager.findOne(Persona, {
            where: { numero_documento: record.numero_documento },
          });

          if (existingPersona) {
            duplicatesCount++;
            continue;
          }

          // Buscar o crear ficha
          let ficha = await manager.findOne(Ficha, {
            where: { numero_ficha: record.numero_ficha },
          });

          if (!ficha) {
            // Crear ficha si no existe
            const newFicha = manager.create(Ficha, {
              numero_ficha: record.numero_ficha,
              nombre_programa: record.nombre_programa,
              jornada: 'mixta', // Por defecto
              fecha_inicio: new Date(),
              id_centro: defaultCentro?.id_centro,
              id_sede: defaultSede?.id_sede,
            });
            
            ficha = await manager.save(Ficha, newFicha);
            console.log(`✅ Ficha creada: ${record.numero_ficha}`);
          }

          // Crear persona
          const nuevaPersona = manager.create(Persona, {
            tipo_documento: record.tipo_documento as "CC" | "TI" | "CE" | "PEP" | "PPT",
            numero_documento: record.numero_documento,
            nombres: record.nombres,
            apellidos: record.apellidos,
            email: record.email,
            telefono: record.telefono,
            estado: 'activo',
            id_ficha: ficha.id_ficha,
            id_centro: defaultCentro?.id_centro,
            id_sede: defaultSede?.id_sede,
          });

          await manager.save(Persona, nuevaPersona);
          importedCount++;

        } catch (error) {
          console.error(`❌ Error importando ${record.numero_documento}:`, error);
          // Continuar con el siguiente registro
        }
      }
    });

    return {
      importedCount,
      duplicatesCount,
    };
  }

  async previewExcelImport(file: Express.Multer.File) {
    try {
      const sheetsData = await this.processExcelFile(file);
      
      // Generar preview con primeros 5 registros por hoja
      const preview = sheetsData.map(sheet => ({
        numeroFicha: sheet.numeroFicha,
        nombrePrograma: sheet.nombrePrograma,
        totalEstudiantes: sheet.estudiantes.length,
        erroresEncontrados: sheet.errores.length,
        muestra: sheet.estudiantes.slice(0, 5).map(est => ({
          documento: est.numeroDocumento,
          nombre: est.nombreCompleto,
          email: est.email,
          telefono: est.telefono,
        })),
        errores: sheet.errores.slice(0, 3), // Primeros 3 errores
      }));

      this.cleanupTempFile(file.path);
      
      return {
        success: true,
        preview,
        resumen: {
          totalHojas: sheetsData.length,
          totalEstudiantes: sheetsData.reduce((sum, s) => sum + s.estudiantes.length, 0),
          totalErrores: sheetsData.reduce((sum, s) => sum + s.errores.length, 0),
          fichas: sheetsData.map(s => s.numeroFicha),
          programas: [...new Set(sheetsData.map(s => s.nombrePrograma))],
        },
      };

    } catch (error) {
      this.cleanupTempFile(file.path);
      throw new BadRequestException({
        message: 'Error procesando archivo Excel',
        details: error.message,
      });
    }
  }

  async getImportHistory() {
    // Implementar historial de importaciones
    // Por ahora retornamos datos simulados
    return [
      {
        id: 1,
        filename: 'MATRICULADOS_28_JULIO.xlsx',
        fecha: new Date(),
        usuario: 'admin',
        registros_importados: 72,
        registros_totales: 75,
        estado: 'completado',
      },
    ];
  }

  async generateExcelTemplate() {
    const workbook = XLSX.utils.book_new();
    
    // Crear hoja de ejemplo
    const templateData = [
      ['', '', 'Reporte de Inscripciones', '', '', '', ''],
      ['', '', '', '', '', '', ''],
      ['Código Ficha', '', '1234567', '', '', '', ''],
      ['Programa de Formación', '', 'ANÁLISIS Y DESARROLLO DE SOFTWARE', '', '', '', ''],
      ['', '', '', '', '', '', ''],
      ['Identificación', '', 'Nombre', 'Estado', 'correo', 'tel', 'tel 1'],
      ['CC', '12345678', 'JUAN PÉREZ GARCÍA', 'MATRICULADO', 'juan.perez@ejemplo.com', '3001234567', ''],
      ['TI', '87654321', 'MARÍA LÓPEZ RODRÍGUEZ', 'MATRICULADO', 'maria.lopez@ejemplo.com', '3007654321', ''],
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(templateData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Plantilla');

    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
    
    return {
      filename: 'Plantilla_Importacion_Aprendices.xlsx',
      buffer,
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
  }

  private cleanupTempFile(filePath: string) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log('🗑️ Archivo temporal eliminado');
      }
    } catch (error) {
      console.error('⚠️ Error eliminando archivo temporal:', error);
    }
  }
}