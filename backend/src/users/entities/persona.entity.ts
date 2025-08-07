import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  ManyToOne, 
  OneToOne, 
  OneToMany, 
  JoinColumn, 
  CreateDateColumn, 
  UpdateDateColumn 
} from 'typeorm';
import { Centro } from './centro.entity';
import { Sede } from './sede.entity';
import { Ficha } from './ficha.entity';
import { Usuario } from './usuario.entity';
import { Candidato } from '../../candidates/entities/candidato.entity';

@Entity('personas')
export class Persona {
  @PrimaryGeneratedColumn()
  id_persona: number;

  // ✅ SIN unique constraint para evitar problemas de duplicados durante importación
  @Column({ length: 25 })
  numero_documento: string;

  @Column({ 
    type: 'enum', 
    enum: ['CC', 'TI', 'CE', 'PEP', 'PPT', 'PP'], 
    default: 'CC' 
  })
  tipo_documento: string;

  @Column({ length: 150 })
  nombres: string;

  @Column({ length: 150 })
  apellidos: string;

  @Column({ length: 200, nullable: true })
  email: string;

  @Column({ length: 25, nullable: true })
  telefono: string;

  @Column({ type: 'date', nullable: true })
  fecha_nacimiento: Date;

  @Column({ length: 255, nullable: true })
  foto_url: string;

  // ✅ IDs como números simples - sin foreign key constraints inmediatos
  @Column({ nullable: true })
  id_centro: number;

  @Column({ nullable: true })
  id_sede: number;

  @Column({ nullable: true })
  id_ficha: number;

  @Column({ 
    type: 'enum', 
    enum: ['mixta', 'nocturna', 'madrugada'], 
    nullable: true 
  })
  jornada: string;

  @Column({ 
    type: 'enum', 
    enum: ['activo', 'inactivo', 'egresado', 'matriculado'], 
    default: 'activo' 
  })
  estado: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // ✅ Relaciones opcionales - con nullable: true para evitar problemas de FK
  @ManyToOne(() => Centro, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'id_centro' })
  centro: Centro;

  @ManyToOne(() => Sede, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'id_sede' })
  sede: Sede;

  @ManyToOne(() => Ficha, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'id_ficha' })
  ficha: Ficha;

  @OneToOne(() => Usuario, usuario => usuario.persona)
  usuario: Usuario;

  @OneToMany(() => Candidato, candidato => candidato.persona)
  candidaturas: Candidato[];

  // Getters útiles
  get nombreCompleto(): string {
    if (!this.nombres || !this.apellidos) {
      return 'Sin nombre';
    }
    return `${this.nombres.trim()} ${this.apellidos.trim()}`.trim();
  }

  get tieneFoto(): boolean {
    return !!this.foto_url;
  }

  get fotoUrl(): string | null {
    if (!this.foto_url) return null;
    
    if (this.foto_url.startsWith('http')) {
      return this.foto_url;
    }
    
    return `${process.env.APP_URL || 'http://localhost:3000'}${this.foto_url}`;
  }
}