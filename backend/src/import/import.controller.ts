// 📁 backend/src/import/import.controller.ts - VERSIÓN SIN GUARDS COMPLEJOS
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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImportService } from './import.service';
import { ImportResultDto } from './dto/import-result.dto';

@Controller('import')
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  @Post('excel/aprendices')
  // ✅ SIN GUARDS POR AHORA - Los agregaremos después
  @UseInterceptors(FileInterceptor('file'))
  async importAprendicesFromExcel(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({ 
            fileType: /^application\/(vnd\.ms-excel|vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet)$/
          }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body() options?: { validateFichas?: boolean; createMissingFichas?: boolean }
  ): Promise<ImportResultDto> {
    console.log('🗂️ Iniciando importación de aprendices desde Excel');
    console.log('📁 Archivo:', file.originalname, 'Tamaño:', file.size);
    
    return await this.importService.importAprendicesFromExcel(file, options || {});
  }

  @Post('excel/preview')
  // ✅ SIN GUARDS POR AHORA
  @UseInterceptors(FileInterceptor('file'))
  async previewExcelImport(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }),
          new FileTypeValidator({ 
            fileType: /^application\/(vnd\.ms-excel|vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet)$/
          }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    console.log('👁️ Generando preview de importación Excel');
    return await this.importService.previewExcelImport(file);
  }

  @Get('history')
  // ✅ SIN GUARDS POR AHORA
  async getImportHistory() {
    return await this.importService.getImportHistory();
  }

  @Get('templates/excel')
  // ✅ SIN GUARDS POR AHORA
  async downloadExcelTemplate() {
    return await this.importService.generateExcelTemplate();
  }
}