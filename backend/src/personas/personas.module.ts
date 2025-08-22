// 📁 backend/src/personas/personas.module.ts - VERSIÓN ACTUALIZADA
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PersonasService } from './personas.service';
import { PersonasController } from './personas.controller';
import { Persona } from '../users/entities/persona.entity';
import { Ficha } from '../users/entities/ficha.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Persona,
      Ficha  // 🚀 AGREGADO: Para validar fichas en el service
    ]),
  ],
  controllers: [PersonasController],
  providers: [PersonasService],
  exports: [PersonasService],
})
export class PersonasModule {}