// 📁 src/users/users.module.ts
// ====================================================================
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Regional } from './entities/regional.entity';
import { Centro } from './entities/centro.entity';
import { Sede } from './entities/sede.entity';
import { Ficha } from './entities/ficha.entity';
import { Rol } from './entities/rol.entity';
import { Persona } from './entities/persona.entity';
import { Usuario } from './entities/usuario.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Regional,
      Centro,
      Sede,
      Ficha,
      Rol,
      Persona,
      Usuario,
    ]),
  ],
  exports: [TypeOrmModule],
})
export class UsersModule {}