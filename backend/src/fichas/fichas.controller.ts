// 📁 backend/src/fichas/fichas.controller.ts
import { Controller, Get, Param } from '@nestjs/common';
import { FichasService } from './fichas.service';

@Controller('fichas')
export class FichasController {
  constructor(private readonly fichasService: FichasService) {}

  // ✅ ENDPOINT PARA VALIDAR FICHA (mismo que usa gestión de aprendices)
  @Get('validate/:numeroFicha')
  async validateFicha(@Param('numeroFicha') numeroFicha: string) {
    try {
      const ficha = await this.fichasService.findByNumeroFicha(numeroFicha);
      
      if (ficha) {
        return {
          exists: true,
          ficha: {
            id_ficha: ficha.id_ficha,
            numero_ficha: ficha.numero_ficha,
            nombre_programa: ficha.nombre_programa,
            jornada: ficha.jornada,
            estado: ficha.estado
          }
        };
      } else {
        return {
          exists: false,
          message: `La ficha ${numeroFicha} no existe en el sistema`
        };
      }
    } catch (error) {
      return {
        exists: false,
        message: 'Error validando la ficha'
      };
    }
  }
}