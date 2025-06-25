// 📁 src/votes/entities/voto.entity.ts
// ====================================================================
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Index } from 'typeorm';
import { Eleccion } from '../../elections/entities/eleccion.entity';
import { Candidato } from '../../candidates/entities/candidato.entity';

@Entity('votos')
@Index('idx_voto_eleccion', ['id_eleccion'])
@Index('idx_voto_candidato', ['id_candidato'])
@Index('idx_voto_timestamp', ['timestamp_voto'])
export class Voto {
  @PrimaryGeneratedColumn()
  id_voto: number;

  @Column()
  id_eleccion: number;

  @Column({ nullable: true }) // NULL para voto en blanco
  id_candidato: number;

  @Column({ length: 64, unique: true })
  hash_verificacion: string;

  @CreateDateColumn()
  timestamp_voto: Date;

  @ManyToOne(() => Eleccion, eleccion => eleccion.votos)
  @JoinColumn({ name: 'id_eleccion' })
  eleccion: Eleccion;

  @ManyToOne(() => Candidato, candidato => candidato.votos, { nullable: true })
  @JoinColumn({ name: 'id_candidato' })
  candidato: Candidato;
}