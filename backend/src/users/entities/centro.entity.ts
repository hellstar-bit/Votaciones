// 📁 src/users/entities/centro.entity.ts
// ====================================================================
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Regional } from './regional.entity';
import { Sede } from './sede.entity';
import { Ficha } from './ficha.entity';

@Entity('centros')
export class Centro {
  @PrimaryGeneratedColumn()
  id_centro: number;

  @Column()
  id_regional: number;

  @Column({ length: 10, unique: true })
  codigo_centro: string;

  @Column({ length: 150 })
  nombre_centro: string;

  @Column({ type: 'enum', enum: ['activo', 'inactivo'], default: 'activo' })
  estado: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Regional, regional => regional.centros)
  @JoinColumn({ name: 'id_regional' })
  regional: Regional;

  @OneToMany(() => Sede, sede => sede.centro)
  sedes: Sede[];

  @OneToMany(() => Ficha, ficha => ficha.centro)
  fichas: Ficha[];
}
