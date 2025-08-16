// ====================================================================
import { 
  Controller, 
  Get, 
  Param, 
  Query,
  UseGuards,
  Res,
  NotFoundException 
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { PdfService } from './pdf.service';

@Controller('pdf')
@UseGuards(JwtAuthGuard)
export class PdfController {
  constructor(private readonly pdfService: PdfService) {}

  @Get('acta-eleccion/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async generateActaEleccion(
    @Param('id') id: string,
    @Query('instructor') instructor: string,
    @Res() res: Response,
  ) {
    if (!instructor || instructor.trim() === '') {
      throw new NotFoundException('El nombre del instructor es requerido');
    }

    const pdfBuffer = await this.pdfService.generateActaEleccion(+id, instructor.trim());
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="acta_eleccion_${id}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);
  }
}
