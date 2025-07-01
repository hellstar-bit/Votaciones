// 📁 src/fichas/fichas.module.ts
// ====================================================================
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FichasService } from './fichas.service';
import { FichasController } from './fichas.controller';
import { Ficha } from '../users/entities/ficha.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Ficha]),
  ],
  controllers: [FichasController],
  providers: [FichasService],
  exports: [FichasService],
})
export class FichasModule {}