import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  Get,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImportService } from './import.service';
import { ImportResultDto } from './dto/import-result.dto';

@Controller('import')
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  // 🔧 SOLUCIÓN: Custom validator más permisivo
  private validateExcelFile(file: Express.Multer.File): void {
    const allowedMimeTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
    ];

    const allowedExtensions = ['.xlsx', '.xls'];
    const fileExtension = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf('.'));

    console.log('📁 Validando archivo:', {
      filename: file.originalname,
      mimetype: file.mimetype,
      extension: fileExtension,
      size: file.size
    });

    // Validar tamaño
    if (file.size > 10 * 1024 * 1024) {
      throw new BadRequestException('El archivo es demasiado grande. Máximo 10MB permitido.');
    }

    // Validar extensión
    if (!allowedExtensions.includes(fileExtension)) {
      throw new BadRequestException(`Extensión de archivo no válida. Solo se permiten: ${allowedExtensions.join(', ')}`);
    }

    // Validar MIME type (más permisivo)
    if (!allowedMimeTypes.includes(file.mimetype)) {
      console.warn(`⚠️ MIME type no estándar detectado: ${file.mimetype}`);
      // Solo advertencia, no error - permitir si la extensión es correcta
    }
  }

  @Post('excel/aprendices')
  @UseInterceptors(FileInterceptor('file'))
  async importAprendicesFromExcel(
    @UploadedFile() file: Express.Multer.File,
    @Body() options?: { validateFichas?: boolean; createMissingFichas?: boolean }
  ): Promise<ImportResultDto> {
    console.log('🗂️ Iniciando importación de aprendices desde Excel');

    // Validación custom más permisiva
    this.validateExcelFile(file);
    
    return await this.importService.importAprendicesFromExcel(file, options || {});
  }

  @Post('excel/preview')
  @UseInterceptors(FileInterceptor('file'))
  async previewExcelImport(
    @UploadedFile() file: Express.Multer.File,
  ) {
    console.log('👁️ Generando preview de importación Excel');
    
    // Validación custom más permisiva
    this.validateExcelFile(file);
    
    return await this.importService.previewExcelImport(file);
  }

  @Get('history')
  async getImportHistory() {
    return await this.importService.getImportHistory();
  }

  @Get('templates/excel')
  async downloadExcelTemplate() {
    return await this.importService.generateExcelTemplate();
  }
}
