// 📁 src/candidates/entities/candidato.entity.ts
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

  @Column({ default: 0 })
  votos_recibidos: number;

  @Column({ type: 'enum', enum: ['registrado', 'validado', 'rechazado', 'retirado'], default: 'registrado' })
  estado: string;

  @CreateDateColumn()
  created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
  }