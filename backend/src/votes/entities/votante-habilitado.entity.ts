// 📁 src/votes/entities/votante-habilitado.entity.ts
// ====================================================================
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Index } from 'typeorm';
import { Eleccion } from '../../elections/entities/eleccion.entity';
import { Persona } from '../../users/entities/persona.entity';

@Entity('votantes_habilitados')
@Index('idx_votante_eleccion', ['id_eleccion'])
@Index('idx_votante_estado', ['ha_votado'])
export class VotanteHabilitado {
  @PrimaryGeneratedColumn()
  id_votante_habilitado: number;

  @Column()
  id_eleccion: number;

  @Column()
  id_persona: number;

  @Column({ default: false })
  ha_votado: boolean;

  @Column({ type: 'timestamp', nullable: true })
  fecha_voto: Date;

  @Column({ length: 45, nullable: true })
  ip_voto: string;

  @Column({ length: 200, nullable: true })
  dispositivo_voto: string;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => Eleccion)
  @JoinColumn({ name: 'id_eleccion' })
  eleccion: Eleccion;

  @ManyToOne(() => Persona)
  @JoinColumn({ name: 'id_persona' })
  persona: Persona;
}