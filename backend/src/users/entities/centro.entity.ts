// 📁 backend/src/users/entities/centro.entity.ts - VERSIÓN CORREGIDA
// ========================================

import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  ManyToOne, 
  OneToMany, 
  JoinColumn, 
  CreateDateColumn, 
  UpdateDateColumn 
} from 'typeorm';
import { Regional } from './regional.entity';
import { Sede } from './sede.entity';
import { Ficha } from './ficha.entity';
import { Persona } from './persona.entity';

@Entity('centros')
export class Centro {
  @PrimaryGeneratedColumn()
  id_centro: number;

  // ✅ ID como número simple
  @Column({ nullable: true })
  id_regional: number;

  @Column({ length: 20 })
  codigo_centro: string;

  @Column({ length: 200 })
  nombre_centro: string;

  @Column({ length: 200, nullable: true })
  direccion: string;

  @Column({ length: 25, nullable: true })
  telefono: string;

  @Column({ 
    type: 'enum', 
    enum: ['activo', 'inactivo'], 
    default: 'activo' 
  })
  estado: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // ✅ Relación opcional
  @ManyToOne(() => Regional, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'id_regional' })
  regional: Regional;

  @OneToMany(() => Sede, sede => sede.centro)
  sedes: Sede[];

  @OneToMany(() => Ficha, ficha => ficha.centro)
  fichas: Ficha[];

  @OneToMany(() => Persona, persona => persona.centro)
  personas: Persona[];
}