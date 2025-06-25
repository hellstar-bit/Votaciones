// 📁 src/users/entities/usuario.entity.ts
// ====================================================================
import { Entity, PrimaryGeneratedColumn, Column, OneToOne, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Persona } from './persona.entity';
import { Rol } from './rol.entity';
import { Exclude } from 'class-transformer';

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn()
  id_usuario: number;

  @Column({ unique: true })
  id_persona: number;

  @Column()
  id_rol: number;

  @Column({ length: 50, unique: true })
  username: string;

  @Column({ length: 255 })
  @Exclude()
  password_hash: string;

  @Column({ type: 'timestamp', nullable: true })
  ultimo_acceso: Date;

  @Column({ default: 0 })
  intentos_fallidos: number;

  @Column({ type: 'timestamp', nullable: true })
  bloqueado_hasta: Date;

  @Column({ type: 'enum', enum: ['activo', 'inactivo', 'bloqueado'], default: 'activo' })
  estado: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToOne(() => Persona, persona => persona.usuario)
  @JoinColumn({ name: 'id_persona' })
  persona: Persona;

  @ManyToOne(() => Rol, rol => rol.usuarios)
  @JoinColumn({ name: 'id_rol' })
  rol: Rol;
}