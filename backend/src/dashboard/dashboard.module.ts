// 📁 src/dashboard/dashboard.module.ts
// ====================================================================
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { DashboardGateway } from './dashboard.gateway';
import { Eleccion } from '../elections/entities/eleccion.entity';
import { Voto } from '../votes/entities/voto.entity';
import { VotanteHabilitado } from '../votes/entities/votante-habilitado.entity';
import { Candidato } from '../candidates/entities/candidato.entity';
import { ElectionsModule } from '../elections/elections.module';
import { VotesModule } from '../votes/votes.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Eleccion,
      Voto,
      VotanteHabilitado,
      Candidato,
    ]),
    ElectionsModule,
    VotesModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService, DashboardGateway],
  exports: [DashboardGateway],
})
export class DashboardModule {}