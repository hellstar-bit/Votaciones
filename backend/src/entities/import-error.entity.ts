// 📁 backend/src/import/entities/import-error.entity.ts - ENTIDAD COMPLETA
import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  ManyToOne, 
  JoinColumn,
  Index
} from 'typeorm';
import { ImportLog } from './import-log.entity';

@Entity('import_errors')
@Index('idx_import_errors_log', ['id_import_log'])
@Index('idx_import_errors_severity', ['severity'])
@Index('idx_import_errors_field', ['field_name'])
@Index('idx_import_errors_created', ['created_at'])
export class ImportError {
  @PrimaryGeneratedColumn()
  id_import_error: number;

  @Column()
  id_import_log: number;

  // Información de ubicación del error
  @Column()
  row_number: number;

  @Column({ length: 100 })
  sheet_name: string;

  @Column({ length: 10, nullable: true })
  cell_reference: string; // Ej: "A5", "B12"

  @Column({ length: 100, nullable: true })
  field_name: string;

  @Column({ type: 'text', nullable: true })
  field_value: string;

  @Column({ type: 'text', nullable: true })
  expected_value: string;

  // Información del error
  @Column({ type: 'text' })
  error_message: string;

  @Column({ type: 'text', nullable: true })
  detailed_message: string;

  @Column({
    type: 'enum',
    enum: ['error', 'warning', 'info'],
    default: 'error'
  })
  severity: 'error' | 'warning' | 'info';

  @Column({
    type: 'enum',
    enum: [
      'validation',
      'format', 
      'required_field',
      'duplicate',
      'reference',
      'constraint',
      'parsing',
      'business_rule',
      'system'
    ],
    default: 'validation'
  })
  error_type: 'validation' | 'format' | 'required_field' | 'duplicate' | 'reference' | 'constraint' | 'parsing' | 'business_rule' | 'system';

  @Column({ length: 50, nullable: true })
  error_code: string; // Ej: "INVALID_EMAIL", "MISSING_FICHA"

  // Contexto adicional
  @Column({ type: 'json', nullable: true })
  context_data: {
    originalRow?: any[];
    parsedData?: any;
    validationRules?: string[];
    relatedRecords?: any[];
    suggestions?: string[];
  };

  @Column({ type: 'json', nullable: true })
  metadata: {
    columnIndex?: number;
    dataType?: string;
    constraint?: string;
    pattern?: string;
    allowedValues?: string[];
  };

  // Información de resolución
  @Column({ default: false })
  is_resolved: boolean;

  @Column({ type: 'text', nullable: true })
  resolution_notes: string;

  @Column({ type: 'datetime', nullable: true })
  resolved_at: Date;

  @Column({ nullable: true })
  resolved_by: number;

  @Column({
    type: 'enum',
    enum: ['manual_fix', 'auto_correction', 'ignored', 'skipped'],
    nullable: true
  })
  resolution_method: 'manual_fix' | 'auto_correction' | 'ignored' | 'skipped' | null;

  // Información de impacto
  @Column({ default: false })
  blocks_import: boolean; // Si este error impide la importación del registro

  @Column({ default: false })
  affects_related_records: boolean;

  @Column({ type: 'json', nullable: true })
  impact_details: {
    affectedFields?: string[];
    relatedRecords?: number[];
    businessImpact?: string;
    userAction?: string;
  };

  // Campos de auditoría
  @CreateDateColumn({ type: 'datetime', precision: 6 })
  created_at: Date;

  @Column({ type: 'datetime', precision: 6, nullable: true })
  updated_at: Date;

  // Relación
  @ManyToOne(() => ImportLog, importLog => importLog.errors, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_import_log' })
  importLog: ImportLog;

  // Computed properties
  get is_critical(): boolean {
    return this.severity === 'error' && this.blocks_import;
  }

  get can_be_auto_resolved(): boolean {
    return ['format', 'parsing'].includes(this.error_type) && 
           this.context_data?.suggestions?.length > 0;
  }

  get display_message(): string {
    if (this.detailed_message) {
      return this.detailed_message;
    }
    
    let message = this.error_message;
    
    if (this.field_name) {
      message = `Campo "${this.field_name}": ${message}`;
    }
    
    if (this.field_value) {
      message += ` (Valor: "${this.field_value}")`;
    }
    
    return message;
  }

  // Métodos helper
  markAsResolved(method: ImportError['resolution_method'], notes?: string, userId?: number): void {
    this.is_resolved = true;
    this.resolution_method = method;
    this.resolution_notes = notes || null;
    this.resolved_at = new Date();
    this.resolved_by = userId || null;
    this.updated_at = new Date();
  }

  addSuggestion(suggestion: string): void {
    if (!this.context_data) {
      this.context_data = {};
    }
    
    if (!this.context_data.suggestions) {
      this.context_data.suggestions = [];
    }
    
    this.context_data.suggestions.push(suggestion);
  }

  updateContext(contextData: Partial<ImportError['context_data']>): void {
    if (!this.context_data) {
      this.context_data = {};
    }
    
    Object.assign(this.context_data, contextData);
  }

  // Método para formatear el error para logs
  toLogFormat(): string {
    return `[${this.severity.toUpperCase()}] Fila ${this.row_number}, Hoja "${this.sheet_name}"${
      this.field_name ? `, Campo "${this.field_name}"` : ''
    }: ${this.error_message}${
      this.field_value ? ` (Valor: "${this.field_value}")` : ''
    }`;
  }

  // Método para formatear el error para el frontend
  toJSON(): any {
    return {
      id: this.id_import_error,
      fila: this.row_number,
      hoja: this.sheet_name,
      celda: this.cell_reference,
      campo: this.field_name,
      valor: this.field_value,
      valor_esperado: this.expected_value,
      mensaje: this.display_message,
      tipo: this.error_type,
      severidad: this.severity,
      codigo: this.error_code,
      es_critico: this.is_critical,
      bloquea_importacion: this.blocks_import,
      puede_auto_resolverse: this.can_be_auto_resolved,
      resuelto: this.is_resolved,
      metodo_resolucion: this.resolution_method,
      notas_resolucion: this.resolution_notes,
      contexto: this.context_data,
      metadatos: this.metadata,
      impacto: this.impact_details,
      fecha_creacion: this.created_at,
      fecha_resolucion: this.resolved_at,
    };
  }

  // Método estático para crear errores comunes
  static createValidationError(
    importLogId: number,
    row: number,
    sheet: string,
    field: string,
    value: any,
    message: string
  ): ImportError {
    const error = new ImportError();
    error.id_import_log = importLogId;
    error.row_number = row;
    error.sheet_name = sheet;
    error.field_name = field;
    error.field_value = String(value);
    error.error_message = message;
    error.error_type = 'validation';
    error.severity = 'error';
    error.blocks_import = true;
    
    return error;
  }

  static createWarning(
    importLogId: number,
    row: number,
    sheet: string,
    message: string,
    field?: string
  ): ImportError {
    const error = new ImportError();
    error.id_import_log = importLogId;
    error.row_number = row;
    error.sheet_name = sheet;
    error.field_name = field || null;
    error.error_message = message;
    error.error_type = 'business_rule';
    error.severity = 'warning';
    error.blocks_import = false;
    
    return error;
  }
}