// 📁 backend/src/entities/ficha.entity.ts - NUEVA ENTIDAD
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Persona } from './persona.entity';

@Entity('fichas')
export class Ficha {
  @PrimaryGeneratedColumn()
  id_ficha: number;

  @Column({ unique: true, length: 20 })
  numero_ficha: string;

  @Column({ length: 200 })
  nombre_programa: string;

  @Column({ 
    type: 'enum',
    enum: ['mixta', 'nocturna', 'madrugada'],
    default: 'mixta'
  })
  jornada: 'mixta' | 'nocturna' | 'madrugada';

  @Column({ type: 'date', nullable: true })
  fecha_inicio: Date;

  @Column({ type: 'date', nullable: true })
  fecha_fin: Date;

  @Column({ nullable: true })
  id_centro: number;

  @Column({ nullable: true })
  id_sede: number;

  @Column({ 
    type: 'enum',
    enum: ['activa', 'inactiva', 'finalizada'],
    default: 'activa'
  })
  estado: 'activa' | 'inactiva' | 'finalizada';

  @Column({ type: 'int', default: 0 })
  total_aprendices: number;

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
  @OneToMany(() => Persona, persona => persona.id_ficha)
  aprendices: Persona[];

  // Métodos helper
  get esta_activa(): boolean {
    return this.estado === 'activa';
  }

  get puede_tener_elecciones(): boolean {
    return this.estado === 'activa' && this.total_aprendices > 0;
  }
}

