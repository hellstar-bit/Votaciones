// 📁 backend/src/personas/dto/aprendices-stats.dto.ts
export class AprendicesStatsDto {
  total: number;
  activos: number;
  inactivos: number;
  sinFicha: number;
  porJornada: { [key: string]: number };
  porSede: { [key: string]: number };
  porCentro: { [key: string]: number };
}