// 📁 src/votes/votes.module.ts
// ====================================================================
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VotesService } from './votes.service';
import { VotesController } from './votes.controller';
import { Voto } from './entities/voto.entity';
import { VotanteHabilitado } from './entities/votante-habilitado.entity';
import { Eleccion } from '../elections/entities/eleccion.entity';
import { Candidato } from '../candidates/entities/candidato.entity';
import { Persona } from '../users/entities/persona.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Voto,
      VotanteHabilitado,
      Eleccion,
      Candidato,
      Persona,
    ]),
  ],
  controllers: [VotesController],
  providers: [VotesService],
  exports: [VotesService],
})
export class VotesModule {}