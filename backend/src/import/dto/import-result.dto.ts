// 📁 backend/src/import/dto/import-result.dto.ts
// DTO ACTUALIZADO CON PROPIEDADES EXTENDIDAS

export class ImportResultDto {
  success: boolean;
  summary: ImportSummary;
  errors: ImportError[];
  warnings: ImportWarning[];
  importedRecords: number;
  totalRecords: number;
  executionTime: number;
  
  // 🔧 NUEVAS PROPIEDADES PARA VALIDACIONES FLEXIBLES
  duplicatesSkipped?: DuplicateRecord[];
  recordsUpdated?: number;
  warningsCount?: number;
  validationMode?: 'strict' | 'flexible';
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
  
  // 🔧 NUEVAS PROPIEDADES DE RESUMEN
  updatedRecords?: number;
  skippedRecords?: number;
  createdFichas?: string[];
  processingTime?: number;
}

export class ImportError {
  row: number;
  sheet: string;
  field: string;
  value: any;
  message: string;
  severity: 'error' | 'warning';
  
  // 🔧 CONTEXTO ADICIONAL
  originalValue?: any;
  suggestedFix?: string;
  errorCode?: string;
}

export class ImportWarning {
  row: number;
  sheet: string;
  message: string;
  data: any;
  
  // 🔧 TIPO DE WARNING
  type?: 'validation' | 'data_cleanup' | 'mapping' | 'duplicate';
  resolved?: boolean;
}

// 🔧 NUEVA CLASE PARA DUPLICADOS
export class DuplicateRecord {
  documento: string;
  nombre: string;
  razon: string;
  filaOriginal?: number;
  datosExistentes?: any;
  datosNuevos?: any;
}

// 🔧 NUEVA CLASE PARA PREVIEW DE EXCEL
export class ExcelPreviewResult {
  success: boolean;
  preview: PreviewRecord[];
  resumen: PreviewSummary;
  errores?: ImportError[];
  advertencias?: ImportWarning[];
}

export class PreviewRecord {
  documento: string;
  nombre: string;
  email: string;
  telefono: string;
  tipoDocumento?: string;
  estado?: string;
}

export class PreviewSummary {
  totalHojas: number;
  totalRegistros: number;
  totalErrores: number;
  fichas: string[];
  programas: string[];
  
  // 🔧 INFORMACIÓN ADICIONAL DEL PREVIEW
  registrosValidos?: number;
  registrosProblematicos?: number;
  tiposDocumentoEncontrados?: string[];
}

// 🔧 OPCIONES DE IMPORTACIÓN EXTENDIDAS
export interface ImportOptions {
  validateFichas?: boolean;
  createMissingFichas?: boolean;
  updateExisting?: boolean;
  skipDuplicates?: boolean;
  flexibleValidation?: boolean;
  dryRun?: boolean;
  batchSize?: number;
}

// 🔧 RESULTADO DE VALIDACIÓN
export class ValidationResult {
  valid: boolean;
  errors: ImportError[];
  warnings: ImportWarning[];
  cleanedData?: any;
  suggestions?: string[];
}

// 🔧 ESTADÍSTICAS DE TIPOS DE DOCUMENTO
export class DocumentTypeStats {
  total: number;
  byType: DocumentTypeStat[];
  timestamp: Date;
  error?: string;
}

export class DocumentTypeStat {
  tipo: string;
  cantidad: number;
  porcentaje: string;
}

// 🔧 LOG DE IMPORTACIÓN
export class ImportLogDto {
  id: number;
  filename: string;
  originalFilename: string;
  tipoImportacion: string;
  totalRecords: number;
  importedRecords: number;
  duplicateRecords: number;
  errorRecords: number;
  status: string;
  executionTime: number;
  createdAt: Date;
  usuario?: string;
  opciones?: ImportOptions;
}

// 🔧 RESPUESTA DE TEMPLATE
export class TemplateResponse {
  filename: string;
  buffer: Buffer;
  contentType: string;
  size?: number;
  headers?: Record<string, string>;
}

// 🔧 RESPUESTA DE VALIDACIÓN DE ARCHIVO
export class FileValidationResponse {
  valid: boolean;
  errors: string[];
  warnings: string[];
  fileInfo: FileInfo;
  suggestions?: string[];
}

export class FileInfo {
  name: string;
  size: number;
  type: string;
  extension?: string;
  sheets?: string[];
  encoding?: string;
}