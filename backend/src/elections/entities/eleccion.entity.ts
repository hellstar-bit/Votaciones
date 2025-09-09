// 📁 src/elections/entities/eleccion.entity.ts
// ====================================================================
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { TipoEleccion } from './tipo-eleccion.entity';
import { Centro } from '../../users/entities/centro.entity';
import { Sede } from '../../users/entities/sede.entity';
import { Ficha } from '../../users/entities/ficha.entity';
import { Usuario } from '../../users/entities/usuario.entity';
import { Candidato } from '../../candidates/entities/candidato.entity';
import { Voto } from '../../votes/entities/voto.entity';

@Entity('elecciones')
@Index('idx_eleccion_fechas', ['fecha_inicio', 'fecha_fin'])
@Index('idx_eleccion_estado', ['estado'])
@Index('idx_eleccion_nivel', ['id_centro', 'id_sede', 'id_ficha'])
export class Eleccion {
  @PrimaryGeneratedColumn()
  id_eleccion: number;

  @Column()
  id_tipo_eleccion: number;

  @Column({ length: 150 })
  titulo: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ nullable: true })
  id_centro: number;

  @Column({ nullable: true })
  id_sede: number;

  @Column({ nullable: true })
  id_ficha: number;

  @Column({ type: 'enum', enum: ['nocturna', '24_horas', 'mixta'], nullable: true })
  jornada: string;

  @Column({ type: 'timestamp' })
  fecha_inicio: Date;

  @Column({ type: 'timestamp' })
  fecha_fin: Date;

  @Column({ type: 'enum', enum: ['configuracion', 'activa', 'finalizada', 'cancelada'], default: 'configuracion' })
  estado: string;

  @Column({ default: true })
  permite_voto_blanco: boolean;

  @Column({ default: 0 })
  total_votantes_habilitados: number;

  @Column({ default: 0 })
  total_votos_emitidos: number;

  @Column()
  created_by: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => TipoEleccion, tipo => tipo.elecciones)
  @JoinColumn({ name: 'id_tipo_eleccion' })
  tipoEleccion: TipoEleccion;

  @ManyToOne(() => Centro, { nullable: true })
  @JoinColumn({ name: 'id_centro' })
  centro: Centro;

  @ManyToOne(() => Sede, { nullable: true })
  @JoinColumn({ name: 'id_sede' })
  sede: Sede;

  @ManyToOne(() => Ficha, { nullable: true })
  @JoinColumn({ name: 'id_ficha' })
  ficha: Ficha;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'created_by' })
  createdBy: Usuario;

  @OneToMany(() => Candidato, candidato => candidato.eleccion)
  candidatos: Candidato[];

  @OneToMany(() => Voto, voto => voto.eleccion)
  votos: Voto[];

  // Método para verificar si está activa
  get estaActiva(): boolean {
    const ahora = new Date();
    return this.estado === 'activa' && 
           ahora >= this.fecha_inicio && 
           ahora <= this.fecha_fin;
  }

  // Método para calcular porcentaje de participación
  get porcentajeParticipacion(): number {
    if (this.total_votantes_habilitados === 0) return 0;
    return (this.total_votos_emitidos / this.total_votantes_habilitados) * 100;
  }
}