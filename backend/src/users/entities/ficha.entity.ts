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
import { Sede } from './sede.entity';
import { Persona } from './persona.entity';

@Entity('fichas')
export class Ficha {
  @PrimaryGeneratedColumn()
  id_ficha: number;

  @Column({ length: 20, unique: true })
  numero_ficha: string;

  @Column({ length: 200 })
  nombre_programa: string;

  @Column({ 
    type: 'enum', 
    enum: ['mixta', 'nocturna', 'madrugada'], 
    default: 'mixta' 
  })
  jornada: string;

  @Column({ type: 'date' })
  fecha_inicio: Date;

  @Column({ type: 'date' })
  fecha_fin: Date;

  // ✅ IDs simples sin FK constraint inmediato
  @Column({ nullable: true })
  id_centro: number;

  @Column({ nullable: true })
  id_sede: number;

  @Column({ 
    type: 'enum', 
    enum: ['activa', 'inactiva', 'finalizada'], 
    default: 'activa' 
  })
  estado: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // ✅ Relaciones opcionales con onDelete: SET NULL
  @ManyToOne(() => Centro, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'id_centro' })
  centro: Centro;

  @ManyToOne(() => Sede, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'id_sede' })
  sede: Sede;

  @OneToMany(() => Persona, persona => persona.ficha)
  personas: Persona[];

  // Métodos útiles
  get estaActiva(): boolean {
    const hoy = new Date();
    return this.estado === 'activa' && 
           hoy >= this.fecha_inicio && 
           hoy <= this.fecha_fin;
  }

  get programaCorto(): string {
    return this.nombre_programa.length > 50 
      ? this.nombre_programa.substring(0, 50) + '...'
      : this.nombre_programa;
  }
}
