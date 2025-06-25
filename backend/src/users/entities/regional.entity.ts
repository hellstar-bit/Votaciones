// 📁 src/users/entities/regional.entity.ts
// ====================================================================
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Centro } from './centro.entity';

@Entity('regionales')
export class Regional {
  @PrimaryGeneratedColumn()
  id_regional: number;

  @Column({ length: 10, unique: true })
  codigo_regional: string;

  @Column({ length: 100 })
  nombre_regional: string;

  @Column({ type: 'enum', enum: ['activo', 'inactivo'], default: 'activo' })
  estado: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // ✅ RELACIÓN CORREGIDA
  @OneToMany(() => Centro, centro => centro.regional)
  centros: Centro[];
}