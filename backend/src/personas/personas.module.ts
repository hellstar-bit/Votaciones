// 📁 src/personas/personas.module.ts
// ====================================================================
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PersonasService } from './personas.service';
import { PersonasController } from './personas.controller';
import { Persona } from '../users/entities/persona.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Persona]),
  ],
  controllers: [PersonasController],
  providers: [PersonasService],
  exports: [PersonasService],
})
export class PersonasModule {}