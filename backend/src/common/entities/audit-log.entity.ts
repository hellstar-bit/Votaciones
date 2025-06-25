import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Index } from 'typeorm';
import { Usuario } from '../../users/entities/usuario.entity';

@Entity('audit_logs')
@Index('idx_audit_tabla', ['tabla_afectada'])
@Index('idx_audit_usuario', ['id_usuario'])
@Index('idx_audit_timestamp', ['timestamp_operacion'])
export class AuditLog {
  @PrimaryGeneratedColumn()
  id_log: number;

  @Column({ length: 50 })
  tabla_afectada: string;

  @Column({ type: 'enum', enum: ['INSERT', 'UPDATE', 'DELETE'] })
  operacion: string;

  @Column()
  id_registro: number;

  @Column({ type: 'json', nullable: true })
  datos_anteriores: any;

  @Column({ type: 'json', nullable: true })
  datos_nuevos: any;

  @Column({ nullable: true })
  id_usuario: number;

  @Column({ length: 45, nullable: true })
  ip_address: string;

  @Column({ length: 500, nullable: true })
  user_agent: string;

  @CreateDateColumn()
  timestamp_operacion: Date;

  @ManyToOne(() => Usuario, { nullable: true })
  @JoinColumn({ name: 'id_usuario' })
  usuario: Usuario;
}
