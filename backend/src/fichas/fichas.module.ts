// 📁 backend/src/fichas/fichas.module.ts - CORREGIDO
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FichasService } from './fichas.service';
import { FichasController } from './fichas.controller';
import { Ficha } from '../users/entities/ficha.entity';
import { Persona } from '../users/entities/persona.entity'; // ✅ IMPORTAR LA ENTIDAD

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Ficha,
      Persona // ✅ AGREGAR PERSONA PARA QUE PersonaRepository ESTÉ DISPONIBLE
    ]),
  ],
  controllers: [FichasController],
  providers: [FichasService],
  exports: [FichasService],
})
export class FichasModule {}