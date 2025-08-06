// 📁 backend/src/entities/centro.entity.ts - NUEVA ENTIDAD SIMPLE
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Ficha } from './ficha.entity';
import { Persona } from './persona.entity';

@Entity('centros')
export class Centro {
  @PrimaryGeneratedColumn()
  id_centro: number;

  @Column({ unique: true, length: 10 })
  codigo_centro: string;

  @Column({ length: 200 })
  nombre_centro: string;

  @Column({ nullable: true })
  id_regional: number;

  @Column({ length: 200, nullable: true })
  direccion: string;

  @Column({ length: 20, nullable: true })
  telefono: string;

  @Column({ 
    type: 'enum',
    enum: ['activo', 'inactivo'],
    default: 'activo'
  })
  estado: 'activo' | 'inactivo';

  @Column({ type: 'datetime', precision: 6, default: () => 'CURRENT_TIMESTAMP(6)' })
  created_at: Date;

  @Column({ 
    type: 'datetime', 
    precision: 6, 
    default: () => 'CURRENT_TIMESTAMP(6)',
    onUpdate: 'CURRENT_TIMESTAMP(6)'
  })
  updated_at: Date;

  // Relaciones
  @OneToMany(() => Ficha, ficha => ficha.id_centro)
  fichas: Ficha[];

  @OneToMany(() => Persona, persona => persona.id_centro)
  personas: Persona[];
}