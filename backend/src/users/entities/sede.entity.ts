// 📁 src/users/entities/sede.entity.ts
// ====================================================================
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Centro } from './centro.entity';
import { Ficha } from './ficha.entity';

@Entity('sedes')
export class Sede {
  @PrimaryGeneratedColumn()
  id_sede: number;

  @Column()
  id_centro: number;

  @Column({ length: 10 })
  codigo_sede: string;

  @Column({ length: 100 })
  nombre_sede: string;

  @Column({ length: 200, nullable: true })
  direccion: string;

  @Column({ type: 'enum', enum: ['activo', 'inactivo'], default: 'activo' })
  estado: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Centro, centro => centro.sedes)
  @JoinColumn({ name: 'id_centro' })
  centro: Centro;

  @OneToMany(() => Ficha, ficha => ficha.sede)
  fichas: Ficha[];
}