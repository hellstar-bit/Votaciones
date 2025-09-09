// 📁 backend/src/fichas/fichas.service.ts - SIN USAR total_aprendices
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ficha } from '../users/entities/ficha.entity';
import { Persona } from '../users/entities/persona.entity';

@Injectable()
export class FichasService {
  constructor(
    @InjectRepository(Ficha)
    private fichaRepository: Repository<Ficha>,
    @InjectRepository(Persona)
    private personaRepository: Repository<Persona>,
  ) {}

  // ✅ MÉTODO HELPER PARA CONTAR APRENDICES
  private async countAprendicesInFicha(fichaId: number): Promise<number> {
    return await this.personaRepository.count({
      where: {
        id_ficha: fichaId,
        estado: 'activo'
      }
    });
  }

  async findAll() {
    const fichas = await this.fichaRepository.find({
      relations: ['sede', 'centro'],
      order: { numero_ficha: 'ASC' }
    });

    // ✅ CALCULAR total_aprendices dinámicamente
    const fichasWithCounts = await Promise.all(
      fichas.map(async (ficha) => {
        const totalAprendices = await this.countAprendicesInFicha(ficha.id_ficha);
        
        return {
          id_ficha: ficha.id_ficha,
          numero_ficha: ficha.numero_ficha,
          nombre_programa: ficha.nombre_programa,
          jornada: ficha.jornada,
          fecha_inicio: ficha.fecha_inicio,
          fecha_fin: ficha.fecha_fin,
          estado: ficha.estado,
          total_aprendices: totalAprendices, // ✅ CALCULADO DINÁMICAMENTE
          sede: ficha.sede ? {
            id_sede: ficha.sede.id_sede,
            nombre_sede: ficha.sede.nombre_sede
          } : null,
          centro: ficha.centro ? {
            id_centro: ficha.centro.id_centro,
            nombre_centro: ficha.centro.nombre_centro
          } : null
        };
      })
    );

    return fichasWithCounts;
  }

  async findActive() {
    const fichas = await this.fichaRepository.find({
      where: {
        estado: 'activa'
      },
      relations: ['sede', 'centro'],
      order: { numero_ficha: 'ASC' }
    });

    // ✅ CALCULAR total_aprendices dinámicamente
    const fichasWithCounts = await Promise.all(
      fichas.map(async (ficha) => {
        const totalAprendices = await this.countAprendicesInFicha(ficha.id_ficha);
        
        return {
          id_ficha: ficha.id_ficha,
          numero_ficha: ficha.numero_ficha,
          nombre_programa: ficha.nombre_programa,
          jornada: ficha.jornada,
          fecha_inicio: ficha.fecha_inicio,
          fecha_fin: ficha.fecha_fin,
          estado: ficha.estado,
          total_aprendices: totalAprendices,
          sede: ficha.sede ? {
            id_sede: ficha.sede.id_sede,
            nombre_sede: ficha.sede.nombre_sede
          } : null,
          centro: ficha.centro ? {
            id_centro: ficha.centro.id_centro,
            nombre_centro: ficha.centro.nombre_centro
          } : null
        };
      })
    );

    return fichasWithCounts;
  }

  async findOne(id: number) {
    const ficha = await this.fichaRepository.findOne({
      where: { id_ficha: id },
      relations: ['sede', 'centro']
    });

    if (!ficha) {
      throw new NotFoundException(`Ficha con ID ${id} no encontrada`);
    }

    return ficha;
  }

  async findByNumeroFicha(numeroFicha: string) {
    console.log('🔍 Buscando ficha por número:', numeroFicha);

    const ficha = await this.fichaRepository.findOne({
      where: { numero_ficha: numeroFicha },
      relations: ['sede', 'centro']
    });

    if (!ficha) {
      console.log('❌ Ficha no encontrada:', numeroFicha);
      return null;
    }

    console.log('✅ Ficha encontrada:', ficha.nombre_programa);
    return ficha;
  }

  async validateFichaExists(numeroFicha: string) {
    console.log('🔍 Validando existencia de ficha:', numeroFicha);

    const ficha = await this.findByNumeroFicha(numeroFicha);
    
    if (!ficha) {
      return {
        exists: false,
        ficha: null
      };
    }

    // ✅ CALCULAR total_aprendices dinámicamente
    const totalAprendices = await this.countAprendicesInFicha(ficha.id_ficha);
    
    return {
      exists: true,
      ficha: {
        id_ficha: ficha.id_ficha,
        numero_ficha: ficha.numero_ficha,
        nombre_programa: ficha.nombre_programa,
        jornada: ficha.jornada,
        estado: ficha.estado,
        total_aprendices: totalAprendices
      }
    };
  }

  async getFichasForVocero() {
    console.log('🎓 Obteniendo fichas disponibles para Vocero de Ficha...');

    const fichas = await this.fichaRepository.find({
      where: {
        estado: 'activa'
      },
      relations: ['sede', 'centro'],
      order: { numero_ficha: 'ASC' }
    });

    // ✅ CALCULAR total_aprendices y FILTRAR
    const fichasWithCounts = await Promise.all(
      fichas.map(async (ficha) => {
        const totalAprendices = await this.countAprendicesInFicha(ficha.id_ficha);
        
        return {
          id_ficha: ficha.id_ficha,
          numero_ficha: ficha.numero_ficha,
          nombre_programa: ficha.nombre_programa,
          jornada: ficha.jornada,
          fecha_inicio: ficha.fecha_inicio,
          fecha_fin: ficha.fecha_fin,
          estado: ficha.estado,
          total_aprendices: totalAprendices,
          sede: ficha.sede ? {
            id_sede: ficha.sede.id_sede,
            nombre_sede: ficha.sede.nombre_sede
          } : null,
          centro: ficha.centro ? {
            id_centro: ficha.centro.id_centro,
            nombre_centro: ficha.centro.nombre_centro
          } : null
        };
      })
    );

    // Filtrar solo las fichas que tienen aprendices
    const fichasConAprendices = fichasWithCounts.filter(ficha => ficha.total_aprendices > 0);

    console.log('✅ Encontradas', fichasConAprendices.length, 'fichas activas con aprendices');
    return fichasConAprendices;
  }

  async getFichasStats() {
    console.log('📊 Calculando estadísticas de fichas...');

    const [
      totalFichas,
      fichasActivas,
      fichasInactivas
    ] = await Promise.all([
      this.fichaRepository.count(),
      this.fichaRepository.count({ where: { estado: 'activa' } }),
      this.fichaRepository.count({ where: { estado: 'inactiva' } })
    ]);

    // ✅ CONTAR FICHAS SIN APRENDICES DINÁMICAMENTE
    const fichasActivas_data = await this.fichaRepository.find({
      where: { estado: 'activa' }
    });

    let fichasSinAprendices = 0;
    for (const ficha of fichasActivas_data) {
      const count = await this.countAprendicesInFicha(ficha.id_ficha);
      if (count === 0) fichasSinAprendices++;
    }

    // Estadísticas por jornada
    const fichasPorJornada = await this.fichaRepository
      .createQueryBuilder('ficha')
      .select('ficha.jornada', 'jornada')
      .addSelect('COUNT(*)', 'count')
      .where('ficha.estado = :estado', { estado: 'activa' })
      .groupBy('ficha.jornada')
      .getRawMany();

    const jornadaStats = fichasPorJornada.reduce((acc, item) => {
      acc[item.jornada || 'sin_jornada'] = parseInt(item.count);
      return acc;
    }, {});

    // ✅ CONTAR TOTAL DE APRENDICES DINÁMICAMENTE
    const totalAprendices = await this.personaRepository.count({
      where: { estado: 'activo' }
    });

    console.log('✅ Estadísticas calculadas');

    return {
      total_fichas: totalFichas,
      fichas_activas: fichasActivas,
      fichas_inactivas: fichasInactivas,
      fichas_sin_aprendices: fichasSinAprendices,
      total_aprendices: totalAprendices,
      por_jornada: jornadaStats
    };
  }

  async searchFichas(filters: {
    search?: string;
    jornada?: string;
    estado?: string;
    sede_id?: number;
    centro_id?: number;
  }) {
    console.log('🔍 Buscando fichas con filtros:', filters);

    let queryBuilder = this.fichaRepository.createQueryBuilder('ficha')
      .leftJoinAndSelect('ficha.sede', 'sede')
      .leftJoinAndSelect('ficha.centro', 'centro');

    // Aplicar filtros
    if (filters.search) {
      queryBuilder = queryBuilder.andWhere(
        '(ficha.numero_ficha LIKE :search OR ficha.nombre_programa LIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    if (filters.jornada) {
      queryBuilder = queryBuilder.andWhere('ficha.jornada = :jornada', { 
        jornada: filters.jornada 
      });
    }

    if (filters.estado) {
      queryBuilder = queryBuilder.andWhere('ficha.estado = :estado', { 
        estado: filters.estado 
      });
    }

    if (filters.sede_id) {
      queryBuilder = queryBuilder.andWhere('ficha.id_sede = :sedeId', { 
        sedeId: filters.sede_id 
      });
    }

    if (filters.centro_id) {
      queryBuilder = queryBuilder.andWhere('ficha.id_centro = :centroId', { 
        centroId: filters.centro_id 
      });
    }

    const fichas = await queryBuilder
      .orderBy('ficha.numero_ficha', 'ASC')
      .getMany();

    // ✅ CALCULAR total_aprendices dinámicamente
    const fichasWithCounts = await Promise.all(
      fichas.map(async (ficha) => {
        const totalAprendices = await this.countAprendicesInFicha(ficha.id_ficha);
        
        return {
          id_ficha: ficha.id_ficha,
          numero_ficha: ficha.numero_ficha,
          nombre_programa: ficha.nombre_programa,
          jornada: ficha.jornada,
          fecha_inicio: ficha.fecha_inicio,
          fecha_fin: ficha.fecha_fin,
          estado: ficha.estado,
          total_aprendices: totalAprendices,
          sede: ficha.sede ? {
            id_sede: ficha.sede.id_sede,
            nombre_sede: ficha.sede.nombre_sede
          } : null,
          centro: ficha.centro ? {
            id_centro: ficha.centro.id_centro,
            nombre_centro: ficha.centro.nombre_centro
          } : null
        };
      })
    );

    console.log('✅ Encontradas', fichasWithCounts.length, 'fichas');
    return fichasWithCounts;
  }
}