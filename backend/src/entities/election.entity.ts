// src/entities/election.entity.ts - Usar esta versión temporal
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm'
import { Candidate } from './candidate.entity'

@Entity('elecciones')
export class Election {
  @PrimaryGeneratedColumn()
  id_eleccion: number

  @Column()
  id_tipo_eleccion: number

  @Column({ length: 150 })
  titulo: string

  @Column({ type: 'text', nullable: true })
  descripcion: string

  @Column({ nullable: true })
  id_centro: number

  @Column({ nullable: true })
  id_sede: number

  @Column({ nullable: true })
  id_ficha: number

  @Column({ 
    type: 'enum',
    enum: ['mixta', 'nocturna', 'madrugada'],
    nullable: true
  })
  jornada: string

  @Column({ type: 'datetime' })
  fecha_inicio: Date

  @Column({ type: 'datetime' })
  fecha_fin: Date

  @Column({ 
    type: 'enum',
    enum: ['configuracion', 'activa', 'finalizada', 'cancelada'],
    default: 'configuracion'
  })
  estado: 'configuracion' | 'activa' | 'finalizada' | 'cancelada'

  @Column({ type: 'tinyint', default: 1 })
  permite_voto_blanco: boolean

  @Column({ default: 0 })
  total_votantes_habilitados: number

  @Column({ default: 0 })
  total_votos_emitidos: number

  // 🔧 TEMPORAL: Solo como número, sin foreign key constraint
  @Column({ nullable: true })
  created_by: number

  @Column({ type: 'datetime', precision: 6, default: () => 'CURRENT_TIMESTAMP(6)' })
  created_at: Date

  @Column({ 
    type: 'datetime', 
    precision: 6, 
    default: () => 'CURRENT_TIMESTAMP(6)',
    onUpdate: 'CURRENT_TIMESTAMP(6)'
  })
  updated_at: Date

  // Relación con candidatos (esta sí funciona)
  @OneToMany(() => Candidate, candidate => candidate.eleccion)
  candidatos: Candidate[]

  // Métodos helper
  get porcentaje_participacion(): number {
    if (this.total_votantes_habilitados === 0) return 0
    return (this.total_votos_emitidos / this.total_votantes_habilitados) * 100
  }

  get esta_activa(): boolean {
    const ahora = new Date()
    return this.estado === 'activa' && 
           ahora >= this.fecha_inicio && 
           ahora <= this.fecha_fin
  }

  get puede_modificarse(): boolean {
    return this.estado === 'configuracion'
  }
}