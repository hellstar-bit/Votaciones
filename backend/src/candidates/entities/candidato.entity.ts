// 📁 src/candidates/entities/candidato.entity.ts - ACTUALIZADO
// ====================================================================
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Eleccion } from '../../elections/entities/eleccion.entity';
import { Persona } from '../../users/entities/persona.entity';
import { Usuario } from '../../users/entities/usuario.entity';
import { Voto } from '../../votes/entities/voto.entity';

@Entity('candidatos')
@Index('idx_candidato_eleccion', ['id_eleccion'])
@Index('idx_candidato_estado', ['estado'])
export class Candidato {
  @PrimaryGeneratedColumn()
  id_candidato: number;

  @Column()
  id_eleccion: number;

  @Column()
  id_persona: number;

  @Column()
  numero_lista: number;

  @Column({ type: 'text', nullable: true })
  propuestas: string;

  @Column({ length: 500, nullable: true })
  foto_url: string;

  @Column({ default: false })
  validado: boolean;

  @Column({ nullable: true })
  validado_por: number;

  @Column({ type: 'timestamp', nullable: true })
  validado_at: Date;

  // ✅ NUEVO CAMPO: Motivo de rechazo
  @Column({ type: 'text', nullable: true })
  motivo_rechazo: string;

  @Column({ default: 0 })
  votos_recibidos: number;

  // ✅ ACTUALIZADO: Estados más específicos y consistentes con el frontend
  @Column({ type: 'enum', enum: ['pendiente', 'validado', 'rechazado', 'retirado'], default: 'pendiente' })
  estado: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // ✅ RELACIONES CORREGIDAS
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