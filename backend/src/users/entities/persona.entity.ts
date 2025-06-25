// 📁 src/users/entities/persona.entity.ts
// ====================================================================
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Centro } from './centro.entity';
import { Sede } from './sede.entity';
import { Ficha } from './ficha.entity';
import { Usuario } from './usuario.entity';
import { Candidato } from '../../candidates/entities/candidato.entity';

@Entity('personas')
@Index('idx_documento', ['numero_documento'])
@Index('idx_centro_sede_ficha', ['id_centro', 'id_sede', 'id_ficha'])
export class Persona {
  @PrimaryGeneratedColumn()
  id_persona: number;

  @Column({ length: 20, unique: true })
  numero_documento: string;

  @Column({ type: 'enum', enum: ['CC', 'TI', 'CE', 'PEP', 'PPT'] })
  tipo_documento: string;

  @Column({ length: 100 })
  nombres: string;

  @Column({ length: 100 })
  apellidos: string;

  @Column({ length: 150, nullable: true })
  email: string;

  @Column({ length: 20, nullable: true })
  telefono: string;

  @Column({ type: 'date', nullable: true })
  fecha_nacimiento: Date;

  @Column({ nullable: true })
  id_centro: number;

  @Column({ nullable: true })
  id_sede: number;

  @Column({ nullable: true })
  id_ficha: number;

  @Column({ type: 'enum', enum: ['mixta', 'nocturna', 'madrugada'], nullable: true })
  jornada: string;

  @Column({ type: 'enum', enum: ['activo', 'inactivo', 'egresado'], default: 'activo' })
  estado: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Centro, { nullable: true })
  @JoinColumn({ name: 'id_centro' })
  centro: Centro;

  @ManyToOne(() => Sede, { nullable: true })
  @JoinColumn({ name: 'id_sede' })
  sede: Sede;

  @ManyToOne(() => Ficha, { nullable: true })
  @JoinColumn({ name: 'id_ficha' })
  ficha: Ficha;

  @OneToOne(() => Usuario, usuario => usuario.persona)
  usuario: Usuario;

  @OneToMany(() => Candidato, candidato => candidato.persona)
  candidaturas: Candidato[];

  // Método para obtener nombre completo
  get nombreCompleto(): string {
    return `${this.nombres} ${this.apellidos}`;
  }
}
