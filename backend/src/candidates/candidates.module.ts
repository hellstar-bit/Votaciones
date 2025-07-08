// src/candidates/candidates.module.ts
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CandidatesController } from './candidates.controller'
import { CandidatesService } from './candidates.service'
import { Candidate } from '../entities/candidate.entity'
import { Persona } from '../entities/persona.entity'
import { Election } from '../entities/election.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([Candidate, Persona, Election])
  ],
  controllers: [CandidatesController],
  providers: [CandidatesService],
  exports: [CandidatesService, TypeOrmModule] // Exportar TypeOrmModule también
})
export class CandidatesModule {}