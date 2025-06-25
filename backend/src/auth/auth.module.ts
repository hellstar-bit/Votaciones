// 📁 src/auth/auth.module.ts
// ====================================================================
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { Usuario } from '../users/entities/usuario.entity';
import { Persona } from '../users/entities/persona.entity';
import { Rol } from '../users/entities/rol.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Usuario, Persona, Rol]),
    PassportModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}