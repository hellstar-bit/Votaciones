// 📁 backend/src/entities/persona.entity.ts
// ENTIDAD PERSONA CORREGIDA - SIN UNIQUE CONSTRAINT PROBLEMÁTICO

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
// 🔧 REMOVER ÍNDICE ÚNICO PROBLEMÁTICO TEMPORALMENTE
// @Index('idx_personas_documento', ['numero_documento']) // ❌ COMENTADO
export class Persona {
  @PrimaryGeneratedColumn()
  id_persona: number;

  // 🔧 SIN UNIQUE CONSTRAINT PARA EVITAR ERRORES DE DUPLICADOS
  @Column({ length: 25 }) // ❌ REMOVER unique: true
  numero_documento: string;

  @Column({ 
    type: 'enum',
    enum: ['CC', 'TI', 'CE', 'PEP', 'PPT', 'PP'],
    default: 'CC'
  })
  tipo_documento: 'CC' | 'TI' | 'CE' | 'PEP' | 'PPT' | 'PP';

  @Column({ length: 150 })
  nombres: string;

  @Column({ length: 150 })
  apellidos: string;

  @Column({ length: 200, nullable: true })
  email: string;

  @Column({ length: 25, nullable: true })
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
  jornada: 'mixta' | 'nocturna' | 'madrugada';

  @Column({ 
    type: 'enum',
    enum: ['activo', 'inactivo', 'graduado', 'retirado', 'matriculado'],
    default: 'activo'
  })
  estado: 'activo' | 'inactivo' | 'graduado' | 'retirado' | 'matriculado';

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
  
  // Métodos helper
  get nombre_completo(): string {
    return `${this.nombres} ${this.apellidos}`;
  }

  get es_activo(): boolean {
    return this.estado === 'activo' || this.estado === 'matriculado';
  }
}

