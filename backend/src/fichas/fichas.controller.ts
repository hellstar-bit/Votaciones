// 📁 src/fichas/fichas.controller.ts
// ====================================================================
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { FichasService } from './fichas.service';

@Controller('fichas')
@UseGuards(JwtAuthGuard)
export class FichasController {
  constructor(private readonly fichasService: FichasService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'INSTRUCTOR')
  async getFichas() {
    return this.fichasService.findAll();
  }

  @Get('active')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'INSTRUCTOR', 'MESA_VOTACION')
  async getActiveFichas() {
    return this.fichasService.findActive();
  }
}