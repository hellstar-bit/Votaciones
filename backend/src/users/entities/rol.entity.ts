// 📁 src/users/entities/rol.entity.ts
// ====================================================================
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn } from 'typeorm';
import { Usuario } from './usuario.entity';

@Entity('roles')
export class Rol {
  @PrimaryGeneratedColumn()
  id_rol: number;

  @Column({ length: 50, unique: true })
  nombre_rol: string;

  @Column({ length: 200, nullable: true })
  descripcion: string;

  @Column({ type: 'json', nullable: true })
  permisos: any;

  @Column({ type: 'enum', enum: ['activo', 'inactivo'], default: 'activo' })
  estado: string;

  @CreateDateColumn()
  created_at: Date;

  @OneToMany(() => Usuario, usuario => usuario.rol)
  usuarios: Usuario[];
}