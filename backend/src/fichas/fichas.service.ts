// 📁 src/fichas/fichas.service.ts
// ====================================================================
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ficha } from '../users/entities/ficha.entity';

@Injectable()
export class FichasService {
  constructor(
    @InjectRepository(Ficha)
    private fichaRepository: Repository<Ficha>,
  ) {}

  async findAll() {
    const fichas = await this.fichaRepository.find({
      relations: ['sede', 'centro'],
      order: { numero_ficha: 'ASC' }
    });

    return fichas.map(ficha => ({
      id_ficha: ficha.id_ficha,
      numero_ficha: ficha.numero_ficha,
      nombre_programa: ficha.nombre_programa,
      jornada: ficha.jornada,
      fecha_inicio: ficha.fecha_inicio,
      fecha_fin: ficha.fecha_fin,
      sede: ficha.sede ? {
        id_sede: ficha.sede.id_sede,
        nombre_sede: ficha.sede.nombre_sede
      } : null,
      centro: ficha.centro ? {
        id_centro: ficha.centro.id_centro,
        nombre_centro: ficha.centro.nombre_centro
      } : null
    }));
  }

  async findActive() {
    const today = new Date();
    
    const fichas = await this.fichaRepository.find({
      where: {
        fecha_inicio: { $lte: today } as any,
        fecha_fin: { $gte: today } as any
      },
      relations: ['sede', 'centro'],
      order: { numero_ficha: 'ASC' }
    });

    return fichas.map(ficha => ({
      id_ficha: ficha.id_ficha,
      numero_ficha: ficha.numero_ficha,
      nombre_programa: ficha.nombre_programa,
      jornada: ficha.jornada,
      fecha_inicio: ficha.fecha_inicio,
      fecha_fin: ficha.fecha_fin,
      sede: ficha.sede ? {
        id_sede: ficha.sede.id_sede,
        nombre_sede: ficha.sede.nombre_sede
      } : null,
      centro: ficha.centro ? {
        id_centro: ficha.centro.id_centro,
        nombre_centro: ficha.centro.nombre_centro
      } : null
    }));
  }

  async findOne(id: number) {
    return this.fichaRepository.findOne({
      where: { id_ficha: id },
      relations: ['sede', 'centro']
    });
  }
}