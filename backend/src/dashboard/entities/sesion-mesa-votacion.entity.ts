// 📁 src/dashboard/entities/sesion-mesa-votacion.entity.ts
// ====================================================================
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Index } from 'typeorm';
import { Eleccion } from '../../elections/entities/eleccion.entity';
import { Usuario } from '../../users/entities/usuario.entity';
import { Sede } from '../../users/entities/sede.entity';

@Entity('sesiones_mesa_votacion')
@Index('idx_sesion_eleccion', ['id_eleccion'])
@Index('idx_sesion_mesa', ['id_usuario_mesa'])
@Index('idx_sesion_token', ['token_sesion'])
export class SesionMesaVotacion {
  @PrimaryGeneratedColumn()
  id_sesion: number;

  @Column()
  id_eleccion: number;

  @Column()
  id_usuario_mesa: number;

  @Column()
  id_sede: number;

  @Column({ length: 255, unique: true })
  token_sesion: string;

  @Column({ length: 45, nullable: true })
  ip_address: string;

  @CreateDateColumn()
  inicio_sesion: Date;

  @Column({ type: 'timestamp', nullable: true })
  fin_sesion: Date;

  @Column({ default: 0 })
  votos_procesados: number;

  @Column({ type: 'enum', enum: ['activa', 'pausada', 'finalizada'], default: 'activa' })
  estado: string;

  @ManyToOne(() => Eleccion)
  @JoinColumn({ name: 'id_eleccion' })
  eleccion: Eleccion;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'id_usuario_mesa' })
  usuarioMesa: Usuario;

  @ManyToOne(() => Sede)
  @JoinColumn({ name: 'id_sede' })
  sede: Sede;
}