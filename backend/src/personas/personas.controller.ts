// 📁 src/personas/personas.controller.ts
// ====================================================================
import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { PersonasService } from './personas.service';

@Controller('personas')
@UseGuards(JwtAuthGuard)
export class PersonasController {
  constructor(private readonly personasService: PersonasService) {}

  @Get('aprendices')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async getAprendices(
    @Query('ficha') fichaId?: string,
    @Query('sede') sedeId?: string,
    @Query('centro') centroId?: string,
    @Query('jornada') jornada?: string,
    @Query('search') search?: string
  ) {
    return this.personasService.getAprendices({
      fichaId: fichaId ? parseInt(fichaId) : undefined,
      sedeId: sedeId ? parseInt(sedeId) : undefined,
      centroId: centroId ? parseInt(centroId) : undefined,
      jornada,
      search
    });
  }

  @Get('by-documento/:documento')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'MESA_VOTACION', 'INSTRUCTOR')
  async getByDocumento(@Param('documento') documento: string) {
    return this.personasService.findByDocumento(documento);
  }
}