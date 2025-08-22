// 📁 backend/src/personas/dto/aprendiz-response.dto.ts
export class AprendizResponseDto {
  id_persona: number;
  numero_documento: string;
  tipo_documento: string;
  nombres: string;
  apellidos: string;
  nombreCompleto: string;
  email: string;
  telefono: string;
  estado: string;
  jornada?: string;
  
  ficha?: {
    id_ficha: number;
    numero_ficha: string;
    nombre_programa: string;
    jornada: string;
  };
  
  sede?: {
    id_sede: number;
    nombre_sede: string;
  };
  
  centro?: {
    id_centro: number;
    nombre_centro: string;
  };
}