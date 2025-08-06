// 📁 backend/src/import/import.module.ts - VERSIÓN CORREGIDA CON RUTAS CORRECTAS
import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImportController } from './import.controller';
import { ImportService } from './import.service';
import { ExcelValidatorService } from './validators/excel-validator.service';

// ✅ IMPORTAR DESDE LAS RUTAS CORRECTAS
import { Persona } from '../entities/persona.entity';
import { Ficha } from '../entities/ficha.entity';
import { Centro } from '../entities/centro.entity';
import { Sede } from '../entities/sede.entity';
import { ImportLog } from 'src/entities/import-log.entity';
import { ImportError } from './dto/import-result.dto';


@Module({
  imports: [
    TypeOrmModule.forFeature([
      Persona,     // ✅ Desde ../entities/
      Ficha,       // ✅ Desde ../entities/
      Centro,      // ✅ Desde ../entities/
      Sede,        // ✅ Desde ../entities/
      ImportLog,   // ✅ Desde ./entities/
      ImportError  // ✅ Desde ./entities/
    ]),
    MulterModule.register({
      dest: './uploads/temp',
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  ],
  controllers: [ImportController],
  providers: [ImportService, ExcelValidatorService],
  exports: [ImportService],
})
export class ImportModule {}