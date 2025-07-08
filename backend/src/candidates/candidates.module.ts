// 📁 backend/src/candidates/candidates.module.ts
// ====================================================================
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CandidatesController } from './candidates.controller';
import { CandidatesService } from './candidates.service';
// ✅ IMPORTAR LAS ENTIDADES CORRECTAS
import { Candidato } from './entities/candidato.entity';
import { Persona } from '../users/entities/persona.entity';
import { Eleccion } from '../elections/entities/eleccion.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Candidato,  // ← Usar Candidato, no Candidate
      Persona,    // ← Desde users/entities
      Eleccion    // ← Desde elections/entities
    ])
  ],
  controllers: [CandidatesController],
  providers: [CandidatesService],
  exports: [CandidatesService, TypeOrmModule]
})
export class CandidatesModule {}