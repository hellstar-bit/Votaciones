// 📁 src/candidates/candidates.module.ts - ACTUALIZADO
// ====================================================================
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CandidatesService } from './candidates.service';
import { CandidatesController } from './candidates.controller';
import { Candidato } from './entities/candidato.entity';
import { Persona } from '../users/entities/persona.entity';
import { Eleccion } from '../elections/entities/eleccion.entity';
import { PersonasModule } from '../personas/personas.module'; // ✅ IMPORTAR PersonasModule

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Candidato,
      Persona,
      Eleccion,
    ]),
    PersonasModule, // ✅ AGREGAR PersonasModule para usar PersonasService
  ],
  controllers: [CandidatesController],
  providers: [CandidatesService],
  exports: [CandidatesService],
})
export class CandidatesModule {}