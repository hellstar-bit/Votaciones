import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  OneToMany, 
  CreateDateColumn,
  UpdateDateColumn,
  Index
} from 'typeorm';

@Entity('personas')
@Index('idx_personas_documento', ['numero_documento'])
// 🔧 REMOVER TEMPORALMENTE estos índices que causan problemas
// @Index('idx_personas_centro_sede_ficha', ['id_centro', 'id_sede', 'id_ficha'])
// @Index('idx_personas_centro_activos', ['id_centro', 'estado'])
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

  // 🔧 CAMBIO: Solo números, sin foreign key constraints por ahora
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
  jornada: 'mixta' | 'nocturna' | 'madrugada';

  @Column({ 
    type: 'enum',
    enum: ['activo', 'inactivo', 'graduado', 'retirado'],
    default: 'activo'
  })
  estado: 'activo' | 'inactivo' | 'graduado' | 'retirado';

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // 🔧 NO DEFINIR RELACIONES ManyToOne problemáticas por ahora
  // Las agregaremos después de que funcione la sincronización básica
  
  // Métodos helper
  get nombre_completo(): string {
    return `${this.nombres} ${this.apellidos}`;
  }

  get es_activo(): boolean {
    return this.estado === 'activo';
  }
}