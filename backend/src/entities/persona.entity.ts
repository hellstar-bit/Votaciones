// src/entities/persona.entity.ts - Actualizada para tu BD
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm'
import { Candidate } from './candidate.entity'

@Entity('personas')
export class Persona {
  @PrimaryGeneratedColumn()
  id_persona: number

  @Column({ unique: true, length: 20 })
  numero_documento: string

  @Column({ 
    type: 'enum',
    enum: ['CC', 'TI', 'CE', 'PEP', 'PPT'],
    default: 'CC'
  })
  tipo_documento: string

  @Column({ length: 100 })
  nombres: string

  @Column({ length: 100 })
  apellidos: string

  @Column({ length: 150, nullable: true })
  email: string

  @Column({ length: 20, nullable: true })
  telefono: string

  @Column({ type: 'date', nullable: true })
  fecha_nacimiento: Date

  // 🆕 Campo para foto que ya existe en tu BD
  @Column({ length: 255, nullable: true })
  foto_url: string

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

  @Column({ 
    type: 'enum',
    enum: ['activo', 'inactivo', 'egresado'],
    default: 'activo'
  })
  estado: string

  @Column({ type: 'datetime', precision: 6, default: () => 'CURRENT_TIMESTAMP(6)' })
  created_at: Date

  @Column({ 
    type: 'datetime', 
    precision: 6, 
    default: () => 'CURRENT_TIMESTAMP(6)',
    onUpdate: 'CURRENT_TIMESTAMP(6)'
  })
  updated_at: Date

  // Relaciones
  @OneToMany(() => Candidate, candidate => candidate.persona)
  candidatos: Candidate[]

  // Computed property para nombre completo
  get nombreCompleto(): string {
    return `${this.nombres} ${this.apellidos}`.trim()
  }
}