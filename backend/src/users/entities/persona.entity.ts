// 📁 backend/src/users/entities/persona.entity.ts
// ENTIDAD CORREGIDA - SIN UNIQUE CONSTRAINT PROBLEMÁTICO
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Centro } from './centro.entity';
import { Sede } from './sede.entity';
import { Ficha } from './ficha.entity';
import { Usuario } from './usuario.entity';
import { Candidato } from '../../candidates/entities/candidato.entity';

@Entity('personas')
// 🔧 COMENTAR ÍNDICES PROBLEMÁTICOS TEMPORALMENTE
// @Index('idx_documento', ['numero_documento'])
// @Index('idx_centro_sede_ficha', ['id_centro', 'id_sede', 'id_ficha'])
export class Persona {
  @PrimaryGeneratedColumn()
  id_persona: number;

  // 🔧 REMOVER unique: true PARA EVITAR EL ERROR
  @Column({ length: 25 }) // ❌ REMOVER unique: true
  numero_documento: string;

  @Column({ type: 'enum', enum: ['CC', 'TI', 'CE', 'PEP', 'PPT', 'PP'] }) // 🔧 AGREGAR 'PP'
  tipo_documento: string;

  @Column({ length: 150 }) // 🔧 AUMENTAR TAMAÑO
  nombres: string;

  @Column({ length: 150 }) // 🔧 AUMENTAR TAMAÑO
  apellidos: string;

  @Column({ length: 200, nullable: true }) // 🔧 AUMENTAR TAMAÑO
  email: string;

  @Column({ length: 25, nullable: true }) // 🔧 AUMENTAR TAMAÑO
  telefono: string;

  @Column({ type: 'date', nullable: true })
  fecha_nacimiento: Date;

  @Column({ 
    length: 255, 
    nullable: true,
    default: null
  })
  foto_url: string;

  @Column({ nullable: true })
  id_centro: number;

  @Column({ nullable: true })
  id_sede: number;

  @Column({ nullable: true })
  id_ficha: number;

  @Column({ type: 'enum', enum: ['mixta', 'nocturna', 'madrugada'], nullable: true })
  jornada: string;

  @Column({ type: 'enum', enum: ['activo', 'inactivo', 'egresado', 'matriculado'], default: 'activo' }) // 🔧 AGREGAR 'matriculado'
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

  // GETTER PARA NOMBRE COMPLETO (SIN CONSOLE.LOG EXCESIVOS)
  get nombreCompleto(): string {
    if (!this.nombres || !this.apellidos) {
      return 'Sin nombre';
    }
    return `${this.nombres.trim()} ${this.apellidos.trim()}`.trim();
  }

  // MÉTODO HELPER PARA VERIFICAR SI TIENE FOTO
  get tieneFoto(): boolean {
    return !!this.foto_url;
  }

  // MÉTODO HELPER PARA URL COMPLETA DE FOTO
  get fotoUrl(): string | null {
    if (!this.foto_url) return null;
    
    // Si ya es una URL completa, devolverla tal como está
    if (this.foto_url.startsWith('http')) {
      return this.foto_url;
    }
    
    // Si es una ruta relativa, agregar el dominio base
    return `${process.env.APP_URL || 'http://localhost:3000'}${this.foto_url}`;
  }
}