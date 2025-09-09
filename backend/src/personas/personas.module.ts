// 📁 backend/src/personas/personas.module.ts - VERSIÓN CORREGIDA
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PersonasService } from './personas.service';
import { PersonasController } from './personas.controller';
import { Persona } from '../users/entities/persona.entity';
import { Ficha } from '../users/entities/ficha.entity';
// ✅ IMPORTACIONES CORRECTAS:
import { Voto } from '../votes/entities/voto.entity';
import { VotanteHabilitado } from '../votes/entities/votante-habilitado.entity';
import { Eleccion } from '../elections/entities/eleccion.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Persona,
      Ficha,
      // ✅ ENTIDADES CORRECTAS:
      Voto,
      VotanteHabilitado,
      Eleccion
    ]),
  ],
  controllers: [PersonasController],
  providers: [PersonasService],
  exports: [PersonasService],
})
export class PersonasModule {}