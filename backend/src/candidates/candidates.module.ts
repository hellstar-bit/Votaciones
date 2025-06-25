// 📁 src/candidates/candidates.module.ts
// ====================================================================
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CandidatesService } from './candidates.service';
import { CandidatesController } from './candidates.controller';
import { Candidato } from './entities/candidato.entity';
import { Persona } from '../users/entities/persona.entity';
import { Eleccion } from '../elections/entities/eleccion.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Candidato, Persona, Eleccion]),
  ],
  controllers: [CandidatesController],
  providers: [CandidatesService],
  exports: [CandidatesService],
})
export class CandidatesModule {}