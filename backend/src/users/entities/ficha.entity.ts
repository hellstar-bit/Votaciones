// 📁 src/users/entities/ficha.entity.ts
// ====================================================================
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Centro } from './centro.entity';
import { Sede } from './sede.entity';
import { Persona } from './persona.entity';

@Entity('fichas')
export class Ficha {
  @PrimaryGeneratedColumn()
  id_ficha: number;

  @Column()
  id_centro: number;

  @Column()
  id_sede: number;

  @Column({ length: 20, unique: true })
  numero_ficha: string;

  @Column({ length: 150 })
  nombre_programa: string;

  @Column({ type: 'enum', enum: ['mixta', 'nocturna', 'madrugada'] })
  jornada: string;

  @Column({ type: 'date' })
  fecha_inicio: Date;

  @Column({ type: 'date' })
  fecha_fin: Date;

  @Column({ type: 'enum', enum: ['activa', 'finalizada', 'suspendida'], default: 'activa' })
  estado: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Centro, centro => centro.fichas)
  @JoinColumn({ name: 'id_centro' })
  centro: Centro;

  @ManyToOne(() => Sede, sede => sede.fichas)
  @JoinColumn({ name: 'id_sede' })
  sede: Sede;

  @OneToMany(() => Persona, persona => persona.ficha)
  personas: Persona[];
}