// 📁 src/dashboard/dashboard.module.ts
// ====================================================================
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { DashboardGateway } from './dashboard.gateway';
import { Eleccion } from '../elections/entities/eleccion.entity';
import { Voto } from '../votes/entities/voto.entity';
import { VotanteHabilitado } from '../votes/entities/votante-habilitado.entity';
import { Candidato } from '../candidates/entities/candidato.entity';
import { ElectionsModule } from '../elections/elections.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Eleccion,
      Voto,
      VotanteHabilitado,
      Candidato,
    ]),
    // ✅ Usar forwardRef para evitar dependencia circular
    forwardRef(() => ElectionsModule),
    // ✅ Importar JwtModule explícitamente para el Gateway
    JwtModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService, DashboardGateway],
  exports: [DashboardGateway, DashboardService],
})
export class DashboardModule {}