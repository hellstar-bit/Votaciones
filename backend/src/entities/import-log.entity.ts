// 📁 backend/src/import/entities/import-log.entity.ts - ENTIDAD COMPLETA
import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn, 
  ManyToOne, 
  JoinColumn, 
  OneToMany,
  Index
} from 'typeorm';
import { ImportError } from './import-error.entity';

@Entity('import_logs')
@Index('idx_import_logs_status', ['status'])
@Index('idx_import_logs_created', ['created_at'])
@Index('idx_import_logs_usuario', ['id_usuario'])
@Index('idx_import_logs_tipo', ['tipo_importacion'])
export class ImportLog {
  @PrimaryGeneratedColumn()
  id_import_log: number;

  @Column({ length: 255 })
  filename: string;

  @Column({ length: 255 })
  original_filename: string;

  @Column({ 
    type: 'enum',
    enum: ['excel_aprendices', 'excel_instructores', 'csv_aprendices', 'json_datos'],
    default: 'excel_aprendices'
  })
  tipo_importacion: 'excel_aprendices' | 'excel_instructores' | 'csv_aprendices' | 'json_datos';

  // Estadísticas de la importación
  @Column({ default: 0 })
  total_records: number;

  @Column({ default: 0 })
  imported_records: number;

  @Column({ default: 0 })
  duplicate_records: number;

  @Column({ default: 0 })
  error_records: number;

  @Column({ default: 0 })
  warning_records: number;

  @Column({ default: 0 })
  skipped_records: number;

  // Estado y progreso
  @Column({
    type: 'enum',
    enum: ['pending', 'processing', 'completed', 'failed', 'partial', 'cancelled'],
    default: 'pending'
  })
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'partial' | 'cancelled';

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  progress_percentage: number;

  @Column({ nullable: true })
  execution_time_ms: number;

  // Información del archivo
  @Column({ type: 'bigint', nullable: true })
  file_size_bytes: number;

  @Column({ length: 10, nullable: true })
  file_extension: string;

  @Column({ length: 100, nullable: true })
  file_mime_type: string;

  @Column({ length: 64, nullable: true })
  file_hash_md5: string;

  // Metadatos de la importación
  @Column({ type: 'json', nullable: true })
  import_options: {
    validateFichas?: boolean;
    createMissingFichas?: boolean;
    updateExisting?: boolean;
    skipDuplicates?: boolean;
    dryRun?: boolean;
  };

  @Column({ type: 'json', nullable: true })
  file_metadata: {
    totalSheets?: number;
    sheetsProcessed?: string[];
    encoding?: string;
    headers?: string[];
    sampleData?: any[];
  };

  // Resúmenes y resultados
  @Column({ type: 'json', nullable: true })
  errors_summary: Array<{
    severity: 'error' | 'warning';
    message: string;
    count: number;
    examples: string[];
  }>;

  @Column({ type: 'json', nullable: true })
  warnings_summary: Array<{
    message: string;
    count: number;
    details: any;
  }>;

  @Column({ type: 'json', nullable: true })
  fichas_processed: string[];

  @Column({ type: 'json', nullable: true })
  programas_found: string[];

  @Column({ type: 'json', nullable: true })
  statistics: {
    recordsPerSecond?: number;
    memoryUsageMB?: number;
    peakMemoryMB?: number;
    cpuUsagePercent?: number;
    duplicatesFound?: Array<{
      documento: string;
      nombre: string;
      motivo: string;
    }>;
    newFichasCreated?: Array<{
      numero: string;
      programa: string;
    }>;
  };

  // Información de usuario y sesión
  @Column({ nullable: true })
  id_usuario: number;

  @Column({ length: 100, nullable: true })
  usuario_nombre: string;

  @Column({ length: 45, nullable: true })
  ip_address: string;

  @Column({ length: 500, nullable: true })
  user_agent: string;

  @Column({ length: 50, nullable: true })
  session_id: string;

  // Información adicional
  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'text', nullable: true })
  error_details: string;

  @Column({ type: 'json', nullable: true })
  validation_rules: {
    requiredFields?: string[];
    optionalFields?: string[];
    customValidations?: string[];
  };

  // Campos de auditoría
  @CreateDateColumn({ type: 'timestamp', precision: 6 })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', precision: 6 })
  updated_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  started_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  completed_at: Date;

  // Relaciones
  @OneToMany(() => ImportError, error => error.importLog, { cascade: true })
  errors: ImportError[];

  // Computed properties
  get duration_seconds(): number | null {
    if (!this.started_at || !this.completed_at) return null;
    return Math.floor((this.completed_at.getTime() - this.started_at.getTime()) / 1000);
  }

  get success_rate(): number {
    if (this.total_records === 0) return 0;
    return Math.round((this.imported_records / this.total_records) * 10000) / 100;
  }

  get error_rate(): number {
    if (this.total_records === 0) return 0;
    return Math.round((this.error_records / this.total_records) * 10000) / 100;
  }

  get is_completed(): boolean {
    return ['completed', 'failed', 'partial'].includes(this.status);
  }

  get is_successful(): boolean {
    return this.status === 'completed' && this.error_records === 0;
  }

  get has_warnings(): boolean {
    return this.warning_records > 0;
  }

  // Métodos helper
  markAsStarted(): void {
    this.status = 'processing';
    this.started_at = new Date();
    this.progress_percentage = 0;
  }

  markAsCompleted(success: boolean = true): void {
    this.status = success ? 'completed' : 'partial';
    this.completed_at = new Date();
    this.progress_percentage = 100;
    
    if (this.started_at) {
      this.execution_time_ms = Date.now() - this.started_at.getTime();
    }
  }

  markAsFailed(errorMessage?: string): void {
    this.status = 'failed';
    this.completed_at = new Date();
    
    if (errorMessage) {
      this.error_details = errorMessage;
    }
    
    if (this.started_at) {
      this.execution_time_ms = Date.now() - this.started_at.getTime();
    }
  }

  updateProgress(percentage: number): void {
    this.progress_percentage = Math.min(Math.max(percentage, 0), 100);
  }

  addError(error: Partial<ImportError>): void {
    if (!this.errors) {
      this.errors = [];
    }
    
    const newError = new ImportError();
    Object.assign(newError, error);
    newError.importLog = this;
    
    this.errors.push(newError);
    this.error_records = this.errors.filter(e => e.severity === 'error').length;
    this.warning_records = this.errors.filter(e => e.severity === 'warning').length;
  }

  generateSummary(): any {
    return {
      id: this.id_import_log,
      filename: this.original_filename,
      tipo: this.tipo_importacion,
      estado: this.status,
      progreso: this.progress_percentage,
      duracion_segundos: this.duration_seconds,
      tasa_exito: this.success_rate,
      tasa_error: this.error_rate,
      estadisticas: {
        total: this.total_records,
        importados: this.imported_records,
        duplicados: this.duplicate_records,
        errores: this.error_records,
        advertencias: this.warning_records,
        omitidos: this.skipped_records,
      },
      archivos: {
        tamaño_mb: this.file_size_bytes ? (this.file_size_bytes / 1024 / 1024).toFixed(2) : null,
        extension: this.file_extension,
        tipo_mime: this.file_mime_type,
      },
      metadatos: this.file_metadata,
      opciones: this.import_options,
      usuario: this.usuario_nombre,
      fecha_inicio: this.started_at,
      fecha_fin: this.completed_at,
      created_at: this.created_at,
    };
  }
}