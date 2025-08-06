// 📁 backend/src/import/dto/import-result.dto.ts
export class ImportResultDto {
  success: boolean;
  summary: ImportSummary;
  errors: ImportError[];
  warnings: ImportWarning[];
  importedRecords: number;
  totalRecords: number;
  executionTime: number;
}

export class ImportSummary {
  totalFiles: number;
  totalSheets: number;
  totalRecords: number;
  importedRecords: number;
  duplicateRecords: number;
  errorRecords: number;
  fichasProcessed: string[];
  programasFound: string[];
}

export class ImportError {
  row: number;
  sheet: string;
  field: string;
  value: any;
  message: string;
  severity: 'error' | 'warning';
}

export class ImportWarning {
  row: number;
  sheet: string;
  message: string;
  data: any;
}