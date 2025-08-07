// 📁 backend/src/import/import.service.ts - VERSIÓN CORREGIDA CON VALIDACIONES FLEXIBLES
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
    options: { 
      validateFichas?: boolean; 
      createMissingFichas?: boolean;
      updateExisting?: boolean;
      skipDuplicates?: boolean;
      flexibleValidation?: boolean;
    } = {}
  ): Promise<ImportResultDto> {
    const startTime = Date.now();
    
    console.log('🚀 INICIANDO IMPORTACIÓN CON VALIDACIONES FLEXIBLES');
    console.log('📋 Opciones recibidas:', options);
    console.log('📁 Archivo:', {
      name: file.originalname,
      size: file.size,
      mimetype: file.mimetype
    });
    
    try {
      // 1. Leer y procesar el archivo Excel
      const sheetsData = await this.processExcelFile(file);
      console.log(`📋 Procesadas ${sheetsData.length} hojas con ${sheetsData.reduce((sum, s) => sum + s.estudiantes.length, 0)} estudiantes`);

      // 2. Validar datos con validaciones flexibles
      const validationResults = await this.validateImportData(sheetsData, options);
      console.log(`✅ Validación completada: ${validationResults.validRecords.length} válidos, ${validationResults.errors.length} errores`);

      // 3. Manejar duplicados
      const { toInsert, toUpdate, skipped } = await this.handleDuplicateRecords(validationResults.validRecords, options);
      console.log(`📊 Procesamiento duplicados: ${toInsert.length} nuevos, ${toUpdate.length} actualizar, ${skipped.length} omitidos`);

      // 4. Importar datos
      const importResults = await this.executeImport(toInsert, toUpdate, options);
      console.log(`💾 Importación completada: ${importResults.importedCount} nuevos, ${importResults.updatedCount} actualizados`);

      // 5. Limpiar archivo temporal
      this.cleanupTempFile(file.path);

      // 6. Generar reporte final
      const executionTime = Date.now() - startTime;
      const hasErrors = validationResults.errors.filter(e => e.severity === 'error').length > 0;
      
      console.log(`🏁 IMPORTACIÓN FINALIZADA en ${executionTime}ms - Éxito: ${!hasErrors}`);
      
      return {
        success: !hasErrors,
        summary: {
          totalFiles: 1,
          totalSheets: sheetsData.length,
          totalRecords: validationResults.totalRecords,
          importedRecords: importResults.importedCount + importResults.updatedCount,
          duplicateRecords: skipped.length,
          errorRecords: validationResults.errors.length,
          fichasProcessed: sheetsData.map(s => s.numeroFicha),
          programasFound: [...new Set(sheetsData.map(s => s.nombrePrograma))],
          updatedRecords: importResults.updatedCount,
          skippedRecords: skipped.length,
          processingTime: executionTime
        },
        errors: validationResults.errors,
        warnings: validationResults.warnings,
        importedRecords: importResults.importedCount + importResults.updatedCount,
        totalRecords: validationResults.totalRecords,
        executionTime,
        duplicatesSkipped: skipped,
        recordsUpdated: importResults.updatedCount,
        warningsCount: validationResults.warnings.length,
        validationMode: options.flexibleValidation ? 'flexible' : 'strict'
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
        console.log(`✅ Hoja ${sheetName}: ${sheetData.estudiantes.length} estudiantes, ${sheetData.errores.length} errores`);
      } else {
        console.log(`⚠️ Hoja ${sheetName}: Sin estudiantes válidos`);
      }
    }

    return sheetsData;
  }

  private parseSheetData(sheetName: string, allData: any[][]): ExcelSheetData {
    let numeroFicha = sheetName;
    let nombrePrograma = '';
    const estudiantes: ExcelRowData[] = [];
    const errores: ImportError[] = [];

    // 🔧 BUSCAR CÓDIGO DE FICHA - MEJORADA
    for (let i = 0; i < Math.min(10, allData.length); i++) {
      const row = allData[i];
      if (row && row[0]) {
        const cellText = row[0].toString().toLowerCase().trim();
        if ((cellText.includes('codigo') && cellText.includes('ficha')) || cellText === 'código ficha') {
          if (row[2] && row[2].toString().trim()) {
            numeroFicha = row[2].toString().trim();
            console.log(`🔍 Código de ficha encontrado: ${numeroFicha}`);
            break;
          }
        }
      }
    }

    // 🔧 BUSCAR PROGRAMA DE FORMACIÓN - MEJORADA
    for (let i = 0; i < Math.min(15, allData.length); i++) {
      const row = allData[i];
      if (row && row[0]) {
        const cellText = row[0].toString().toLowerCase().trim();
        if (cellText.includes('programa') && (cellText.includes('formación') || cellText.includes('formacion'))) {
          if (row[2] && row[2].toString().trim()) {
            nombrePrograma = row[2].toString().trim();
            console.log(`🔍 Programa encontrado: ${nombrePrograma}`);
            break;
          }
        }
      }
    }

    // 🔍 BUSCAR INICIO DE DATOS DE ESTUDIANTES - CORREGIDA
    let dataStartIndex = -1;
    for (let i = 0; i < allData.length; i++) {
      const row = allData[i];
      if (row && Array.isArray(row) && row.length >= 3) {
        // 🔧 BUSCAR CUALQUIER COMBINACIÓN DE IDENTIFICACIÓN Y NOMBRE
        const hasIdentificacion = row.some(cell => {
          if (!cell) return false;
          const cellText = cell.toString().toLowerCase().trim();
          return cellText.includes('identificacion') || cellText === 'identificación';
        });
        
        const hasNombre = row.some(cell => {
          if (!cell) return false;
          const cellText = cell.toString().toLowerCase().trim();
          return cellText.includes('nombre');
        });
        
        if (hasIdentificacion && hasNombre) {
          dataStartIndex = i + 1;
          console.log(`🔍 Headers encontrados en fila ${i + 1}:`, row);
          console.log(`📍 Datos de estudiantes inician en fila: ${dataStartIndex + 1}`);
          break;
        }
      }
    }

    // 🔧 PROCESAR ESTUDIANTES CON VALIDACIONES FLEXIBLES
    if (dataStartIndex > -1) {
      console.log(`📋 Procesando estudiantes desde fila ${dataStartIndex + 1} hasta ${allData.length}`);
      
      for (let i = dataStartIndex; i < allData.length; i++) {
        const row = allData[i];
        
        // 🔧 SALTAR FILAS COMPLETAMENTE VACÍAS
        if (!row || !Array.isArray(row) || row.every(cell => !cell || cell.toString().trim() === '')) {
          console.log(`⏭️ Saltando fila ${i + 1}: vacía`);
          continue;
        }

        // 🔧 VALIDAR QUE TENGA AL MENOS DOCUMENTO Y NOMBRE
        const documento = (row[1] || '').toString().trim();
        const nombre = (row[2] || '').toString().trim();
        
        if (!documento || !nombre) {
          console.log(`⏭️ Saltando fila ${i + 1}: sin documento (${documento}) o nombre (${nombre})`);
          continue;
        }

        try {
          // 🔧 CREAR ESTUDIANTE CON DATOS LIMPIOS
          const estudiante: ExcelRowData = {
            tipoDocumento: (row[0] || 'CC').toString().trim(),
            numeroDocumento: documento,
            nombreCompleto: nombre,
            estado: (row[3] || 'MATRICULADO').toString().trim(),
            email: (row[4] || '').toString().trim(),
            telefono: (row[5] || '').toString().trim(),
            telefonoAlt: (row[6] || '').toString().trim(),
          };

          console.log(`✅ Procesando estudiante: ${estudiante.numeroDocumento} - ${estudiante.nombreCompleto}`);
          estudiantes.push(estudiante);

        } catch (error) {
          console.warn(`⚠️ Error procesando fila ${i + 1}:`, error.message);
          errores.push({
            row: i + 1,
            sheet: sheetName,
            field: 'general',
            value: row,
            message: `Error procesando fila: ${error.message}`,
            severity: 'warning',
          });
        }
      }
    } else {
      console.error(`❌ No se encontraron headers válidos en la hoja ${sheetName}`);
      errores.push({
        row: 0,
        sheet: sheetName,
        field: 'estructura',
        value: 'N/A',
        message: 'No se encontraron headers válidos (Identificación, Nombre)',
        severity: 'error',
      });
    }

    console.log(`📋 Hoja ${sheetName} procesada: ${estudiantes.length} estudiantes, ${errores.length} errores`);

    return {
      numeroFicha,
      nombrePrograma,
      estudiantes,
      errores,
    };
  }

  private async validateImportData(
    sheetsData: ExcelSheetData[],
    options: { validateFichas?: boolean; createMissingFichas?: boolean; flexibleValidation?: boolean }
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

      // 🔧 VALIDACIÓN DE FICHAS MÁS FLEXIBLE
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

      // 🔧 VALIDAR CADA ESTUDIANTE CON VALIDACIONES FLEXIBLES
      let studentIndex = 0;
      for (const estudiante of sheetData.estudiantes) {
        try {
          // 🔧 DIVISIÓN INTELIGENTE DE NOMBRES
          const { nombres, apellidos } = this.dividirNombreCompleto(estudiante.nombreCompleto);

          const importDto: ImportAprendizDto = {
            tipo_documento: estudiante.tipoDocumento || 'CC',
            numero_documento: estudiante.numeroDocumento,
            nombres,
            apellidos,
            email: estudiante.email || null,
            telefono: estudiante.telefono || null,
            numero_ficha: sheetData.numeroFicha,
            nombre_programa: sheetData.nombrePrograma,
            estado: estudiante.estado || 'ACTIVO',
          };

          console.log(`🔍 Validando estudiante ${studentIndex + 1}:`, {
            documento: importDto.numero_documento,
            nombre: `${importDto.nombres} ${importDto.apellidos}`,
            tipo: importDto.tipo_documento
          });

          // 🔧 VALIDACIÓN FLEXIBLE CON CLASS-VALIDATOR
          const validationErrors = await this.excelValidator.validateImportDto(importDto);
          
          if (validationErrors.length > 0) {
            console.warn(`⚠️ Errores de validación para ${importDto.numero_documento}:`, 
              validationErrors.map(e => `${e.property}: ${Object.values(e.constraints || {}).join(', ')}`));
            
            if (options.flexibleValidation) {
              // 🔧 CON VALIDACIONES FLEXIBLES: Solo rechazar errores críticos
              const errorsCriticos = validationErrors.filter(e => 
                ['numero_documento', 'nombres', 'apellidos'].includes(e.property)
              );
              
              if (errorsCriticos.length > 0) {
                errorsCriticos.forEach(error => {
                  errors.push({
                    row: studentIndex + 1,
                    sheet: sheetData.numeroFicha,
                    field: error.property,
                    value: error.value,
                    message: Object.values(error.constraints || {}).join(', '),
                    severity: 'error',
                  });
                });
              } else {
                // Solo warnings para errores no críticos
                validationErrors.forEach(error => {
                  warnings.push({
                    row: studentIndex + 1,
                    sheet: sheetData.numeroFicha,
                    message: `${error.property}: ${Object.values(error.constraints || {}).join(', ')}`,
                    data: { field: error.property, value: error.value },
                  });
                });
                validRecords.push(importDto);
              }
            } else {
              // 🔧 VALIDACIONES ESTRICTAS: Rechazar cualquier error
              validationErrors.forEach(error => {
                errors.push({
                  row: studentIndex + 1,
                  sheet: sheetData.numeroFicha,
                  field: error.property,
                  value: error.value,
                  message: Object.values(error.constraints || {}).join(', '),
                  severity: 'error',
                });
              });
            }
          } else {
            validRecords.push(importDto);
            console.log(`✅ Estudiante ${importDto.numero_documento} validado correctamente`);
          }

          studentIndex++;

        } catch (error) {
          console.error(`❌ Error procesando estudiante ${studentIndex + 1}:`, error);
          errors.push({
            row: studentIndex + 1,
            sheet: sheetData.numeroFicha,
            field: 'general',
            value: estudiante,
            message: `Error validando estudiante: ${error.message}`,
            severity: 'error',
          });
          studentIndex++;
        }
      }

      // Agregar errores de parsing
      errors.push(...sheetData.errores);
    }

    console.log(`📊 Resumen validación: ${validRecords.length} válidos, ${errors.length} errores, ${warnings.length} advertencias`);

    return {
      validRecords,
      errors,
      warnings,
      totalRecords,
    };
  }

  // 🔧 NUEVO: División inteligente de nombres
  private dividirNombreCompleto(nombreCompleto: string): { nombres: string; apellidos: string } {
    if (!nombreCompleto || nombreCompleto.trim() === '') {
      return { nombres: 'Sin nombre', apellidos: 'Sin apellido' };
    }

    const partes = nombreCompleto.trim().split(/\s+/);
    
    if (partes.length >= 4) {
      // 4+ palabras: primeras 2 = nombres, resto = apellidos
      return {
        nombres: partes.slice(0, 2).join(' '),
        apellidos: partes.slice(2).join(' ')
      };
    } else if (partes.length === 3) {
      // 3 palabras: primera = nombres, resto = apellidos  
      return {
        nombres: partes[0],
        apellidos: partes.slice(1).join(' ')
      };
    } else if (partes.length === 2) {
      // 2 palabras: una para cada uno
      return {
        nombres: partes[0],
        apellidos: partes[1]
      };
    } else {
      // Solo 1 palabra: usar para ambos
      return {
        nombres: partes[0],
        apellidos: partes[0]
      };
    }
  }

  // 🔧 NUEVO: Manejo de duplicados
  private async handleDuplicateRecords(
    validRecords: ImportAprendizDto[],
    options: { updateExisting?: boolean; skipDuplicates?: boolean }
  ): Promise<{ toInsert: ImportAprendizDto[]; toUpdate: ImportAprendizDto[]; skipped: any[] }> {
    const toInsert: ImportAprendizDto[] = [];
    const toUpdate: ImportAprendizDto[] = [];
    const skipped: any[] = [];

    for (const record of validRecords) {
      try {
        const existingPersona = await this.personaRepository.findOne({
          where: { numero_documento: record.numero_documento }
        });

        if (existingPersona) {
          console.log(`🔄 Persona existente encontrada: ${record.numero_documento}`);
          
          if (options.updateExisting) {
            toUpdate.push(record);
            console.log(`✏️ Marcado para actualizar: ${record.numero_documento}`);
          } else if (options.skipDuplicates) {
            skipped.push({
              documento: record.numero_documento,
              nombre: `${record.nombres} ${record.apellidos}`,
              razon: 'Ya existe en la base de datos'
            });
            console.log(`⏭️ Omitido (ya existe): ${record.numero_documento}`);
          } else {
            toInsert.push(record); // Intentar insertar de todos modos
          }
        } else {
          toInsert.push(record);
          console.log(`➕ Marcado para insertar: ${record.numero_documento}`);
        }
      } catch (error) {
        console.error(`❌ Error verificando duplicado para ${record.numero_documento}:`, error);
        toInsert.push(record); // En caso de error, intentar insertar
      }
    }

    return { toInsert, toUpdate, skipped };
  }

  private async executeImport(
    toInsert: ImportAprendizDto[], 
    toUpdate: ImportAprendizDto[],
    options: any
  ) {
    let importedCount = 0;
    let updatedCount = 0;

    // Obtener centro y sede por defecto
    const defaultCentro = await this.centroRepository.findOne({
      where: { codigo_centro: '9207' },
    });

    const defaultSede = await this.sedeRepository.findOne({
      where: { codigo_sede: 'PRINCIPAL' },
    });

    // Usar transacción para la importación
    await this.dataSource.transaction(async (manager) => {
      // 🔧 INSERTAR NUEVOS REGISTROS
      for (const record of toInsert) {
        try {
          // Buscar o crear ficha
          let ficha = await manager.findOne(Ficha, {
            where: { numero_ficha: record.numero_ficha },
          });

          if (!ficha && options.createMissingFichas !== false) {
            const newFicha = manager.create(Ficha, {
              numero_ficha: record.numero_ficha,
              nombre_programa: record.nombre_programa,
              jornada: 'mixta',
              fecha_inicio: new Date(),
              id_centro: defaultCentro?.id_centro,
              id_sede: defaultSede?.id_sede,
            });
            
            ficha = await manager.save(Ficha, newFicha);
            console.log(`✅ Ficha creada: ${record.numero_ficha}`);
          }

          // 🔧 MAPEAR TIPO DE DOCUMENTO PARA LA ENTIDAD
          let tipoDocumento = record.tipo_documento;
          if (tipoDocumento === 'PPT') {
            tipoDocumento = 'PP';
          }

          // Crear persona
          const nuevaPersona = manager.create(Persona, {
            tipo_documento: tipoDocumento as "CC" | "TI" | "CE" | "PEP" | "PP",
            numero_documento: record.numero_documento,
            nombres: record.nombres,
            apellidos: record.apellidos,
            email: record.email || null,
            telefono: record.telefono || null,
            estado: 'activo',
            id_ficha: ficha?.id_ficha || null,
            id_centro: defaultCentro?.id_centro || null,
            id_sede: defaultSede?.id_sede || null,
          });

          await manager.save(Persona, nuevaPersona);
          importedCount++;
          console.log(`✅ Persona creada: ${record.numero_documento} - ${record.nombres} ${record.apellidos}`);

        } catch (error) {
          console.error(`❌ Error importando ${record.numero_documento}:`, error.message);
        }
      }

      // 🔧 ACTUALIZAR REGISTROS EXISTENTES
      for (const record of toUpdate) {
        try {
          const existingPersona = await manager.findOne(Persona, {
            where: { numero_documento: record.numero_documento }
          });

          if (existingPersona) {
            // Actualizar datos
            existingPersona.nombres = record.nombres;
            existingPersona.apellidos = record.apellidos;
            existingPersona.email = record.email || existingPersona.email;
            existingPersona.telefono = record.telefono || existingPersona.telefono;

            await manager.save(Persona, existingPersona);
            updatedCount++;
            console.log(`✏️ Persona actualizada: ${record.numero_documento}`);
          }
        } catch (error) {
          console.error(`❌ Error actualizando ${record.numero_documento}:`, error.message);
        }
      }
    });

    return {
      importedCount,
      updatedCount,
    };
  }

  // 🔧 RESTO DE MÉTODOS SIN CAMBIOS
  async previewExcelImport(file: Express.Multer.File) {
    try {
      const sheetsData = await this.processExcelFile(file);
      
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
        errores: sheet.errores.slice(0, 3),
      }));

      this.cleanupTempFile(file.path);
      
      return {
        success: true,
        preview,
        resumen: {
          totalHojas: sheetsData.length,
          totalRegistros: sheetsData.reduce((sum, s) => sum + s.estudiantes.length, 0),
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

  // 🔧 MÉTODO PARA ESTADÍSTICAS DE TIPOS DE DOCUMENTO
  async getDocumentTypeStatistics(): Promise<any> {
    try {
      const stats = await this.personaRepository
        .createQueryBuilder('persona')
        .select('persona.tipo_documento', 'tipo')
        .addSelect('COUNT(*)', 'cantidad')
        .groupBy('persona.tipo_documento')
        .getRawMany();

      const total = stats.reduce((sum, stat) => sum + parseInt(stat.cantidad), 0);

      return {
        total,
        byType: stats.map(stat => ({
          tipo: stat.tipo,
          cantidad: parseInt(stat.cantidad),
          porcentaje: total > 0 ? ((parseInt(stat.cantidad) / total) * 100).toFixed(2) : '0'
        })),
        timestamp: new Date()
      };
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      return {
        total: 0,
        byType: [],
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  // 🔧 MÉTODO PARA VALIDAR ESTRUCTURA DE EXCEL
  async validateExcelStructure(file: Express.Multer.File): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const workbook = XLSX.readFile(file.path, {
        cellStyles: true,
        cellDates: true,
        sheetStubs: true
      });

      if (workbook.SheetNames.length === 0) {
        errors.push('El archivo no contiene hojas de cálculo');
        return { valid: false, errors, warnings };
      }

      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (jsonData.length < 6) {
          warnings.push(`La hoja "${sheetName}" tiene muy pocas filas (${jsonData.length})`);
          continue;
        }

        // Buscar headers esperados
        let hasValidHeaders = false;
        for (const row of jsonData) {
          if (Array.isArray(row) && 
              row.some(cell => cell && cell.toString().toLowerCase().includes('identificacion')) &&
              row.some(cell => cell && cell.toString().toLowerCase().includes('nombre'))) {
            hasValidHeaders = true;
            break;
          }
        }

        if (!hasValidHeaders) {
          warnings.push(`La hoja "${sheetName}" no parece tener headers válidos`);
        }

        // Buscar código de ficha
        let hasFichaCode = false;
        for (const row of jsonData.slice(0, 10)) {
          if (Array.isArray(row) && 
              row.some(cell => cell && cell.toString().toLowerCase().includes('codigo') && 
                      cell.toString().toLowerCase().includes('ficha'))) {
            hasFichaCode = true;
            break;
          }
        }

        if (!hasFichaCode) {
          warnings.push(`La hoja "${sheetName}" no parece tener código de ficha`);
        }
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings
      };

    } catch (error) {
      errors.push(`Error procesando archivo: ${error.message}`);
      return { valid: false, errors, warnings };
    }
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