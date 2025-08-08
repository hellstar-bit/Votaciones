// 📁 backend/src/entities/sede.entity.ts - NUEVA ENTIDAD SIMPLE
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Ficha } from './ficha.entity';
import { Persona } from './persona.entity';

@Entity('sedes')
export class Sede {
  @PrimaryGeneratedColumn()
  id_sede: number;

  @Column({ length: 20 })
  codigo_sede: string;

  @Column({ length: 200 })
  nombre_sede: string;

  @Column()
  id_centro: number;

  @Column({ length: 200, nullable: true })
  direccion: string;

  @Column({ length: 20, nullable: true })
  telefono: string;

  @Column({ 
    type: 'enum',
    enum: ['activa', 'inactiva'],
    default: 'activa'
  })
  estado: 'activa' | 'inactiva';

  @Column({ type: 'timestamp', precision: 6, default: () => 'CURRENT_TIMESTAMP(6)' })
  created_at: Date;

  @Column({ 
    type: 'timestamp', 
    precision: 6, 
    default: () => 'CURRENT_TIMESTAMP(6)',
    onUpdate: 'CURRENT_TIMESTAMP(6)'
  })
  updated_at: Date;

  // Relaciones
  @OneToMany(() => Ficha, ficha => ficha.id_sede)
  fichas: Ficha[];

  @OneToMany(() => Persona, persona => persona.id_sede)
  personas: Persona[];
}