// elections.module.ts - Corregido
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ElectionsService } from './elections.service';
import { ElectionsController } from './elections.controller';
import { Eleccion } from './entities/eleccion.entity';
import { TipoEleccion } from './entities/tipo-eleccion.entity';
import { VotanteHabilitado } from '../votes/entities/votante-habilitado.entity';
import { Persona } from '../users/entities/persona.entity';
import { Voto } from '../votes/entities/voto.entity';
import { Candidato } from '../candidates/entities/candidato.entity';
import { PdfModule } from '../pdf/pdf.module'; // ← AGREGAR ESTO


@Module({
  imports: [
    TypeOrmModule.forFeature([
      Eleccion,
      TipoEleccion,
      VotanteHabilitado,
      Persona,
      Voto,
      Candidato,
    ]),
    PdfModule
  ],
  controllers: [ElectionsController],
  providers: [ElectionsService],
  exports: [ElectionsService],
})
export class ElectionsModule {}