// 📁 src/users/entities/regional.entity.ts
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

  @ManyToOne(() => Eleccion, eleccion => eleccion.candidatos)
  @JoinColumn({ name: 'id_eleccion' })
  eleccion: Eleccion;

  @ManyToOne(() => Persona, persona => persona.candidaturas)
  @JoinColumn({ name: 'id_persona' })
  persona: Persona;

  @ManyToOne(() => Usuario, { nullable: true })
  @JoinColumn({ name: 'validado_por' })
  validadoPor: Usuario;

  @OneToMany(() => Voto, voto => voto.candidato)
  votos: Voto[];

  // Método para calcular porcentaje de votos
  get porcentajeVotos(): number {
    if (!this.eleccion || this.eleccion.total_votos_emitidos === 0) return 0;
    return (this.votos_recibidos / this.eleccion.total_votos_emitidos) * 100;
  }
}