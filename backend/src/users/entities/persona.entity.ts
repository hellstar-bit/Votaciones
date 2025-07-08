// 📁 backend/src/users/entities/persona.entity.ts
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

  // ✅ CAMPO AGREGADO PARA FOTO
  @Column({ length: 500, nullable: true })
  foto_url: string;

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

  // ✅ GETTER PARA NOMBRE COMPLETO
  get nombreCompleto(): string {
  console.log('🔍 Calculando nombreCompleto:', { nombres: this.nombres, apellidos: this.apellidos });
  
  if (!this.nombres || !this.apellidos) {
    console.warn('⚠️ Faltan nombres o apellidos:', { nombres: this.nombres, apellidos: this.apellidos });
    return 'Sin nombre';
  }
  
  const resultado = `${this.nombres.trim()} ${this.apellidos.trim()}`.trim();
  console.log('✅ nombreCompleto calculado:', resultado);
  return resultado;
}

  // ✅ MÉTODO HELPER PARA VERIFICAR SI TIENE FOTO
  get tieneFoto(): boolean {
    return !!this.foto_url;
  }

  // ✅ MÉTODO HELPER PARA URL COMPLETA DE FOTO
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