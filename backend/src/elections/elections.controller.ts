// 📁 backend/src/elections/elections.controller.ts - Controlador Actualizado
// ====================================================================

import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Patch, 
  UseGuards,
  Request,
  Delete,
  Query, 
  Res,
  ParseIntPipe, 
} from '@nestjs/common';
import { Response } from 'express';
import { PdfService } from '../pdf/pdf.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ElectionsService } from './elections.service';
import { CreateElectionDto } from './dto/create-election.dto';

@Controller('elections')
@UseGuards(JwtAuthGuard)
export class ElectionsController {
  constructor(
    private readonly electionsService: ElectionsService, 
    private readonly pdfService: PdfService,
  ) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async create(
    @Body() createElectionDto: CreateElectionDto,
    @CurrentUser('id') userId: number,
  ) {
    return this.electionsService.create(createElectionDto, userId);
  }

  @Get()
  async findAll(@Request() req) {
    return this.electionsService.findAll(req.user.id, req.user.rol);
  }

  @Get('active')
  async getActive() {
    return this.electionsService.getActiveElections();
  }

  // ✅ ENDPOINT UNIFICADO PARA GENERAR ACTA PDF (VOCEROS Y REPRESENTANTES)
  @Get(':id/acta-pdf')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async generateActaPdf(
    @Param('id') id: string,
    @Query('instructor') instructor: string,
    @Res() res: Response,
  ) {
    console.log('🎯 === BACKEND: Generando acta PDF UNIFICADA ===');
    console.log('Election ID:', id);
    console.log('Instructor:', instructor);
    console.log('URL matcheada: /elections/:id/acta-pdf');
    
    if (!instructor || instructor.trim() === '') {
      console.log('❌ Instructor requerido');
      return res.status(400).json({ 
        message: 'El nombre del instructor es requerido',
        error: 'Bad Request' 
      });
    }

    try {
      console.log('🔄 Llamando al servicio PDF unificado...');
      
      // ✅ EL SERVICIO DETECTA AUTOMÁTICAMENTE EL TIPO DE ELECCIÓN
      const pdfBuffer = await this.pdfService.generateActaEleccion(+id, instructor.trim());
      
      console.log('✅ PDF generado, tamaño:', pdfBuffer.length, 'bytes');
      
      // Verificar que el buffer contiene un PDF válido
      const pdfHeader = pdfBuffer.slice(0, 5).toString();
      console.log('🔍 PDF Header:', pdfHeader);
      
      if (!pdfHeader.startsWith('%PDF')) {
        console.error('❌ Buffer no es un PDF válido!');
        return res.status(500).json({
          message: 'Error: el archivo generado no es un PDF válido'
        });
      }
      
      // Obtener información de la elección para el nombre del archivo
      const eleccion = await this.electionsService.findOne(+id);
      
      // ✅ NOMBRE DE ARCHIVO SEGÚN EL TIPO DE ELECCIÓN
      let fileName: string;
      if (eleccion.tipoEleccion.nombre_tipo === 'REPRESENTANTE_CENTRO') {
        fileName = `acta_representante_centro_${eleccion.jornada || 'general'}_${id}.pdf`;
      } else if (eleccion.tipoEleccion.nombre_tipo === 'VOCERO_FICHA') {
        fileName = `acta_vocero_ficha_${eleccion.ficha?.numero_ficha || 'N/A'}_${id}.pdf`;
      } else {
        fileName = `acta_eleccion_${eleccion.titulo.replace(/\s+/g, '_')}_${id}.pdf`;
      }
      
      console.log('📁 Nombre del archivo:', fileName);
      
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': pdfBuffer.length.toString(),
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      });

      console.log('📤 Enviando PDF al cliente...');
      res.end(pdfBuffer);
      
    } catch (error) {
      console.error('❌ Error generando acta PDF:', error);
      
      // ✅ MANEJO DE ERRORES ESPECÍFICOS
      if (error.message.includes('Tipo de elección no soportado')) {
        return res.status(400).json({
          message: 'Tipo de elección no soportado para generar acta PDF',
          error: error.message
        });
      }
      
      if (error.message.includes('Solo se pueden generar actas de elecciones finalizadas')) {
        return res.status(400).json({
          message: 'Solo se pueden generar actas de elecciones finalizadas',
          error: 'Election not finalized'
        });
      }
      
      return res.status(500).json({
        message: 'Error generando el acta PDF',
        error: error.message
      });
    }
  }

  // ✅ OTROS ENDPOINTS ESPECÍFICOS
  @Get(':id/can-delete')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async canDelete(
    @Param('id') id: string,
    @CurrentUser('id') userId: number,
  ) {
    return this.electionsService.canDeleteElection(+id, userId);
  }

  @Get(':id/stats')
  async getStats(@Param('id') id: string) {
    console.log('📊 === BACKEND: Obteniendo stats ===');
    console.log('Election ID:', id);
    console.log('URL matcheada: /elections/:id/stats');
    return this.electionsService.getElectionStats(+id);
  }

  // ✅ ENDPOINTS DE MODIFICACIÓN
  @Patch(':id/activate')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async activate(
    @Param('id') id: string,
    @CurrentUser('id') userId: number,
  ) {
    return this.electionsService.activate(+id, userId);
  }

  @Patch(':id/finalize')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async finalize(
    @Param('id') id: string,
    @CurrentUser('id') userId: number,
  ) {
    return this.electionsService.finalize(+id, userId);
  }

  @Patch(':id/cancel')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async cancel(
    @Param('id') id: string,
    @CurrentUser('id') userId: number,
  ) {
    return this.electionsService.cancel(+id, userId);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async delete(
    @Param('id') id: string,
    @CurrentUser('id') userId: number,
  ) {
    return this.electionsService.delete(+id, userId);
  }

  // ✅ ENDPOINT GENÉRICO AL FINAL
  @Get(':id')
  async findOne(@Param('id') id: string) {
    console.log('📄 === BACKEND: Obteniendo elección ===');
    console.log('Election ID:', id);
    console.log('URL matcheada: /elections/:id');
    return this.electionsService.findOne(+id);
  }

  @Patch(':id/regenerate-voters')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async regenerateEligibleVoters(@Param('id', ParseIntPipe) id: number) {
    console.log('🔄 === REGENERANDO VOTANTES HABILITADOS ===');
    console.log('ID de elección:', id);
    return this.electionsService.regenerateEligibleVoters(id);
  }
}