// src/entities/candidate.entity.ts - Actualizada para tu BD
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm'
import { Persona } from './persona.entity'
import { Election } from './election.entity'

@Entity('candidatos')
export class Candidate {
  @PrimaryGeneratedColumn()
  id_candidato: number

  @Column()
  id_eleccion: number

  @Column()
  id_persona: number

  @Column()
  numero_lista: number

  @Column({ type: 'text', nullable: true })
  propuestas: string

  @Column({ length: 500, nullable: true })
  foto_url: string

  @Column({ type: 'boolean', default: 0 })
  validado: boolean

  @Column({ nullable: true })
  validado_por: number

  @Column({ type: 'timestamp', nullable: true })
  validado_at: Date

  @Column({ default: 0 })
  votos_recibidos: number

  @Column({ 
    type: 'enum',
    enum: ['pendiente', 'validado', 'rechazado', 'retirado'],
    default: 'pendiente'
  })
  estado: 'pendiente' | 'validado' | 'rechazado' | 'retirado'

  @Column({ type: 'timestamp', precision: 6, default: () => 'CURRENT_TIMESTAMP(6)' })
  created_at: Date

  @Column({ 
    type: 'timestamp', 
    precision: 6, 
    default: () => 'CURRENT_TIMESTAMP(6)',
    onUpdate: 'CURRENT_TIMESTAMP(6)'
  })
  updated_at: Date

  @Column({ type: 'text', nullable: true })
  motivo_rechazo: string

  // Relaciones
  @ManyToOne(() => Persona, { eager: true })
  @JoinColumn({ name: 'id_persona' })
  persona: Persona

  @ManyToOne(() => Election)
  @JoinColumn({ name: 'id_eleccion' })
  eleccion: Election

  // Métodos helper
  get esta_validado(): boolean {
    return this.estado === 'validado'
  }

  get puede_recibir_votos(): boolean {
    return this.estado === 'validado' && this.eleccion?.esta_activa
  }
}