import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
  Get,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImportService } from './import.service';
import { ImportResultDto } from './dto/import-result.dto';

@Controller('import')
export class ImportController {
  private readonly logger = new Logger(ImportController.name);

  constructor(private readonly importService: ImportService) {}

  // 🔧 VALIDACIÓN MÁS FLEXIBLE Y PERMISIVA
  private validateExcelFile(file: Express.Multer.File): void {
    const allowedMimeTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'application/octet-stream', // 🔧 Agregar para manejar uploads sin MIME correcto
    ];

    const allowedExtensions = ['.xlsx', '.xls'];
    const fileExtension = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf('.'));

    this.logger.log(`📁 Validando archivo: ${file.originalname}`, {
      filename: file.originalname,
      mimetype: file.mimetype,
      extension: fileExtension,
      size: file.size
    });

    // Validar tamaño (aumentado a 25MB para archivos grandes)
    if (file.size > 25 * 1024 * 1024) {
      throw new BadRequestException('El archivo es demasiado grande. Máximo 25MB permitido.');
    }

    // Validar que hay contenido
    if (file.size < 100) {
      throw new BadRequestException('El archivo parece estar vacío o corrupto.');
    }

    // Validar extensión (crítico)
    if (!allowedExtensions.includes(fileExtension)) {
      throw new BadRequestException(
        `Extensión de archivo no válida. Solo se permiten: ${allowedExtensions.join(', ')}`
      );
    }

    // 🔧 MIME type más permisivo - solo advertencia
    if (!allowedMimeTypes.includes(file.mimetype)) {
      this.logger.warn(`⚠️ MIME type inusual detectado: ${file.mimetype}, pero se permite por extensión`);
    }

    this.logger.log('✅ Archivo validado correctamente');
  }

  @Post('excel/aprendices')
  @UseInterceptors(FileInterceptor('file'))
  async importAprendicesFromExcel(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any // 🔧 Usar any para recibir opciones flexibles
  ): Promise<ImportResultDto> {
    this.logger.log('🗂️ Iniciando importación de aprendices desde Excel');

    if (!file) {
      throw new BadRequestException('No se ha proporcionado ningún archivo');
    }

    // Validación custom más permisiva
    this.validateExcelFile(file);
    
    // 🔧 OPCIONES FLEXIBLES CON VALORES POR DEFECTO PERMISIVOS
    const options = {
      validateFichas: body.validateFichas === 'true' || body.validateFichas === true || false,
      createMissingFichas: body.createMissingFichas === 'true' || body.createMissingFichas === true || true,
      updateExisting: body.updateExisting === 'true' || body.updateExisting === true || false,
      skipDuplicates: body.skipDuplicates === 'true' || body.skipDuplicates === true || true,
      flexibleValidation: body.flexibleValidation === 'true' || body.flexibleValidation === true || true,
    };

    this.logger.log('🔧 Opciones de importación:', options);
    
    try {
      const result = await this.importService.importAprendicesFromExcel(file, options);
      
      this.logger.log('✅ Importación completada:', {
        success: result.success,
        imported: result.importedRecords,
        errors: result.errors?.length || 0,
        warnings: result.warnings?.length || 0
      });
      
      return result;
      
    } catch (error) {
      this.logger.error('❌ Error durante la importación:', error);
      throw new BadRequestException({
        message: 'Error durante la importación',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  @Post('excel/preview')
  @UseInterceptors(FileInterceptor('file'))
  async previewExcelImport(@UploadedFile() file: Express.Multer.File) {
    this.logger.log('👁️ Generando preview de importación Excel');
    
    if (!file) {
      throw new BadRequestException('No se ha proporcionado ningún archivo');
    }
    
    // Validación custom más permisiva
    this.validateExcelFile(file);
    
    try {
      const preview = await this.importService.previewExcelImport(file);
      
      this.logger.log('✅ Preview generado:', {
        sheets: preview.resumen?.fichas?.length || 0,
        totalRecords: preview.resumen?.totalRegistros || 0,
        errors: preview.resumen?.totalErrores || 0
      });
      
      return preview;
      
    } catch (error) {
      this.logger.error('❌ Error generando preview:', error);
      throw new BadRequestException({
        message: 'Error generando preview del archivo',
        details: error.message
      });
    }
  }

  @Get('history')
  async getImportHistory() {
    try {
      return await this.importService.getImportHistory();
    } catch (error) {
      this.logger.error('❌ Error obteniendo historial:', error);
      throw new BadRequestException('Error obteniendo historial de importaciones');
    }
  }

  @Get('templates/excel')
  async downloadExcelTemplate() {
    try {
      const template = await this.importService.generateExcelTemplate();
      
      return {
        filename: template.filename,
        buffer: template.buffer,
        headers: {
          'Content-Type': template.contentType,
          'Content-Disposition': `attachment; filename="${template.filename}"`
        }
      };
    } catch (error) {
      this.logger.error('❌ Error generando plantilla:', error);
      throw new BadRequestException('Error generando plantilla Excel');
    }
  }

  // 🔧 NUEVO ENDPOINT: Estadísticas de tipos de documento
  @Get('stats/document-types')
  async getDocumentTypeStats() {
    try {
      return await this.importService.getDocumentTypeStatistics();
    } catch (error) {
      this.logger.error('❌ Error obteniendo estadísticas:', error);
      throw new BadRequestException('Error obteniendo estadísticas de tipos de documento');
    }
  }
}