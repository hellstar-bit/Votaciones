// 📁 backend/src/personas/dto/assign-ficha.dto.ts
import { IsInt } from 'class-validator';

export class AssignFichaDto {
  @IsInt({ message: 'El ID de la ficha debe ser un número entero' })
  id_ficha: number;
}