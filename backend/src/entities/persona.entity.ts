// 📁 backend/src/entities/persona.entity.ts - ENTIDAD COMPLETA
import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  OneToMany, 
  ManyToOne, 
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index
} from 'typeorm';
import { Candidate } from './candidate.entity';
import { Ficha } from './ficha.entity';
import { Centro } from './centro.entity';
import { Sede } from './sede.entity';

@Entity('personas')
@Index('idx_personas_documento', ['numero_documento'])
@Index('idx_personas_centro_sede_ficha', ['id_centro', 'id_sede', 'id_ficha'])
@Index('idx_personas_centro_activos', ['id_centro', 'estado'])
@Index('idx_personas_email', ['email'])
export class Persona {
  @PrimaryGeneratedColumn()
  id_persona: number;

  @Column({ unique: true, length: 20 })
  numero_documento: string;

  @Column({ 
    type: 'enum',
    enum: ['CC', 'TI', 'CE', 'PEP', 'PPT'],
    default: 'CC'
  })
  tipo_documento: 'CC' | 'TI' | 'CE' | 'PEP' | 'PPT';

  @Column({ length: 100 })
  nombres: string;

  @Column({ length: 100 })
  apellidos: string;

  @Column({ length: 150, nullable: true })
  email: string;

  @Column({ length: 20, nullable: true })
  telefono: string;

  @Column({ type: 'date', nullable: true })
  fecha_nacimiento: Date;

  @Column({ length: 255, nullable: true })
  foto_url: string;

  @Column({ nullable: true })
  id_centro: number;

  @Column({ nullable: true })
  id_sede: number;

  @Column({ nullable: true })
  id_ficha: number;

  @Column({ 
    type: 'enum',
    enum: ['mixta', 'nocturna', 'madrugada'],
    nullable: true
  })
  jornada: 'mixta' | 'nocturna' | 'madrugada' | null;

  @Column({ 
    type: 'enum',
    enum: ['activo', 'inactivo', 'egresado', 'retirado', 'suspendido'],
    default: 'activo'
  })
  estado: 'activo' | 'inactivo' | 'egresado' | 'retirado' | 'suspendido';

  // Campos adicionales del SENA
  @Column({ type: 'enum', enum: ['masculino', 'femenino', 'otro'], nullable: true })
  genero: 'masculino' | 'femenino' | 'otro' | null;

  @Column({ length: 100, nullable: true })
  lugar_nacimiento: string;

  @Column({ length: 200, nullable: true })
  direccion: string;

  @Column({ length: 50, nullable: true })
  barrio: string;

  @Column({ length: 50, nullable: true })
  ciudad: string;

  @Column({ length: 20, nullable: true })
  telefono_emergencia: string;

  @Column({ length: 100, nullable: true })
  contacto_emergencia: string;

  // Campos académicos
  @Column({ length: 100, nullable: true })
  nivel_educativo: string;

  @Column({ length: 200, nullable: true })
  institucion_educativa: string;

  @Column({ type: 'date', nullable: true })
  fecha_ingreso_ficha: Date;

  @Column({ type: 'date', nullable: true })
  fecha_fin_formacion: Date;

  // Campos de auditoría
  @CreateDateColumn({ type: 'datetime', precision: 6 })
  created_at: Date;

  @UpdateDateColumn({ type: 'datetime', precision: 6 })
  updated_at: Date;

  @Column({ nullable: true })
  created_by: number;

  @Column({ nullable: true })
  updated_by: number;

  // Relaciones
  @OneToMany(() => Candidate, candidate => candidate.persona)
  candidatos: Candidate[];

  @ManyToOne(() => Ficha, ficha => ficha.aprendices, { nullable: true })
  @JoinColumn({ name: 'id_ficha' })
  ficha: Ficha;

  @ManyToOne(() => Centro, centro => centro.personas, { nullable: true })
  @JoinColumn({ name: 'id_centro' })
  centro: Centro;

  @ManyToOne(() => Sede, sede => sede.personas, { nullable: true })
  @JoinColumn({ name: 'id_sede' })
  sede: Sede;

  // Computed properties
  get nombreCompleto(): string {
    return `${this.nombres} ${this.apellidos}`.trim();
  }

  get edad(): number | null {
    if (!this.fecha_nacimiento) return null;
    const hoy = new Date();
    const fechaNac = new Date(this.fecha_nacimiento);
    let edad = hoy.getFullYear() - fechaNac.getFullYear();
    const mes = hoy.getMonth() - fechaNac.getMonth();
    
    if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) {
      edad--;
    }
    
    return edad;
  }

  get esAprendizActivo(): boolean {
    return this.estado === 'activo' && this.id_ficha !== null;
  }

  get puedeSerCandidato(): boolean {
    return this.esAprendizActivo && this.email !== null;
  }

  get tiempoEnFormacion(): number | null {
    if (!this.fecha_ingreso_ficha) return null;
    const hoy = new Date();
    const fechaIngreso = new Date(this.fecha_ingreso_ficha);
    return Math.floor((hoy.getTime() - fechaIngreso.getTime()) / (1000 * 60 * 60 * 24));
  }

  // Métodos helper
  actualizarEstado(nuevoEstado: Persona['estado'], userId?: number): void {
    this.estado = nuevoEstado;
    this.updated_by = userId || null;
    this.updated_at = new Date();
  }

  asignarFicha(fichaId: number, userId?: number): void {
    this.id_ficha = fichaId;
    this.fecha_ingreso_ficha = new Date();
    this.estado = 'activo';
    this.updated_by = userId || null;
    this.updated_at = new Date();
  }

  graduarAprendiz(userId?: number): void {
    this.estado = 'egresado';
    this.fecha_fin_formacion = new Date();
    this.updated_by = userId || null;
    this.updated_at = new Date();
  }

  // Método para validar datos antes de guardar
  validarDatos(): string[] {
    const errores: string[] = [];

    if (!this.numero_documento || this.numero_documento.length < 6) {
      errores.push('Número de documento inválido');
    }

    if (!this.nombres || this.nombres.length < 2) {
      errores.push('Nombres requeridos');
    }

    if (!this.apellidos || this.apellidos.length < 2) {
      errores.push('Apellidos requeridos');
    }

    if (this.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) {
      errores.push('Email inválido');
    }

    if (this.telefono && !/^[\d\s\-\+\(\)]{7,15}$/.test(this.telefono)) {
      errores.push('Teléfono inválido');
    }

    return errores;
  }

  // Método para obtener información completa como objeto
  toJSON(): any {
    return {
      id_persona: this.id_persona,
      numero_documento: this.numero_documento,
      tipo_documento: this.tipo_documento,
      nombres: this.nombres,
      apellidos: this.apellidos,
      nombreCompleto: this.nombreCompleto,
      email: this.email,
      telefono: this.telefono,
      fecha_nacimiento: this.fecha_nacimiento,
      edad: this.edad,
      foto_url: this.foto_url,
      genero: this.genero,
      direccion: this.direccion,
      ciudad: this.ciudad,
      jornada: this.jornada,
      estado: this.estado,
      esAprendizActivo: this.esAprendizActivo,
      puedeSerCandidato: this.puedeSerCandidato,
      tiempoEnFormacion: this.tiempoEnFormacion,
      fecha_ingreso_ficha: this.fecha_ingreso_ficha,
      fecha_fin_formacion: this.fecha_fin_formacion,
      ficha: this.ficha,
      centro: this.centro,
      sede: this.sede,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }
}