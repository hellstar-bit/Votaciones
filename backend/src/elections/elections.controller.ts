// 📁 src/elections/elections.controller.ts
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
} from '@nestjs/common';
import { Response } from 'express'; // ← AGREGAR ESTO
import { PdfService } from '../pdf/pdf.service'; // ← AGREGAR ESTO
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ElectionsService } from './elections.service';
import { CreateElectionDto } from './dto/create-election.dto';

@Controller('elections')
@UseGuards(JwtAuthGuard)
export class ElectionsController {
  constructor(private readonly electionsService: ElectionsService, private readonly pdfService: PdfService,) {}

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

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.electionsService.findOne(+id);
  }

  @Get(':id/stats')
  async getStats(@Param('id') id: string) {
    return this.electionsService.getElectionStats(+id);
  }

  @Patch(':id/activate')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async activate(
    @Param('id') id: string,
    @CurrentUser('id') userId: number,
  ) {
    return this.electionsService.activate(+id, userId);
  }

   @Get(':id/acta-pdf')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async generateActaPdf(
    @Param('id') id: string,
    @Query('instructor') instructor: string,
    @Res() res: Response,
  ) {
    if (!instructor || instructor.trim() === '') {
      return res.status(400).json({ 
        message: 'El nombre del instructor es requerido',
        error: 'Bad Request' 
      });
    }

    try {
      const pdfBuffer = await this.pdfService.generateActaEleccion(+id, instructor.trim());
      
      // Obtener información de la elección para el nombre del archivo
      const eleccion = await this.electionsService.findOne(+id);
      const fileName = `acta_eleccion_${eleccion.titulo.replace(/\s+/g, '_')}_${id}.pdf`;
      
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': pdfBuffer.length,
      });

      res.end(pdfBuffer);
    } catch (error) {
      console.error('Error generando acta PDF:', error);
      return res.status(500).json({
        message: 'Error generando el acta PDF',
        error: error.message
      });
    }
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
  @Get(':id/can-delete')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async canDelete(
    @Param('id') id: string,
    @CurrentUser('id') userId: number,
  ) {
    return this.electionsService.canDeleteElection(+id, userId);
  }
}