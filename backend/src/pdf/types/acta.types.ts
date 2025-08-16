// 📁 backend/src/pdf/types/acta.types.ts
// ====================================================================
export interface ActaEleccionData {
  eleccion: {
    id_eleccion: number;
    titulo: string;
    fecha_inicio: Date;
    fecha_fin: Date;
    tipoEleccion: {
      descripcion: string;
    };
    centro?: { nombre_centro: string };
    sede?: { nombre_sede: string };
    ficha?: { numero_ficha: string };
  };
  estadisticas: {
    totalVotantes: number;
    totalVotos: number;
    votosBlanco: number;
    ganador: {
      persona: {
        nombres: string;
        apellidos: string;
        numero_documento: string;
        email: string;
        telefono: string;
      };
      votos_recibidos: number;
    } | null;
    porcentajeParticipacion: number;
  };
  instructor: string;
}