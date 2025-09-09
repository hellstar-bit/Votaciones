// 📁 src/elections/entities/tipo-eleccion.entity.ts
// ====================================================================
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn } from 'typeorm';
import { Eleccion } from './eleccion.entity';

@Entity('tipos_eleccion')
export class TipoEleccion {
  id(id: any, arg1: { descripcion: string; }) {
    throw new Error('Method not implemented.');
  }
  @PrimaryGeneratedColumn()
  id_tipo_eleccion: number;

  @Column({ length: 50, unique: true })
  nombre_tipo: string;

  @Column({ length: 200, nullable: true })
  descripcion: string;

  @Column({ type: 'enum', enum: ['centro', 'sede', 'ficha'] })
  nivel_aplicacion: string;

  @Column({ nullable: true })
  max_candidatos_por_jornada: number;

  @Column({ default: false })
  requiere_jornada: boolean;

  @Column({ type: 'enum', enum: ['activo', 'inactivo'], default: 'activo' })
  estado: string;

  @CreateDateColumn()
  created_at: Date;

  @OneToMany(() => Eleccion, eleccion => eleccion.tipoEleccion)
  elecciones: Eleccion[];
  nombre: string;
}