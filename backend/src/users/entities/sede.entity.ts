// 📁 backend/src/users/entities/sede.entity.ts - VERSIÓN CORREGIDA
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
import { Centro } from './centro.entity';
import { Ficha } from './ficha.entity';
import { Persona } from './persona.entity';

@Entity('sedes')
export class Sede {
  @PrimaryGeneratedColumn()
  id_sede: number;

  // ✅ ID como número simple
  @Column({ nullable: true })
  id_centro: number;

  @Column({ length: 20 })
  codigo_sede: string;

  @Column({ length: 200 })
  nombre_sede: string;

  @Column({ length: 200, nullable: true })
  direccion: string;

  @Column({ length: 25, nullable: true })
  telefono: string;

  @Column({ 
    type: 'enum', 
    enum: ['activa', 'inactiva'], 
    default: 'activa' 
  })
  estado: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // ✅ Relación opcional con onDelete: SET NULL
  @ManyToOne(() => Centro, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'id_centro' })
  centro: Centro;

  @OneToMany(() => Ficha, ficha => ficha.sede)
  fichas: Ficha[];

  @OneToMany(() => Persona, persona => persona.sede)
  personas: Persona[];
}