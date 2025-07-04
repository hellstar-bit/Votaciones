// 📁 backend/src/dashboard/dashboard.module.ts - CORREGIDO
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config'; // ✅ AGREGAR ConfigModule
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
    // ✅ IMPORTAR ConfigModule explícitamente
    ConfigModule,
    
    TypeOrmModule.forFeature([
      Eleccion,
      Voto,
      VotanteHabilitado,
      Candidato,
    ]),
    
    // ✅ Usar forwardRef para evitar dependencia circular
    forwardRef(() => ElectionsModule),
    
    // ✅ CONFIGURAR JwtModule correctamente para el módulo
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { 
          expiresIn: configService.get<string>('JWT_EXPIRATION', '24h') 
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [DashboardController],
  providers: [DashboardService, DashboardGateway],
  exports: [DashboardGateway, DashboardService],
})
export class DashboardModule {}