// 📁 src/elections/elections.module.ts
// ====================================================================
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ElectionsService } from './elections.service';
import { ElectionsController } from './elections.controller';
import { Eleccion } from './entities/eleccion.entity';
import { TipoEleccion } from './entities/tipo-eleccion.entity';
import { VotanteHabilitado } from '../votes/entities/votante-habilitado.entity';
import { Persona } from '../users/entities/persona.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Eleccion,
      TipoEleccion,
      VotanteHabilitado,
      Persona,
    ]),
  ],
  controllers: [ElectionsController],
  providers: [ElectionsService],
  exports: [ElectionsService],
})
export class ElectionsModule {}