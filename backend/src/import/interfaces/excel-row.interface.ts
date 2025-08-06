import { ImportError } from "../dto/import-result.dto";

// 📁 backend/src/import/interfaces/excel-row.interface.ts
export interface ExcelRowData {
  tipoDocumento: string;
  numeroDocumento: string;
  nombreCompleto: string;
  estado: string;
  email: string;
  telefono: string;
  telefonoAlt?: string;
}

export interface ExcelSheetData {
  numeroFicha: string;
  nombrePrograma: string;
  estudiantes: ExcelRowData[];
  errores: ImportError[];
}
