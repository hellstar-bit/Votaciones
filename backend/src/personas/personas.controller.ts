// 📁 backend/src/personas/personas.controller.ts - VERSIÓN ACTUALIZADA
import { 
  Controller, 
  Get, 
  Post, 
  Patch, 
  Delete, 
  Body, 
  Query, 
  Param, 
  UseGuards, 
  ParseIntPipe,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PersonasService } from './personas.service';
import { CreateAprendizDto } from './dto/create-aprendiz.dto';
import { UpdateAprendizDto } from './dto/update-aprendiz.dto';

@Controller('personas')
@UseGuards(JwtAuthGuard)
export class PersonasController {
  constructor(private readonly personasService: PersonasService) {}

  // 🔧 ENDPOINT EXISTENTE - Obtener aprendices con filtros
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

  // 🚀 NUEVO ENDPOINT - Crear aprendiz
  @Post('aprendices')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  async createAprendiz(
    @Body() createAprendizDto: CreateAprendizDto,
    @CurrentUser('id') userId: number
  ) {
    console.log('📝 === CREANDO NUEVO APRENDIZ ===');
    console.log('Datos recibidos:', createAprendizDto);
    console.log('Usuario:', userId);

    return this.personasService.createAprendiz(createAprendizDto, userId);
  }

  // 🚀 NUEVO ENDPOINT - Actualizar aprendiz
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async updateAprendiz(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAprendizDto: UpdateAprendizDto,
    @CurrentUser('id') userId: number
  ) {
    console.log('✏️ === ACTUALIZANDO APRENDIZ ===');
    console.log('ID del aprendiz:', id);
    console.log('Datos a actualizar:', updateAprendizDto);
    console.log('Usuario:', userId);

    return this.personasService.updateAprendiz(id, updateAprendizDto, userId);
  }

  // 🚀 NUEVO ENDPOINT - Eliminar aprendiz
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async deleteAprendiz(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number
  ) {
    console.log('🗑️ === ELIMINANDO APRENDIZ ===');
    console.log('ID del aprendiz:', id);
    console.log('Usuario:', userId);

    return this.personasService.deleteAprendiz(id, userId);
  }

  // 🚀 NUEVO ENDPOINT - Validar documento único
  @Get('validate-documento')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async validateDocumento(
    @Query('numero_documento') numeroDocumento: string,
    @Query('excludeId') excludeId?: string
  ) {
    console.log('🔍 === VALIDANDO DOCUMENTO ===');
    console.log('Documento:', numeroDocumento);
    console.log('Excluir ID:', excludeId);

    return this.personasService.validateDocumento(
      numeroDocumento, 
      excludeId ? parseInt(excludeId) : undefined
    );
  }

  // 🚀 NUEVO ENDPOINT - Obtener estadísticas de aprendices
  @Get('aprendices/stats')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async getAprendicesStats() {
    console.log('📊 === OBTENIENDO ESTADÍSTICAS ===');
    return this.personasService.getAprendicesStats();
  }

  // 🚀 NUEVO ENDPOINT - Exportar aprendices a CSV
  @Get('aprendices/export')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async exportAprendices(
    @Query('ficha') ficha?: string,
    @Query('sede') sede?: string,
    @Query('centro') centro?: string,
    @Query('jornada') jornada?: string,
    @Query('estado') estado?: string
  ) {
    console.log('📥 === EXPORTANDO APRENDICES ===');
    const filters = { ficha, sede, centro, jornada, estado };
    console.log('Filtros:', filters);

    return this.personasService.exportAprendices(filters);
  }

  // 🚀 NUEVO ENDPOINT - Cambiar estado de aprendiz
  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async changeAprendizStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { estado: string; motivo?: string },
    @CurrentUser('id') userId: number
  ) {
    console.log('🔄 === CAMBIANDO ESTADO ===');
    console.log('ID del aprendiz:', id);
    console.log('Nuevo estado:', body.estado);
    console.log('Motivo:', body.motivo);

    return this.personasService.changeAprendizStatus(id, body.estado, body.motivo, userId);
  }

  // 🚀 NUEVO ENDPOINT - Asignar ficha a aprendiz
  @Patch(':id/ficha')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async assignFicha(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { id_ficha: number },
    @CurrentUser('id') userId: number
  ) {
    console.log('🎓 === ASIGNANDO FICHA ===');
    console.log('ID del aprendiz:', id);
    console.log('ID de la ficha:', body.id_ficha);

    return this.personasService.assignFicha(id, body.id_ficha, userId);
  }

  // 🚀 NUEVO ENDPOINT - Obtener historial de cambios
  @Get(':id/history')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async getAprendizHistory(@Param('id', ParseIntPipe) id: number) {
    console.log('📚 === OBTENIENDO HISTORIAL ===');
    console.log('ID del aprendiz:', id);

    return this.personasService.getAprendizHistory(id);
  }

  // 🔧 ENDPOINT EXISTENTE - Buscar persona por documento
  @Get('by-documento/:documento')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'MESA_VOTACION', 'INSTRUCTOR')
  async getByDocumento(@Param('documento') documento: string) {
    return this.personasService.findByDocumento(documento);
  }

  // 🚀 NUEVO ENDPOINT - Obtener aprendiz por ID (para el modal de edición)
  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async getAprendizById(@Param('id', ParseIntPipe) id: number) {
    console.log('👤 === OBTENIENDO APRENDIZ POR ID ===');
    console.log('ID del aprendiz:', id);

    return this.personasService.getAprendizById(id);
  }
}